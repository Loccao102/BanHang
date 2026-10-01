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
