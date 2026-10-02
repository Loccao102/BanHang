import { NextResponse } from "next/server";
import { products as fallbackProducts, type Product } from "@/lib/products";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";
import { assessTryOnLook } from "@/lib/server/stylist-assessment";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonIds(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 3) : [];
}

async function loadProducts(productIds: string[]) {
  const db = getDb();
  if (!db) {
    return productIds.flatMap((id) => {
      const product = fallbackProducts.find((item) => item.id === id && item.active !== false);
      return product ? [product] : [];
    });
  }

  const rows = await db.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: {
      variants: { where: { active: true } },
      reviews: { where: { approved: true }, select: { rating: true } }
    }
  });
  const map = new Map<string, Product>(rows.map((row) => [row.id, fromProductRow(row)]));
  return productIds.flatMap((id) => {
    const product = map.get(id);
    return product ? [product] : [];
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      tryOnSessionId?: string | null;
      resultImage?: string;
      productIds?: string[];
    };

    const db = getDb();
    const user = await getCurrentUser();
    let resultImage = String(body.resultImage ?? "");
    let productIds = jsonIds(body.productIds);

    if (db && body.tryOnSessionId) {
      const session = await db.tryOnSession.findUnique({ where: { id: String(body.tryOnSessionId) } });
      if (!session) return NextResponse.json({ error: "Phiên thử đồ không tồn tại." }, { status: 404 });
      if (session.userId && session.userId !== user?.id) {
        return NextResponse.json({ error: "Bạn không có quyền xem phiên thử đồ này." }, { status: 403 });
      }
      if (session.status !== "completed") {
        return NextResponse.json({ error: "Phiên thử đồ chưa hoàn tất." }, { status: 400 });
      }
      productIds = jsonIds(session.productIds);
      resultImage = session.resultUrl ?? resultImage;
    }

    if (!resultImage || (!resultImage.startsWith("https://") && !resultImage.startsWith("data:image/"))) {
      return NextResponse.json({ error: "Thiếu ảnh kết quả hợp lệ để AI Stylist đánh giá." }, { status: 400 });
    }
    if (!productIds.length) {
      return NextResponse.json({ error: "Thiếu sản phẩm trong outfit." }, { status: 400 });
    }

    const products = await loadProducts(productIds);
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Không đọc đủ metadata của outfit." }, { status: 400 });
    }

    const profile = db && user
      ? await db.userStyleProfile.findUnique({ where: { userId: user.id } })
      : null;

    const assessment = await assessTryOnLook({
      image: resultImage,
      products,
      profile
    });

    return NextResponse.json({ assessment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI Stylist chưa thể đánh giá outfit." },
      { status: 500 }
    );
  }
}
