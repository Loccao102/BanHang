import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ mode: "browser" });

  // Admin console: also return products that were just created (chưa bật "analyzer") or
  // were hidden by the admin, otherwise they vanish right after saving and can't be edited/re-enabled.
  let adminScope = false;
  if (new URL(request.url).searchParams.get("scope") === "admin") {
    try {
      await requireAdmin();
      adminScope = true;
    } catch {
      adminScope = false;
    }
  }

  const rows = await db.product.findMany({
    where: adminScope
      ? { OR: [{ active: true }, { analyzerReady: true }] }
      : { active: true, analyzerReady: true },
    include: {
      variants: { orderBy: { size: "asc" } }
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
