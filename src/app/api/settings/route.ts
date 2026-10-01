import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const body = await request.json() as { promoText: string };

    await db.storeSetting.upsert({
      where: { key: "promoText" },
      create: { key: "promoText", value: body.promoText },
      update: { value: body.promoText }
    });

    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
