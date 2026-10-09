import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { OrderStatus, PaymentStatus } from "@/lib/cart";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { canRecordCodCollection } from "@/lib/server/payment-access";
import { canTransitionOrderStatus, isOrderStatus } from "@/lib/order-workflow";

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
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 }); }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  let body: {
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    shippingCarrier?: string;
    trackingCode?: string;
  };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }

  if (body.status !== undefined && !isOrderStatus(body.status)) {
    return NextResponse.json({ error: "Trạng thái đơn hàng không hợp lệ." }, { status: 400 });
  }
  if (body.paymentStatus !== undefined && !["pending", "paid", "cod_pending", "failed", "refunded"].includes(body.paymentStatus)) {
    return NextResponse.json({ error: "Trạng thái thanh toán không hợp lệ." }, { status: 400 });
  }
  const { id } = await params;
  try {
    const result = await db.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!current) throw new Error("ORDER_NOT_FOUND");

      const nextStatus = body.status ?? current.status;
      if (!canTransitionOrderStatus(current.status, nextStatus)) throw new Error("INVALID_STATUS_TRANSITION");

      const nextPayment = body.paymentStatus ?? current.paymentStatus;
      if (nextPayment !== current.paymentStatus &&
          !(nextPayment === "paid" && canRecordCodCollection(current, nextStatus))) {
        throw new Error("INVALID_PAYMENT_TRANSITION");
      }

      const carrier = body.shippingCarrier !== undefined ? String(body.shippingCarrier).trim() : current.shippingCarrier;
      const tracking = body.trackingCode !== undefined ? String(body.trackingCode).trim() : current.trackingCode;
      if ((carrier?.length ?? 0) > 100 || (tracking?.length ?? 0) > 120) throw new Error("INVALID_SHIPPING_INFO");

      if (nextStatus === "shipping" && (!carrier || !tracking)) throw new Error("SHIPPING_DETAILS_REQUIRED");
      if (current.payment === "qr" && nextStatus === "shipping" && current.paymentStatus !== "paid") {
        throw new Error("UNPAID_QR_ORDER");
      }

      // Compare-and-swap prevents concurrent admin requests overwriting each
      // other or restocking a cancelled order multiple times.
      const claimed = await tx.order.updateMany({
        where: { id, status: current.status, paymentStatus: current.paymentStatus },
        data: {
          status: nextStatus,
          paymentStatus: nextPayment,
          shippingCarrier: carrier || null,
          trackingCode: tracking || null,
          ...(nextPayment === "paid" && current.payment === "cod" && current.paymentStatus !== "paid"
            ? { paidAt: new Date(), paymentProvider: "cod_collected" }
            : {})
        }
      });
      if (claimed.count !== 1) throw new Error("STALE_ORDER");

      const restocked = nextStatus === "cancelled" && current.status !== "cancelled";
      if (restocked) {
        for (const item of current.items) {
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
      return { restocked, status: nextStatus, paymentStatus: nextPayment };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ saved: true, ...result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, [string, number]> = {
      ORDER_NOT_FOUND: ["Không tìm thấy đơn hàng.", 404],
      INVALID_STATUS_TRANSITION: ["Không thể chuyển trạng thái ngược hoặc bỏ qua bước xử lý đơn.", 409],
      INVALID_PAYMENT_TRANSITION: ["Không được tự sửa trạng thái chuyển khoản; COD chỉ ghi nhận khi đơn hoàn tất.", 409],
      INVALID_SHIPPING_INFO: ["Thông tin đơn vị vận chuyển hoặc mã vận đơn quá dài.", 400],
      SHIPPING_DETAILS_REQUIRED: ["Cần nhập hãng vận chuyển và mã vận đơn trước khi chuyển sang Đang giao.", 409],
      UNPAID_QR_ORDER: ["Đơn QR chưa xác minh thanh toán, không thể bàn giao vận chuyển.", 409],
      STALE_ORDER: ["Đơn hàng vừa được cập nhật ở phiên khác. Hãy tải lại.", 409]
    };
    if (messages[code]) {
      const [message, status] = messages[code];
      return NextResponse.json({ error: message }, { status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ error: "Đơn hàng đang được cập nhật đồng thời. Hãy thử lại." }, { status: 409 });
    }
    console.error("Admin order update failed:", error);
    return NextResponse.json({ error: "Không thể lưu thao tác xử lý đơn." }, { status: 500 });
  }
}
