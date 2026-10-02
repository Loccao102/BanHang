import { NextResponse } from "next/server";
import type { BehaviorEventType, Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { recordBehaviorEvent, rebuildUserStyleProfile } from "@/lib/server/style-learning";

export const runtime = "nodejs";

const allowed = new Set<BehaviorEventType>([
  "product_view","search","wishlist_add","wishlist_remove","cart_add","cart_remove",
  "tryon_start","tryon_success","tryon_retry","tryon_reject",
  "recommendation_shown","recommendation_click","recommendation_accept","recommendation_reject",
  "order_created","purchase","review"
]);

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ recorded: false, mode: "browser" });

  const user = await getCurrentUser();
  const body = await request.json() as {
    type?: BehaviorEventType;
    productId?: string;
    guestKey?: string;
    source?: string;
    query?: string;
    metadata?: Prisma.InputJsonObject;
  };

  if (!body.type || !allowed.has(body.type)) {
    return NextResponse.json({ error: "Loại hành vi không hợp lệ." }, { status: 400 });
  }

  if (body.productId) {
    const exists = await db.product.findUnique({ where: { id: body.productId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Sản phẩm không tồn tại." }, { status: 404 });
  }

  await recordBehaviorEvent({
    db,
    type: body.type,
    userId: user?.id,
    guestKey: user ? null : String(body.guestKey ?? "").slice(0, 100) || null,
    productId: body.productId ?? null,
    source: String(body.source ?? "storefront").slice(0, 60),
    query: body.query ? String(body.query).slice(0, 300) : null,
    metadata: body.metadata ?? {}
  });

  if (user) await rebuildUserStyleProfile(db, user.id);
  return NextResponse.json({ recorded: true, learned: Boolean(user) });
}
