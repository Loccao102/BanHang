import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { toProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function POST() {
  try {
    await requireAdmin();
    const db = getDb()!;
    await db.product.deleteMany();
    await db.product.createMany({ data: products.map(toProductRow) });
    return NextResponse.json({ reset: true, count: products.length });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
