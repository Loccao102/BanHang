import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ saved: false, mode: "browser" });

  const body = await request.json() as { promoText: string };

  await db.storeSetting.upsert({
    where: { key: "promoText" },
    create: { key: "promoText", value: body.promoText },
    update: { value: body.promoText }
  });

  return NextResponse.json({ saved: true });
}
