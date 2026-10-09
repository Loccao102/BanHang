import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { validateStockAdjustment } from "@/lib/server/inventory-operations";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Chỉ quản trị viên được điều chỉnh kho." }, { status: 403 }); }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const { id } = await params;
  let raw: { size?: unknown; delta?: unknown };
  try { raw = await request.json(); }
  catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  const adjustment = validateStockAdjustment(raw.size, raw.delta);
  if (!adjustment) return NextResponse.json({ error: "Cần size và số lượng nguyên trong khoảng ±1–1000." }, { status: 400 });

  try {
    const updated = await db.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { productId_size: { productId: id, size: adjustment.size } },
        select: { id: true }
      });
      if (!variant) throw new Error("SIZE_NOT_FOUND");
      const result = await tx.productVariant.updateMany({
        where: { id: variant.id, ...(adjustment.delta < 0 ? { stock: { gte: -adjustment.delta } } : {}) },
        data: { stock: { increment: adjustment.delta }, ...(adjustment.delta > 0 ? { active: true } : {}) }
      });
      if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK");
      const product = await tx.product.updateMany({
        where: { id, ...(adjustment.delta < 0 ? { stock: { gte: -adjustment.delta } } : {}) },
        data: { stock: { increment: adjustment.delta } }
      });
      if (product.count !== 1) throw new Error("STOCK_CONFLICT");
      const [productRow, variantRow] = await Promise.all([
        tx.product.findUnique({ where: { id }, select: { stock: true } }),
        tx.productVariant.findUnique({ where: { id: variant.id }, select: { size: true, stock: true } })
      ]);
      return { stock: productRow!.stock, variant: variantRow! };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ saved: true, ...updated });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "SIZE_NOT_FOUND") return NextResponse.json({ error: "Size này không còn tồn tại. Hãy tải lại trang." }, { status: 404 });
    if (code === "INSUFFICIENT_STOCK") return NextResponse.json({ error: "Không thể trừ quá số hàng còn lại." }, { status: 409 });
    if (code === "STOCK_CONFLICT" || error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "Tồn kho vừa bị thay đổi. Hãy thử lại." }, { status: 409 });
    }
    console.error("Admin inventory update failed:", error);
    return NextResponse.json({ error: "Không thể lưu điều chỉnh tồn kho." }, { status: 500 });
  }
}
