import { Prisma } from "@prisma/client";
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

/** Các trường bắt buộc phải có khi thêm/sửa sản phẩm (thiếu sẽ lỗi Prisma khó hiểu). */
const REQUIRED_FIELDS: Array<[keyof Product, string]> = [
  ["name", "Tên sản phẩm"],
  ["sku", "Mã SKU"],
  ["subtitle", "Mô tả ngắn"],
  ["category", "Danh mục"],
  ["type", "Loại sản phẩm"],
  ["color", "Màu sắc"],
  ["colorFamily", "Nhóm màu"],
  ["image", "Ảnh chính"],
  ["material", "Chất liệu"],
  ["fit", "Phom dáng"]
];

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập bằng tài khoản quản trị để lưu sản phẩm." }, { status: 403 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Cơ sở dữ liệu chưa sẵn sàng." }, { status: 503 });

  let product: Product;
  try {
    product = await request.json() as Product;
  } catch {
    return NextResponse.json({ error: "Dữ liệu sản phẩm không hợp lệ." }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS
    .filter(([field]) => !String(product?.[field] ?? "").trim())
    .map(([, label]) => label);
  if (missing.length) {
    return NextResponse.json({ error: `Thiếu thông tin bắt buộc: ${missing.join(", ")}.` }, { status: 400 });
  }

  if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
    return NextResponse.json({ error: "Giá bán không hợp lệ." }, { status: 400 });
  }

  if (!Array.isArray(product.sizes) || product.sizes.length === 0) {
    return NextResponse.json({ error: "Sản phẩm phải có ít nhất một size." }, { status: 400 });
  }

  try {
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = error.meta?.target;
        const fields = Array.isArray(target) ? target.join(", ") : String(target ?? "sku");
        const code = product.sku?.trim();
        return NextResponse.json(
          { error: `Trùng mã (${fields})${code ? ` — SKU "${code}" đã tồn tại` : ""}. Hãy đổi SKU rồi lưu lại.` },
          { status: 409 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json({ error: "Dữ liệu tham chiếu không hợp lệ (danh mục/loại sản phẩm)." }, { status: 400 });
      }
    }

    console.error("Lưu sản phẩm thất bại:", error);
    return NextResponse.json({ error: "Không thể lưu sản phẩm. Vui lòng kiểm tra dữ liệu và thử lại." }, { status: 500 });
  }
}
