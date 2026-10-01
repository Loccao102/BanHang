import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ mode: "browser" });

  const rows = await db.product.findMany({
    include: {
      variants: { orderBy: { size: "asc" } },
      reviews: { where: { approved: true }, select: { rating: true } }
    },
    orderBy: { sku: "asc" }
  });
  const promo = await db.storeSetting.findUnique({ where: { key: "promoText" } });

  return NextResponse.json({
    mode: "database",
    products: rows.map(fromProductRow),
    settings: {
      promoText: promo?.value ?? "NEW DROP · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY"
    }
  });
}
