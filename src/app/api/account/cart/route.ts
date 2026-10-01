import { NextResponse } from "next/server";
import type { CartLine } from "@/lib/cart";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const body = await request.json() as { items?: CartLine[] };
    const items = (body.items ?? []).filter((line) => line.product?.id && line.quantity > 0);

    await db.$transaction([
      db.cartItem.deleteMany({ where: { userId: user.id } }),
      db.cartItem.createMany({
        data: items.map((line) => ({
          userId: user.id,
          productId: line.product.id,
          size: line.size ?? "",
          quantity: line.quantity
        }))
      })
    ]);

    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}
