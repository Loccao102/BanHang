import { NextResponse } from "next/server";
import type { OrderStatus } from "@/lib/cart";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    const body = await request.json() as { status: OrderStatus };

    await db.order.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
