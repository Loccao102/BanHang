import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    select: {
      id: true,
      payment: true,
      paymentStatus: true,
      status: true,
      total: true,
      paidAt: true,
      paymentProvider: true
    }
  });

  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });

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
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const { getCurrentUser } = await import("@/lib/server/auth");
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });

  const { id } = await params;
  const order = await db.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Không tìm thấy đơn hàng." }, { status: 404 });

  if (order.userId !== currentUser.id && currentUser.role !== "admin") {
    return NextResponse.json({ error: "Không có quyền xác nhận đơn hàng này." }, { status: 403 });
  }

  if (order.paymentStatus === "paid") {
    return NextResponse.json({ success: true, paymentStatus: "paid", status: order.status, orderId: order.id });
  }

  const updated = await db.$transaction(async (tx) => {
    await tx.paymentTransaction.create({
      data: {
        provider: "vietqr_manual",
        providerTransactionId: `manual_${Date.now()}_${id}`,
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
        paymentProvider: "vietqr",
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

