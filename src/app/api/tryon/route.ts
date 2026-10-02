import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { products as fallbackProducts, type Product } from "@/lib/products";
import { getDb } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";
import { recordBehaviorEvent, rebuildUserStyleProfile } from "@/lib/server/style-learning";
import { fromProductRow } from "@/lib/server/product-db";
import { isValidOutfit, sortOutfitProducts } from "@/lib/wardrobe";

export const runtime = "nodejs";
export const maxDuration = 300;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function categoryFor(product: Product) {
  if (product.tryOnCategory) return product.tryOnCategory;
  if (product.category === "bottoms") return "bottoms";
  if (product.category === "dress" || product.category === "set") return "one-pieces";
  return "tops";
}

async function getProducts(productIds: string[]) {
  const db = getDb();
  if (!db) {
    return productIds.flatMap((id) => {
      const product = fallbackProducts.find((item) => item.id === id && item.active !== false && Boolean(item.tryOnImage));
      return product ? [product] : [];
    });
  }

  const rows = await db.product.findMany({
    where: { id: { in: productIds }, active: true, tryOnImage: { not: null } },
    include: {
      variants: { where: { active: true } },
      reviews: { where: { approved: true }, select: { rating: true } }
    }
  });
  const map = new Map(rows.map((row) => [row.id, fromProductRow(row)]));
  return productIds.flatMap((id) => {
    const product = map.get(id);
    return product ? [product] : [];
  });
}

async function runSingle(apiKey: string, modelImage: string, garmentImage: string, category: string) {
  const run = await fetch("https://api.fashn.ai/v1/run", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model_name: "tryon-v1.6",
      inputs: {
        model_image: modelImage,
        garment_image: garmentImage,
        category,
        mode: "balanced",
        output_format: "jpeg",
        moderation_level: "conservative"
      }
    })
  });

  if (!run.ok) {
    const detail = await run.text();
    throw new Error(`FASHN không nhận request: ${detail}`);
  }

  const initial = await run.json();
  if (!initial.id) throw new Error("FASHN không trả prediction id.");

  for (let attempt = 0; attempt < 45; attempt += 1) {
    await sleep(1000);
    const statusResponse = await fetch(`https://api.fashn.ai/v1/status/${initial.id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store"
    });
    if (!statusResponse.ok) continue;
    const status = await statusResponse.json();
    if (status.status === "completed") {
      const output = status.output?.[0];
      if (!output) throw new Error("FASHN hoàn tất nhưng không trả ảnh.");
      return output as string;
    }
    if (status.status === "failed") throw new Error(status.error?.message ?? "Virtual try-on thất bại.");
  }

  throw new Error("Virtual try-on đang xử lý quá lâu. Hãy thử lại.");
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { modelImage?: string; productIds?: string[] };
    const modelImage = String(body.modelImage ?? "");
    const productIds = Array.isArray(body.productIds) ? Array.from(new Set(body.productIds.map(String))).slice(0, 3) : [];

    if (!modelImage || !productIds.length) {
      return NextResponse.json({ error: "Thiếu ảnh người hoặc danh sách sản phẩm." }, { status: 400 });
    }
    if (!modelImage.startsWith("data:image/") && !modelImage.startsWith("https://")) {
      return NextResponse.json({ error: "Ảnh người không hợp lệ." }, { status: 400 });
    }

    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "FASHN_API_KEY chưa được cấu hình." }, { status: 503 });

    const db = getDb();
    const user = await getCurrentUser();
    const selected = await getProducts(productIds);
    if (selected.length !== productIds.length) {
      return NextResponse.json({ error: "Có sản phẩm không còn khả dụng." }, { status: 400 });
    }
    if (!isValidOutfit(selected)) {
      return NextResponse.json({ error: "Vui lòng chọn từ 1 đến 3 món đồ hợp lệ để thử." }, { status: 400 });
    }

    const ordered = sortOutfitProducts(selected);
    const categorySequence = ordered.map(categoryFor);
    const personImageHash = createHash("sha256").update(modelImage).digest("hex");
    const session = db ? await db.tryOnSession.create({
      data: {
        userId: user?.id ?? null,
        personImageHash,
        productIds: ordered.map((product) => product.id),
        categorySequence,
        status: "processing"
      }
    }) : null;

    if (db) {
      for (const product of ordered) {
        await recordBehaviorEvent({
          db,
          userId: user?.id,
          productId: product.id,
          type: "tryon_start",
          source: "virtual-fitting-room",
          metadata: { sessionId: session?.id, category: categoryFor(product) }
        });
      }
    }

    let currentImage = modelImage;
    const steps: Array<{ productId: string; output: string }> = [];

    try {
      for (const product of ordered) {
        currentImage = await runSingle(
          apiKey,
          currentImage,
          product.tryOnImage!,
          categoryFor(product)
        );
        steps.push({ productId: product.id, output: currentImage });
      }

      if (db && session) {
        await db.tryOnSession.update({
          where: { id: session.id },
          data: { status: "completed", resultUrl: currentImage }
        });
        for (const product of ordered) {
          await recordBehaviorEvent({
            db,
            userId: user?.id,
            productId: product.id,
            type: "tryon_success",
            source: "virtual-fitting-room",
            metadata: { sessionId: session.id }
          });
        }
        if (user) await rebuildUserStyleProfile(db, user.id);
      }

      return NextResponse.json({
        mode: "live",
        output: currentImage,
        steps,
        productIds: ordered.map((product) => product.id),
        tryOnSessionId: session?.id ?? null
      });
    } catch (error) {
      if (db && session) {
        await db.tryOnSession.update({
          where: { id: session.id },
          data: { status: "failed", errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Try-on failed" }
        }).catch(() => undefined);
      }
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể thử đồ." }, { status: 502 });
  }
}
