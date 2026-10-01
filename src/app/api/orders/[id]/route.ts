import { NextResponse } from "next/server";
import type { OrderStatus } from "@/lib/cart";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return NextResponse.json({ saved: false, mode: "browser" });

  const { id } = await params;
  const body = await request.json() as { status: OrderStatus };

  await db.order.update({
    where: { id },
    data: { status: body.status }
  });

  return NextResponse.json({ saved: true });
}
