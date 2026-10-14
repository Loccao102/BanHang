import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { couponDateOrNull, validateCouponRules, type CouponRules } from "@/lib/server/coupon-admin-rules";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 }); }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  const { code } = await params;
  const normalized = decodeURIComponent(code).toUpperCase();
  const current = await db.coupon.findUnique({ where: { code: normalized } });
  if (!current) return NextResponse.json({ error: "Không tìm thấy coupon." }, { status: 404 });

  const next = {
    type: body.type === undefined ? current.type : body.type,
    value: body.value === undefined ? current.value : Number(body.value),
    minOrder: body.minOrder === undefined ? current.minOrder : Number(body.minOrder),
    maxDiscount: body.maxDiscount === undefined ? current.maxDiscount
      : body.maxDiscount === null || body.maxDiscount === "" ? null : Number(body.maxDiscount),
    usageLimit: body.usageLimit === undefined ? current.usageLimit
      : body.usageLimit === null || body.usageLimit === "" ? null : Number(body.usageLimit),
    startsAt: body.startsAt === undefined ? current.startsAt : couponDateOrNull(body.startsAt),
    endsAt: body.endsAt === undefined ? current.endsAt : couponDateOrNull(body.endsAt),
    usedCount: current.usedCount
  };
  const error = validateCouponRules(next as CouponRules);
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Trạng thái kích hoạt không hợp lệ." }, { status: 400 });
  }

  try {
    const coupon = await db.coupon.update({
      where: { code: normalized },
      data: {
        type: next.type as "fixed" | "percentage",
        value: next.value,
        minOrder: next.minOrder,
        maxDiscount: next.maxDiscount,
        usageLimit: next.usageLimit,
        startsAt: next.startsAt,
        endsAt: next.endsAt,
        ...(body.active !== undefined ? { active: body.active as boolean } : {})
      }
    });
    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Update coupon failed", error);
    return NextResponse.json({ error: "Không thể cập nhật coupon." }, { status: 500 });
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
