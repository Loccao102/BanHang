import { NextResponse } from "next/server";
import type { OrderStatus, PaymentStatus } from "@/lib/cart";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { canRecordCodCollection } from "@/lib/server/payment-access";

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
    if (body.paymentStatus === "paid" && !canRecordCodCollection(current, body.status)) {
      return NextResponse.json({
        error: "Chuyển khoản QR cần webhook đã xác minh; COD chỉ được ghi nhận sau khi hoàn thành giao hàng."
      }, { status: 409 });
    }

    if (current.status === "cancelled" && body.status && body.status !== "cancelled") {
      return NextResponse.json({ error: "Đơn đã hủy không thể mở lại để tránh sai lệch tồn kho." }, { status: 409 });
    }

    const restocked = await db.$transaction(async (tx) => {
      // Atomically claim the cancellation before returning stock. Two concurrent
      // requests must never restock the same line twice.
      let claimedCancellation = false;
      if (body.status === "cancelled" && current.status !== "cancelled") {
        const claim = await tx.order.updateMany({
          where: { id, status: { not: "cancelled" } },
          data: { status: "cancelled" }
        });
        claimedCancellation = claim.count === 1;
        if (claimedCancellation) {
          const lines = await tx.orderItem.findMany({ where: { orderId: id } });
          for (const item of lines) {
            if (item.variantId) {
              await tx.productVariant.updateMany({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } }
              });
            }
            await tx.product.updateMany({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } }
            });
          }
        }
      }

      await tx.order.update({
        where: { id },
        data: {
          ...(body.status ? { status: body.status } : {}),
          ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
          ...(body.paymentStatus === "paid" && current.payment === "cod"
            ? { paidAt: new Date(), paymentProvider: "cod_collected" }
            : {}),
          ...(body.shippingCarrier !== undefined ? { shippingCarrier: body.shippingCarrier.trim() || null } : {}),
          ...(body.trackingCode !== undefined ? { trackingCode: body.trackingCode.trim() || null } : {})
        }
      });
      return claimedCancellation;
    }, { isolationLevel: "Serializable" });

    return NextResponse.json({ saved: true, restocked });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
