import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { products as fallbackProducts, type Product } from "@/lib/products";
import { getDb } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";
import { recordBehaviorEvent, rebuildUserStyleProfile } from "@/lib/server/style-learning";
import { fromProductRow } from "@/lib/server/product-db";
import { runHuggingFaceFashn } from "@/lib/server/huggingface-fashn";
import { isValidOutfit, sortOutfitProducts } from "@/lib/wardrobe";

export const runtime = "nodejs";
export const maxDuration = 300;

type TryOnProvider = "fashn-api-v1.6" | "huggingface-fashn-vton-1.5";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function categoryFor(product: Product): "tops" | "bottoms" | "one-pieces" {
  if (product.tryOnCategory) return product.tryOnCategory;
  if (product.category === "bottoms") return "bottoms";
  if (product.category === "dress" || product.category === "set") return "one-pieces";
  return "tops";
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
}): Promise<{ output: string; provider: TryOnProvider }> {
  const garmentImage = input.product.tryOnImage;
  if (!garmentImage) throw new Error(`${input.product.name} chưa có ảnh chuẩn cho Try-On.`);

  const category = categoryFor(input.product);
  const apiKey = process.env.FASHN_API_KEY?.trim();

  if (apiKey) {
    try {
      const output = await runOfficialFashn({
        apiKey,
        modelImage: input.modelImage,
        garmentImage,
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
    garmentImage,
    category,
    photoType: photoTypeFor(input.product),
    baseUrl: input.baseUrl
  });

  return { output, provider: "huggingface-fashn-vton-1.5" };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      modelImage?: string;
      productIds?: string[];
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

    if (!modelImage.startsWith("data:image/") && !modelImage.startsWith("https://")) {
      return NextResponse.json({ error: "Ảnh người không hợp lệ." }, { status: 400 });
    }

    const requestOrigin = new URL(request.url).origin;
    const db = getDb();
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

    const session = db
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

    try {
      for (const product of ordered) {
        const result = await runTryOnProvider({
          modelImage: currentImage,
          product,
          baseUrl: requestOrigin
        });

        currentImage = result.output;
        steps.push({
          productId: product.id,
          output: currentImage,
          provider: result.provider
        });
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

      throw error;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không thể thử đồ.";

    const normalized = /quota|zerogpu|gpu|queue|too many|exceeded|rate/i.test(message)
      ? "Hugging Face ZeroGPU đang quá tải hoặc hết quota. Có thể thêm HF_TOKEN miễn phí, cấu hình FASHN_API_KEY, hoặc thử lại sau."
      : message;

    return NextResponse.json({ error: normalized }, { status: 502 });
  }
}
