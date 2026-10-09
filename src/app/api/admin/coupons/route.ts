import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { couponDateOrNull, validateCouponRules, type CouponRules } from "@/lib/server/coupon-admin-rules";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ coupons });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 }); }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  const code = String(body.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return NextResponse.json({ error: "Mã coupon phải có 3–24 ký tự, chữ hoa, số, _ hoặc -." }, { status: 400 });

  const data = {
    type: body.type,
    value: Number(body.value),
    minOrder: Number(body.minOrder ?? 0),
    maxDiscount: body.maxDiscount === null || body.maxDiscount === "" || body.maxDiscount === undefined ? null : Number(body.maxDiscount),
    usageLimit: body.usageLimit === null || body.usageLimit === "" || body.usageLimit === undefined ? null : Number(body.usageLimit),
    active: body.active !== false,
    startsAt: couponDateOrNull(body.startsAt),
    endsAt: couponDateOrNull(body.endsAt)
  };
  const validation = validateCouponRules(data as CouponRules);
  if (validation) return NextResponse.json({ error: validation }, { status: 400 });

  try {
    // Do not silently overwrite a live promotion when a new coupon is created.
    const coupon = await db.coupon.create({ data: { code, ...data, type: data.type as "fixed" | "percentage" } });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Mã coupon này đã tồn tại. Hãy chọn Sửa trên mã hiện tại." }, { status: 409 });
    }
    console.error("Create coupon failed", error);
    return NextResponse.json({ error: "Không thể tạo mã giảm giá." }, { status: 500 });
  }
}
