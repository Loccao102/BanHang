import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const [tryOns, assessments, profiles, recommendations, events] = await Promise.all([
      db.tryOnSession.findMany({ select: { status: true, accepted: true, createdAt: true } }),
      db.outfitAssessment.findMany({ select: { overallScore: true, feedback: true, mode: true, createdAt: true } }),
      db.userStyleProfile.findMany({ select: { confidence: true, eventCount: true, lastLearnedAt: true } }),
      db.aIRecommendation.findMany({ select: { feedback: true, model: true, createdAt: true } }),
      db.userBehaviorEvent.findMany({ orderBy: { createdAt: "desc" }, take: 500, select: { type: true, source: true, createdAt: true } })
    ]);

    const completed = tryOns.filter((x) => x.status === "completed").length;
    const feedbackCounts = assessments.reduce<Record<string, number>>((acc, item) => {
      const key = item.feedback ?? "none";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const recommendationFeedback = recommendations.reduce<Record<string, number>>((acc, item) => {
      const key = item.feedback;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const eventTypes = events.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      tryOn: {
        total: tryOns.length,
        completed,
        failed: tryOns.filter((x) => x.status === "failed").length,
        rejected: tryOns.filter((x) => x.status === "rejected").length,
        successRate: tryOns.length ? Math.round(completed * 1000 / tryOns.length) / 10 : 0,
        accepted: tryOns.filter((x) => x.accepted === true).length
      },
      stylist: {
        assessments: assessments.length,
        averageScore: assessments.length ? Math.round(assessments.reduce((s,x) => s + x.overallScore, 0) / assessments.length) : 0,
        feedback: feedbackCounts
      },
      personalization: {
        profiles: profiles.length,
        averageConfidence: profiles.length ? Math.round(profiles.reduce((s,x) => s + x.confidence, 0) * 1000 / profiles.length) / 10 : 0,
        signals: profiles.reduce((s,x) => s + x.eventCount, 0)
      },
      recommendations: {
        total: recommendations.length,
        feedback: recommendationFeedback
      },
      recentBehavior: eventTypes
    });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
