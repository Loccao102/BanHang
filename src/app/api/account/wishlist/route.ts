import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const body = await request.json() as { productIds?: string[] };
    const productIds = Array.from(new Set((body.productIds ?? []).filter(Boolean)));

    await db.$transaction([
      db.wishlistItem.deleteMany({ where: { userId: user.id } }),
      db.wishlistItem.createMany({ data: productIds.map((productId) => ({ userId: user.id, productId })) })
    ]);

    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}
