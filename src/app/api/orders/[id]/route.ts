import { NextResponse } from "next/server";
import type { OrderStatus, PaymentStatus } from "@/lib/cart";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

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

    await db.order.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
        ...(body.shippingCarrier !== undefined ? { shippingCarrier: body.shippingCarrier.trim() || null } : {}),
        ...(body.trackingCode !== undefined ? { trackingCode: body.trackingCode.trim() || null } : {})
      }
    });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
