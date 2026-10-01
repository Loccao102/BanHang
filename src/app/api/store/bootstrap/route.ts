import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ mode: "browser" });

  const rows = await db.product.findMany({ orderBy: { sku: "asc" } });
  const promo = await db.storeSetting.findUnique({ where: { key: "promoText" } });

  return NextResponse.json({
    mode: "database",
    products: rows.map(fromProductRow),
    settings: {
      promoText: promo?.value ?? "FALL / WINTER 2026 · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY"
    }
  });
}
