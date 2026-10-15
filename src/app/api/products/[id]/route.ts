import { NextResponse } from "next/server";
import { products } from "@/lib/products";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).trim();

  const db = getDb();
  if (db) {
    try {
      const row = await db.product.findFirst({
        where: {
          OR: [
            { id: decodedId },
            { sku: { equals: decodedId, mode: "insensitive" } }
          ]
        },
        include: { variants: { orderBy: { size: "asc" } } }
      });
      if (row && row.active) {
        return NextResponse.json({ product: fromProductRow(row) });
      }
    } catch {
      // Fallback below if DB query encounters an issue
    }
  }

  // Fallback to static seed products
  const fallback = products.find(
    (p) =>
      (p.id === decodedId || p.sku?.toUpperCase() === decodedId.toUpperCase()) &&
      p.active !== false
  );
  if (fallback) {
    return NextResponse.json({ product: fallback });
  }

  return NextResponse.json({ error: "Sản phẩm không tồn tại." }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    await db.product.updateMany({ where: { id }, data: { active: false } });
    return NextResponse.json({ deleted: true, mode: "soft-delete" });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}

