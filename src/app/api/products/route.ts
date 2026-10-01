import { NextResponse } from "next/server";
import type { Product } from "@/lib/products";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { toProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const product = await request.json() as Product;
    const row = toProductRow(product);
    const { id, ...data } = row;

    await db.product.upsert({ where: { id }, create: row, update: data });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
