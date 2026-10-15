import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { recordBehaviorEvent, rebuildUserStyleProfile } from "@/lib/server/style-learning";

export const runtime = "nodejs";

type FeedbackRequest = {
  conversationId?: string;
  messageId?: string;
  rating: "thumbs_up" | "thumbs_down";
  feedbackReason?: string;
  productIds?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackRequest;
    const rating = body.rating;

    if (rating !== "thumbs_up" && rating !== "thumbs_down") {
      return NextResponse.json({ error: "Rating không hợp lệ." }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: true, persisted: false });
    }

    const user = await getCurrentUser();
    if (!user) {
      // Guest feedback is accepted gracefully
      return NextResponse.json({ success: true, persisted: false, guest: true });
    }

    // 1. Locate latest AI recommendation record for this conversation/user
    let recommendation = body.conversationId
      ? await db.aIRecommendation.findFirst({
          where: { conversationId: body.conversationId, userId: user.id },
          orderBy: { createdAt: "desc" }
        })
      : null;

    if (!recommendation) {
      recommendation = await db.aIRecommendation.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" }
      });
    }

    // 2. Update recommendation record
    if (recommendation) {
      const existingScores = (typeof recommendation.scores === "object" && recommendation.scores !== null)
        ? (recommendation.scores as Record<string, unknown>)
        : {};

      await db.aIRecommendation.update({
        where: { id: recommendation.id },
        data: {
          feedback: rating === "thumbs_up" ? "accepted" : "rejected",
          feedbackAt: new Date(),
          acceptedProductIds: (rating === "thumbs_up" ? (body.productIds ?? (Array.isArray(recommendation.productIds) ? recommendation.productIds : [])) : []) as string[],
          scores: {
            ...existingScores,
            userFeedback: rating,
            feedbackReason: body.feedbackReason || null,
            feedbackSubmittedAt: new Date().toISOString()
          }
        }
      });
    }

    // 3. Record behavior events for style learning
    const eventType = rating === "thumbs_up" ? "recommendation_accept" : "recommendation_reject";
    const productIds = body.productIds?.length
      ? body.productIds
      : Array.isArray(recommendation?.productIds)
      ? (recommendation.productIds as string[])
      : [];

    if (productIds.length) {
      for (const productId of productIds) {
        await recordBehaviorEvent({
          db,
          userId: user.id,
          productId,
          type: eventType,
          source: "chat_stylist_feedback",
          metadata: {
            conversationId: body.conversationId,
            messageId: body.messageId,
            feedbackReason: body.feedbackReason || null,
            rating
          }
        });
      }
    } else {
      await recordBehaviorEvent({
        db,
        userId: user.id,
        type: eventType,
        source: "chat_stylist_feedback",
        metadata: {
          conversationId: body.conversationId,
          messageId: body.messageId,
          feedbackReason: body.feedbackReason || null,
          rating
        }
      });
    }

    // 4. Trigger asynchronous rebuild of user style preferences
    void rebuildUserStyleProfile(db, user.id).catch((err) => {
      console.warn("Failed to rebuild user style profile after chat feedback:", err);
    });

    return NextResponse.json({
      success: true,
      persisted: true,
      feedback: rating,
      recommendationId: recommendation?.id || null
    });
  } catch (error) {
    console.error("Chat feedback API error:", error);
    return NextResponse.json(
      { error: "Lỗi ghi nhận phản hồi từ người dùng." },
      { status: 500 }
    );
  }
}
