import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getCurrentUser } from "@/lib/server/auth";
import { canReadPaymentStatus, canSimulatePayment } from "@/lib/server/payment-access";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      payment: true,
      paymentStatus: true,
      status: true,
      total: true,
      paidAt: true,
      paymentProvider: true
    }
  });

  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });
  if (!canReadPaymentStatus(currentUser, order.userId)) {
    return NextResponse.json({ error: "Không có quyền xem thanh toán này." }, { status: 403 });
  }

  const latestTransaction = await db.paymentTransaction.findFirst({
    where: { orderId: id },
    orderBy: { receivedAt: "desc" },
    select: {
      amount: true,
      matched: true,
      failureReason: true,
      receivedAt: true,
      gateway: true,
      referenceCode: true
    }
  });

  return NextResponse.json({
    id: order.id,
    payment: order.payment,
    paymentStatus: order.paymentStatus,
    status: order.status,
    total: order.total,
    paidAt: order.paidAt?.toISOString() ?? null,
    paymentProvider: order.paymentProvider,
    latestTransaction: latestTransaction ? {
      ...latestTransaction,
      receivedAt: latestTransaction.receivedAt.toISOString()
    } : null
  });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Never create fake, self-attested payments in production.
  if (process.env.NODE_ENV !== "development") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const { id } = await params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });

  if (!canSimulatePayment(currentUser, order, process.env.NODE_ENV)) {
    return NextResponse.json({ error: "Chỉ admin mới được giả lập thanh toán QR tại môi trường development." }, { status: 403 });
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.paymentTransaction.create({
      data: {
        provider: "development_simulation",
        providerTransactionId: `dev_${Date.now()}_${id}`,
        orderId: order.id,
        amount: order.total,
        transferType: "in",
        content: `Thanh toán VietQR cho đơn ${order.id}`,
        matched: true,
        gateway: "MB",
        rawPayload: { manualConfirmedBy: currentUser.id, timestamp: new Date().toISOString() }
      }
    });

    return await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "paid",
        paymentProvider: "development_simulation",
        paidAt: new Date(),
        status: order.status === "processing" ? "confirmed" : order.status
      }
    });
  });

  return NextResponse.json({
    success: true,
    paymentStatus: updated.paymentStatus,
    status: updated.status,
    orderId: updated.id,
    paidAt: updated.paidAt?.toISOString()
  });
}

