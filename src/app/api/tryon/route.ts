import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { products as fallbackProducts, type Product } from "@/lib/products";
import { getDb } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";
import { recordBehaviorEvent, rebuildUserStyleProfile } from "@/lib/server/style-learning";
import { fromProductRow } from "@/lib/server/product-db";
import { runHuggingFaceFashn, imageSourceToDataUri, tryReadLocalFile } from "@/lib/server/huggingface-fashn";
import { runIdmVton } from "@/lib/server/idm-vton";
import { runGeminiTryOn } from "@/lib/server/gemini-tryon";
import { upscaleImage, withTimeout } from "@/lib/server/upscale";
import { isValidOutfit, sortOutfitProducts } from "@/lib/wardrobe";

export const runtime = "nodejs";
export const maxDuration = 300;

type TryOnProvider = "fashn-api-v1.6" | "huggingface-fashn-vton-1.5" | "idm-vton" | "gemini-tryon" | "hybrid-fallback";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ảnh kết quả từ Hugging Face Space là URL có chữ ký (__sign=...) và sẽ hết hạn,
 * nên tải về và nhúng thành data URL để kết quả hiển thị bền (client + DB + admin).
 * Nếu tải lỗi thì giữ nguyên URL gốc.
 */
async function inlineRemoteImage(source: string): Promise<string> {
  if (!/^https?:\/\//i.test(source)) return source;
  try {
    const response = await fetch(source);
    if (!response.ok) return source;
    const mime = response.headers.get("content-type") ?? "image/webp";
    if (!mime.startsWith("image/")) return source;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > 12 * 1024 * 1024) return source;
    return `data:${mime.split(";")[0]};base64,${buffer.toString("base64")}`;
  } catch {
    return source;
  }
}

function categoryFor(product: Product): "tops" | "bottoms" | "one-pieces" {
  // Product category is the canonical source of truth. Do not let stale try-on
  // metadata turn a dress into a bottom/skirt for the VTON provider.
  if (product.category === "dress" || product.category === "set") return "one-pieces";
  if (product.category === "bottoms") return "bottoms";
  if (product.category === "tops" || product.category === "outerwear") return "tops";
  return product.tryOnCategory ?? "tops";
}

function isLongDress(product: Product) {
  return product.category === "dress" && (
    product.lengthClass === "maxi" ||
    product.lengthClass === "midi" ||
    product.type === "maxi-dress" ||
    product.type === "midi-dress" ||
    /maxi|midi|floor|ankle|long dress|đầm dài|váy dài/i.test(
      [product.name, product.subtitle, product.silhouette, product.fit].filter(Boolean).join(" ")
    )
  );
}

function photoTypeFor(product: Product): "flat-lay" | "model" {
  return product.tryOnPhotoType === "flat-lay" ? "flat-lay" : "model";
}

async function getProducts(productIds: string[]) {
  const db = getDb();
  if (!db) {
    return productIds.flatMap((id) => {
      const product = fallbackProducts.find(
        (item) => item.id === id && item.active !== false && Boolean(item.tryOnImage)
      );
      return product ? [product] : [];
    });
  }

  const rows = await db.product.findMany({
    where: { id: { in: productIds }, active: true, tryOnImage: { not: null } },
    include: {
      variants: { where: { active: true } }
    }
  });

  const map = new Map(rows.map((row) => [row.id, fromProductRow(row)]));
  return productIds.flatMap((id) => {
    const product = map.get(id);
    return product ? [product] : [];
  });
}

async function runOfficialFashn(input: {
  apiKey: string;
  modelImage: string;
  garmentImage: string;
  category: "tops" | "bottoms" | "one-pieces";
}) {
  const run = await fetch("https://api.fashn.ai/v1/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model_name: "tryon-v1.6",
      inputs: {
        model_image: input.modelImage,
        garment_image: input.garmentImage,
        category: input.category,
        mode: "balanced",
        output_format: "jpeg",
        moderation_level: "conservative"
      }
    })
  });

  if (!run.ok) {
    const detail = await run.text();
    throw new Error(`FASHN API không nhận request: ${detail}`);
  }

  const initial = await run.json() as { id?: string };
  if (!initial.id) throw new Error("FASHN API không trả prediction id.");

  for (let attempt = 0; attempt < 45; attempt += 1) {
    await sleep(1000);

    const statusResponse = await fetch(
      `https://api.fashn.ai/v1/status/${initial.id}`,
      {
        headers: { Authorization: `Bearer ${input.apiKey}` },
        cache: "no-store"
      }
    );

    if (!statusResponse.ok) continue;

    const status = await statusResponse.json() as {
      status?: string;
      output?: string[];
      error?: { message?: string };
    };

    if (status.status === "completed") {
      const output = status.output?.[0];
      if (!output) throw new Error("FASHN API hoàn tất nhưng không trả ảnh.");
      return output;
    }

    if (status.status === "failed") {
      throw new Error(status.error?.message ?? "FASHN API try-on thất bại.");
    }
  }

  throw new Error("FASHN API xử lý quá lâu.");
}

async function runTryOnProvider(input: {
  modelImage: string;
  product: Product;
  baseUrl: string;
  engine?: "auto" | "gemini" | "fashn" | "idm";
  isOuterwearLayer?: boolean;
}): Promise<{ output: string; provider: TryOnProvider }> {
  const garmentImage = input.product.tryOnImage;
  if (!garmentImage) throw new Error(`${input.product.name} chưa có ảnh chuẩn cho Try-On.`);

  // If garmentImage is a local file, convert to base64 data URI so remote APIs have direct access
  const dataUri = imageSourceToDataUri(garmentImage);
  const resolvedGarment = dataUri ?? garmentImage;

  const category = categoryFor(input.product);
  const isUpperOrOuter = input.product.category === "outerwear" || input.product.category === "tops" || category === "tops";

  // Priority 1 for Tops & Outerwear: IDM-VTON provides superior fitting, preserving natural neckline and layering without hallucinated shirts
  if (input.engine !== "fashn" && isUpperOrOuter) {
    try {
      const output = await runIdmVton({
        modelImage: input.modelImage,
        garmentImage: resolvedGarment,
        product: input.product,
        baseUrl: input.baseUrl,
        isOuterwearLayer: input.isOuterwearLayer
      });
      return { output, provider: "idm-vton" };
    } catch (idmError) {
      console.warn("IDM-VTON failed; falling back to FASHN:", idmError instanceof Error ? idmError.message : idmError);
    }
  }

  const apiKey = process.env.FASHN_API_KEY?.trim();

  if (apiKey) {
    try {
      const output = await runOfficialFashn({
        apiKey,
        modelImage: input.modelImage,
        garmentImage: resolvedGarment,
        category
      });
      return { output, provider: "fashn-api-v1.6" };
    } catch (error) {
      console.warn(
        "FASHN API failed; falling back to Hugging Face ZeroGPU:",
        error instanceof Error ? error.message : error
      );
    }
  }

  const output = await runHuggingFaceFashn({
    modelImage: input.modelImage,
    garmentImage: resolvedGarment,
    category,
    photoType: photoTypeFor(input.product),
    baseUrl: input.baseUrl,
    segmentationFree: false
  });

  return { output, provider: "huggingface-fashn-vton-1.5" };
}

export async function POST(request: Request) {
  const db = getDb();
  let session: { id: string } | null = null;
  try {
    const body = await request.json() as {
      modelImage?: string;
      productIds?: string[];
      engine?: "auto" | "gemini" | "fashn" | "idm";
    };

    const modelImage = String(body.modelImage ?? "");
    const productIds = Array.isArray(body.productIds)
      ? Array.from(new Set(body.productIds.map(String))).slice(0, 3)
      : [];

    if (!modelImage || !productIds.length) {
      return NextResponse.json(
        { error: "Thiếu ảnh người hoặc danh sách sản phẩm." },
        { status: 400 }
      );
    }

    const isValidModelImage =
      modelImage.startsWith("data:image/") ||
      modelImage.startsWith("https://") ||
      modelImage.startsWith("http://") ||
      Boolean(tryReadLocalFile(modelImage));

    if (!isValidModelImage) {
      return NextResponse.json({ error: "Ảnh người không hợp lệ." }, { status: 400 });
    }

    const requestOrigin = new URL(request.url).origin;
    const user = await getCurrentUser();
    const selected = await getProducts(productIds);

    if (selected.length !== productIds.length) {
      return NextResponse.json(
        { error: "Có sản phẩm chưa được chuẩn hóa cho phòng thử đồ." },
        { status: 400 }
      );
    }

    if (!isValidOutfit(selected)) {
      return NextResponse.json(
        {
          error:
            "Outfit chưa hoàn chỉnh. Hãy chọn áo + quần/chân váy (+ áo khoác), hoặc một váy/đầm."
        },
        { status: 400 }
      );
    }

    const ordered = sortOutfitProducts(selected);
    const categorySequence = ordered.map(categoryFor);
    const personImageHash = createHash("sha256").update(modelImage).digest("hex");

    session = db
      ? await db.tryOnSession.create({
          data: {
            userId: user?.id ?? null,
            personImageHash,
            productIds: ordered.map((product) => product.id),
            categorySequence,
            status: "processing"
          }
        })
      : null;

    if (db) {
      for (const product of ordered) {
        await recordBehaviorEvent({
          db,
          userId: user?.id,
          productId: product.id,
          type: "tryon_start",
          source: "virtual-fitting-room",
          metadata: {
            sessionId: session?.id,
            category: categoryFor(product),
            providerPreference: process.env.FASHN_API_KEY
              ? "fashn-api-then-hf"
              : "huggingface-zero-gpu"
          }
        });
      }
    }

    let currentImage = modelImage;
    const steps: Array<{
      productId: string;
      output: string;
      provider: TryOnProvider;
    }> = [];

    // Long one-piece dresses need strong global silhouette preservation. FASHN can
    // occasionally shorten a maxi/midi garment into a skirt-like result, so Auto
    // prefers Gemini for these items and keeps sequential VTON as the fallback.
    const containsLongDress = ordered.some(isLongDress);
    const preferGemini =
      Boolean(process.env.GEMINI_API_KEY) &&
      (body.engine === "gemini" || (body.engine === "auto" && containsLongDress));

    if (preferGemini) {
      try {
        const geminiOutput = await runGeminiTryOn({
          modelImage,
          products: ordered
        });
        currentImage = await inlineRemoteImage(geminiOutput);
        steps.push({
          productId: ordered.map((p) => p.id).join("+"),
          output: currentImage,
          provider: "gemini-tryon"
        });
      } catch (geminiError) {
        console.warn("Gemini outfit try-on failed, falling back to sequential VTON:", geminiError);
      }
    }

    if (!steps.length) {
      try {
        const hasInnerTop = ordered.some((p) => p.category === "tops");
        for (const product of ordered) {
          const isOuterwearLayer = product.category === "outerwear" && hasInnerTop;
          const result = await runTryOnProvider({
            modelImage: currentImage,
            product,
            baseUrl: requestOrigin,
            engine: body.engine,
            isOuterwearLayer
          });

          currentImage = await inlineRemoteImage(result.output);
          steps.push({
            productId: product.id,
            output: currentImage,
            provider: result.provider
          });
        }
      } catch (vtonError) {
        if (process.env.GEMINI_API_KEY && body.engine !== "fashn") {
          try {
            console.warn("VTON failed; attempting Gemini Try-On fallback:", vtonError);
            const geminiOutput = await runGeminiTryOn({
              modelImage,
              products: ordered
            });
            currentImage = await inlineRemoteImage(geminiOutput);
            steps.push({
              productId: ordered.map((p) => p.id).join("+"),
              output: currentImage,
              provider: "gemini-tryon"
            });
          } catch {
            throw vtonError;
          }
        } else {
          throw vtonError;
        }
      }
    }

      // --- Làm nét ảnh kết quả (không bắt buộc; lỗi thì giữ ảnh gốc) ---
      // Production đang dùng TRYON_UPSCALE=2, vì vậy chỉ giữ Real-ESRGAN.
      // Bỏ nhánh Sharp native để tránh đóng gói binary không dùng vào Vercel Function.
      const upscaleSetting = (process.env.TRYON_UPSCALE ?? "2").trim().toLowerCase();
      const upscaleFactor = Number(upscaleSetting);
      const useEsrgan = Number.isFinite(upscaleFactor) && upscaleFactor > 1;

      if (useEsrgan) {
        try {
          const enhanced = await withTimeout(upscaleImage(currentImage, upscaleFactor), 90_000);
          if (enhanced && enhanced !== currentImage) {
            currentImage = enhanced;
            steps[steps.length - 1].output = enhanced;
            console.log(`[try-on] đã làm nét (siêu phân giải ${upscaleFactor}x)`);
          } else {
            console.warn("[try-on] không làm nét được, giữ ảnh gốc");
          }
        } catch (upscaleError) {
          console.warn("[try-on] làm nét lỗi, giữ ảnh gốc:", upscaleError instanceof Error ? upscaleError.message : upscaleError);
        }
      }

      const providers = Array.from(new Set(steps.map((step) => step.provider)));
      const provider =
        providers.length === 1 ? providers[0] : "hybrid-fallback";

      if (db && session) {
        await db.tryOnSession.update({
          where: { id: session.id },
          data: { status: "completed", resultUrl: currentImage }
        });

        for (const step of steps) {
          await recordBehaviorEvent({
            db,
            userId: user?.id,
            productId: step.productId,
            type: "tryon_success",
            source: "virtual-fitting-room",
            metadata: {
              sessionId: session.id,
              provider: step.provider
            }
          });
        }

        if (user) await rebuildUserStyleProfile(db, user.id);
      }

      return NextResponse.json({
        mode: "live",
        provider,
        output: currentImage,
        steps,
        productIds: ordered.map((product) => product.id),
        tryOnSessionId: session?.id ?? null
      });
    } catch (error) {
      if (db && session) {
        await db.tryOnSession
          .update({
            where: { id: session.id },
            data: {
              status: "failed",
              errorMessage:
                error instanceof Error
                  ? error.message.slice(0, 500)
                  : "Try-on failed"
            }
          })
          .catch(() => undefined);
      }

      const message =
        error instanceof Error ? error.message : "Không thể thử đồ.";

      const normalized = /quota|zerogpu|gpu|queue|too many|exceeded|rate|space metadata|connect|timeout|getaddrinfo|econnrefused/i.test(message)
        ? "AI Try-On tạm thời bị nghẽn kết nối hoặc chạm giới hạn GPU miễn phí trong ngày của Hugging Face ZeroGPU. Bạn có thể đợi vài phút rồi thử lại, hoặc thêm token Hugging Face mới trong .env."
        : message;

      return NextResponse.json({ error: normalized }, { status: 502 });
    }
  }
