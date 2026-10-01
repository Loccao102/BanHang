import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { getDb } from "@/lib/server/db";
import { toProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function POST() {
  const db = getDb();
  if (!db) return NextResponse.json({ reset: false, mode: "browser" });

  await db.product.deleteMany();
  await db.product.createMany({ data: products.map(toProductRow) });

  return NextResponse.json({ reset: true, count: products.length });
}
