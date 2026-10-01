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
      await tx.socialPostProduct.deleteMany();
      await tx.review.deleteMany();
      await tx.cartItem.deleteMany();
      await tx.wishlistItem.deleteMany();
      await tx.productVariant.deleteMany();
      await tx.product.deleteMany();
      await tx.product.createMany({ data: products.map(toProductRow) });
      await tx.productVariant.createMany({
        data: products.flatMap((product) => (product.variants ?? []).map((variant) => ({
          productId: product.id,
          sku: variant.sku,
          size: variant.size,
          stock: variant.stock,
          active: variant.active
        })))
      });
    });

    return NextResponse.json({ reset: true, count: products.length });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
