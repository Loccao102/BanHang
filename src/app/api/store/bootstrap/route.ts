import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ mode: "browser" });

  const rows = await db.product.findMany({
    where: {
      active: true,
      analyzerReady: true
    },
    include: {
      variants: { orderBy: { size: "asc" } },
      reviews: { where: { approved: true }, select: { rating: true } }
    },
    orderBy: { sku: "asc" }
  });

  // Nếu DB vẫn chỉ chứa catalog mock cũ, giữ catalog source hiện tại ở client
  // thay vì ghi đè bằng một danh sách rỗng.
  if (!rows.length) return NextResponse.json({ mode: "browser" });
  const promo = await db.storeSetting.findUnique({ where: { key: "promoText" } });

  return NextResponse.json({
    mode: "database",
    products: rows.map(fromProductRow),
    settings: {
      promoText: promo?.value ?? "NEW DROP · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY"
    }
  });
}
