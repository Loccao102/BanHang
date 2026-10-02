import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { serializeOrder } from "@/lib/server/order-serializer";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const rows = await db.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
    const productIds = Array.from(new Set(rows.flatMap((order) => order.items.map((item) => item.productId))));
    const productRows = productIds.length
      ? await db.product.findMany({
          where: { id: { in: productIds } },
          include: { variants: true }
        })
      : [];
    const productMap = new Map(productRows.map((row) => [row.id, fromProductRow(row)]));

    return NextResponse.json({ orders: rows.map((order) => serializeOrder(order, productMap)) });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
