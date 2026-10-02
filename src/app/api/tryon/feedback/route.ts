import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { recordBehaviorEvent, rebuildUserStyleProfile } from "@/lib/server/style-learning";

export const runtime = "nodejs";

type Reaction = "accurate" | "love" | "inaccurate";

const reactions: Record<Reaction, { accepted: boolean; rating: number; event: "recommendation_accept" | "recommendation_reject"; weight: number }> = {
  accurate: { accepted: true, rating: 4, event: "recommendation_accept", weight: 2.5 },
  love: { accepted: true, rating: 5, event: "recommendation_accept", weight: 4 },
  inaccurate: { accepted: false, rating: 2, event: "recommendation_reject", weight: -3 }
};

function productIds(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 3) : [];
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    if (!db) return NextResponse.json({ recorded: false, learned: false, mode: "browser" });

    const user = await getCurrentUser();
    const body = await request.json() as { tryOnSessionId?: string; reaction?: Reaction };
    const reaction = body.reaction && reactions[body.reaction];

    if (!body.tryOnSessionId || !reaction) {
      return NextResponse.json({ error: "Phản hồi không hợp lệ." }, { status: 400 });
    }

    const session = await db.tryOnSession.findUnique({ where: { id: String(body.tryOnSessionId) } });
    if (!session) return NextResponse.json({ error: "Phiên thử đồ không tồn tại." }, { status: 404 });
    if (session.userId && session.userId !== user?.id) {
      return NextResponse.json({ error: "Bạn không có quyền phản hồi phiên thử đồ này." }, { status: 403 });
    }
    if (session.accepted !== null || session.rating !== null) {
      return NextResponse.json({ recorded: true, learned: false, alreadyRecorded: true });
    }

    await db.tryOnSession.update({
      where: { id: session.id },
      data: { accepted: reaction.accepted, rating: reaction.rating }
    });

    if (user) {
      for (const productId of productIds(session.productIds)) {
        await recordBehaviorEvent({
          db,
          userId: user.id,
          productId,
          type: reaction.event,
          source: "virtual-fitting-room-stylist",
          weight: reaction.weight,
          metadata: {
            tryOnSessionId: session.id,
            reaction: body.reaction,
            rating: reaction.rating,
            feedbackKind: "stylist-compatibility"
          }
        });
      }
      await rebuildUserStyleProfile(db, user.id);
    }

    return NextResponse.json({ recorded: true, learned: Boolean(user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không lưu được phản hồi." },
      { status: 500 }
    );
  }
}
