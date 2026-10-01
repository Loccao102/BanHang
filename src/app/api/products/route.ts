import { NextResponse } from "next/server";
import type { Product } from "@/lib/products";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { toProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

function distributed(product: Product) {
  const existing = new Map((product.variants ?? []).map((variant) => [variant.size, variant]));
  const total = Math.max(0, product.stock);
  const base = product.sizes.length ? Math.floor(total / product.sizes.length) : 0;
  return product.sizes.map((size, index) => {
    const old = existing.get(size);
    const stock = old ? Math.max(0, old.stock) : base + (index < total % Math.max(product.sizes.length, 1) ? 1 : 0);
    return {
      size,
      stock,
      active: old?.active ?? stock > 0,
      sku: old?.sku ?? `${product.sku ?? product.id}-${size}`
    };
  });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const product = await request.json() as Product;
    const variants = distributed(product);
    const normalized = { ...product, stock: variants.reduce((sum, variant) => sum + variant.stock, 0) };
    const row = toProductRow(normalized);
    const { id, ...data } = row;

    await db.$transaction(async (tx) => {
      await tx.product.upsert({ where: { id }, create: row, update: data });
      await tx.productVariant.deleteMany({
        where: { productId: id, size: { notIn: variants.map((variant) => variant.size) } }
      });
      for (const variant of variants) {
        await tx.productVariant.upsert({
          where: { productId_size: { productId: id, size: variant.size } },
          create: { productId: id, ...variant },
          update: { sku: variant.sku, stock: variant.stock, active: variant.active }
        });
      }
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Không thể lưu sản phẩm hoặc bạn không có quyền truy cập." }, { status: 403 });
  }
}
