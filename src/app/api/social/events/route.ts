import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ saved: false });
  const user = await getCurrentUser();
  const body = await request.json() as { type?: string; channel?: string; postId?: string; productId?: string };

  const type = String(body.type ?? "").trim();
  const channel = String(body.channel ?? "").trim();
  if (!type || !channel) return NextResponse.json({ error: "Thiếu thông tin sự kiện." }, { status: 400 });

  await db.socialEvent.create({
    data: {
      userId: user?.id ?? null,
      postId: body.postId || null,
      productId: body.productId || null,
      type,
      channel
    }
  });

  return NextResponse.json({ saved: true });
}
