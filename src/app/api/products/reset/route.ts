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

    await db.$transaction(async (tx) => {
      for (const product of products) {
        const row = toProductRow(product);
        const { id, ...data } = row;
        await tx.product.upsert({ where: { id }, create: row, update: data });

        const variants = product.variants ?? [];
        await tx.productVariant.deleteMany({
          where: { productId: id, size: { notIn: variants.map((item) => item.size) } }
        });
        for (const variant of variants) {
          await tx.productVariant.upsert({
            where: { productId_size: { productId: id, size: variant.size } },
            create: { productId: id, sku: variant.sku, size: variant.size, stock: variant.stock, active: variant.active },
            update: { sku: variant.sku, stock: variant.stock, active: variant.active }
          });
        }
      }
    });

    return NextResponse.json({ reset: true, count: products.length, preserved: ["orders", "cart", "wishlist", "social", "behavior", "ai"] });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
