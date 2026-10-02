import { NextResponse } from "next/server";
import type { OrderStatus, PaymentStatus } from "@/lib/cart";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        paymentTransactions: { orderBy: { receivedAt: "desc" } },
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });
    if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });

    return NextResponse.json({
      order: {
        ...order,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
        paymentTransactions: order.paymentTransactions.map((item) => ({
          ...item,
          receivedAt: item.receivedAt.toISOString()
        }))
      }
    });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    const body = await request.json() as {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      shippingCarrier?: string;
      trackingCode?: string;
    };

    const current = await db.order.findUnique({ where: { id }, include: { items: true } });
    if (!current) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });

    if (current.status === "cancelled" && body.status && body.status !== "cancelled") {
      return NextResponse.json({ error: "Đơn đã hủy không thể mở lại để tránh sai lệch tồn kho." }, { status: 409 });
    }

    await db.$transaction(async (tx) => {
      if (body.status === "cancelled" && current.status !== "cancelled") {
        for (const item of current.items) {
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity }, active: true }
            });
          }
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
          ...(body.shippingCarrier !== undefined ? { shippingCarrier: body.shippingCarrier.trim() || null } : {}),
          ...(body.trackingCode !== undefined ? { trackingCode: body.trackingCode.trim() || null } : {})
        }
      });
    });

    return NextResponse.json({ saved: true, restocked: body.status === "cancelled" && current.status !== "cancelled" });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
