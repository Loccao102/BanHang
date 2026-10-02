import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

function dateOrNull(value: unknown) {
  if (value === undefined) return undefined;
  const raw = String(value ?? "").trim();
  return raw ? new Date(raw) : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { code } = await params;
    const body = await request.json() as {
      active?: boolean; type?: "percentage" | "fixed"; value?: number; minOrder?: number;
      maxDiscount?: number | null; usageLimit?: number | null; startsAt?: string | null; endsAt?: string | null;
    };
    const startsAt = dateOrNull(body.startsAt);
    const endsAt = dateOrNull(body.endsAt);
    const coupon = await db.coupon.update({
      where: { code: decodeURIComponent(code).toUpperCase() },
      data: {
        ...(body.active !== undefined ? { active: body.active } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(body.value !== undefined ? { value: Math.max(1, Number(body.value)) } : {}),
        ...(body.minOrder !== undefined ? { minOrder: Math.max(0, Number(body.minOrder)) } : {}),
        ...(body.maxDiscount !== undefined ? { maxDiscount: body.maxDiscount ? Math.max(0, Number(body.maxDiscount)) : null } : {}),
        ...(body.usageLimit !== undefined ? { usageLimit: body.usageLimit ? Math.max(1, Number(body.usageLimit)) : null } : {}),
        ...(startsAt !== undefined ? { startsAt } : {}),
        ...(endsAt !== undefined ? { endsAt } : {})
      }
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
