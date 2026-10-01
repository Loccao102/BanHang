import { NextResponse } from "next/server";
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
  try {
    await requireAdmin();
    const db = getDb()!;
    const body = await request.json() as {
      code?: string; type?: "percentage" | "fixed"; value?: number; minOrder?: number;
      maxDiscount?: number | null; usageLimit?: number | null; active?: boolean;
    };
    const code = String(body.code ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return NextResponse.json({ error: "Mã coupon chưa hợp lệ." }, { status: 400 });

    const coupon = await db.coupon.upsert({
      where: { code },
      create: {
        code,
        type: body.type === "fixed" ? "fixed" : "percentage",
        value: Math.max(1, Number(body.value ?? 0)),
        minOrder: Math.max(0, Number(body.minOrder ?? 0)),
        maxDiscount: body.maxDiscount ? Math.max(0, Number(body.maxDiscount)) : null,
        usageLimit: body.usageLimit ? Math.max(1, Number(body.usageLimit)) : null,
        active: body.active !== false
      },
      update: {
        type: body.type === "fixed" ? "fixed" : "percentage",
        value: Math.max(1, Number(body.value ?? 0)),
        minOrder: Math.max(0, Number(body.minOrder ?? 0)),
        maxDiscount: body.maxDiscount ? Math.max(0, Number(body.maxDiscount)) : null,
        usageLimit: body.usageLimit ? Math.max(1, Number(body.usageLimit)) : null,
        active: body.active !== false
      }
    });

    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
