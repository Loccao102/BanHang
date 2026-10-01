import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { couponDiscount, couponIsUsable, publicCoupon } from "@/lib/server/coupon";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Dịch vụ ưu đãi chưa sẵn sàng." }, { status: 503 });

  const body = await request.json() as { code?: string; subtotal?: number };
  const code = String(body.code ?? "").trim().toUpperCase();
  const subtotal = Math.max(0, Number(body.subtotal ?? 0));
  const coupon = await db.coupon.findUnique({ where: { code } });

  if (!coupon || !couponIsUsable(coupon, subtotal)) {
    return NextResponse.json({ valid: false, error: "Mã ưu đãi chưa hợp lệ hoặc không đủ điều kiện." }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    coupon: publicCoupon(coupon),
    discount: couponDiscount(coupon, subtotal)
  });
}
