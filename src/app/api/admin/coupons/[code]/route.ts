import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { code } = await params;
    const body = await request.json() as { active?: boolean };

    const coupon = await db.coupon.update({
      where: { code: decodeURIComponent(code).toUpperCase() },
      data: { ...(body.active !== undefined ? { active: body.active } : {}) }
    });
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật coupon." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { code } = await params;
    const normalized = decodeURIComponent(code).toUpperCase();
    const used = await db.order.count({ where: { couponCode: normalized } });
    if (used) {
      await db.coupon.update({ where: { code: normalized }, data: { active: false } });
      return NextResponse.json({ disabled: true });
    }
    await db.coupon.delete({ where: { code: normalized } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Không thể xóa coupon." }, { status: 400 });
  }
}
