import { NextResponse } from "next/server";
import { products as fallbackProducts, type Product } from "@/lib/products";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";
import { assessTryOnLook } from "@/lib/server/stylist-assessment";
import { isValidOutfit } from "@/lib/wardrobe";

export const runtime = "nodejs";
export const maxDuration = 60;

function jsonIds(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 3) : [];
}

async function loadProducts(productIds: string[]) {
  const db = getDb();
  if (!db) {
    return productIds.flatMap((id) => {
      const product = fallbackProducts.find((item) => item.id === id && item.active !== false);
      return product ? [product] : [];
    });
  }

  const rows = await db.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: {
      variants: { where: { active: true } }
    }
  });
  const map = new Map<string, Product>(rows.map((row) => [row.id, fromProductRow(row)]));
  return productIds.flatMap((id) => {
    const product = map.get(id);
    return product ? [product] : [];
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      tryOnSessionId?: string | null;
      resultImage?: string;
      productIds?: string[];
    };

    const db = getDb();
    const user = await getCurrentUser();
    let resultImage = String(body.resultImage ?? "");
    let productIds = jsonIds(body.productIds);
    let session: {
      id: string;
      userId: string | null;
      status: string;
      productIds: unknown;
      resultUrl: string | null;
    } | null = null;

    if (db && body.tryOnSessionId) {
      session = await db.tryOnSession.findUnique({
        where: { id: String(body.tryOnSessionId) },
        select: { id: true, userId: true, status: true, productIds: true, resultUrl: true }
      });
      if (!session) return NextResponse.json({ error: "Phiên thử đồ không tồn tại." }, { status: 404 });
      if (session.userId && session.userId !== user?.id) {
        return NextResponse.json({ error: "Bạn không có quyền xem phiên thử đồ này." }, { status: 403 });
      }
      if (session.status !== "completed") {
        return NextResponse.json({ error: "Phiên thử đồ chưa hoàn tất." }, { status: 400 });
      }
      productIds = jsonIds(session.productIds);
      resultImage = session.resultUrl ?? resultImage;
    }

    if (!resultImage || (!resultImage.startsWith("https://") && !resultImage.startsWith("data:image/"))) {
      return NextResponse.json({ error: "Thiếu ảnh kết quả hợp lệ để AI Stylist đánh giá." }, { status: 400 });
    }
    if (!productIds.length) {
      return NextResponse.json({ error: "Thiếu sản phẩm trong outfit." }, { status: 400 });
    }

    const products = await loadProducts(productIds);
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "Không đọc đủ metadata của outfit." }, { status: 400 });
    }
    if (!isValidOutfit(products)) {
      return NextResponse.json({
        error: "Vui lòng chọn trang phục hợp lệ để stylist chấm điểm phù hợp."
      }, { status: 400 });
    }

    const profile = db && user
      ? await db.userStyleProfile.findUnique({ where: { userId: user.id } })
      : null;

    const assessment = await assessTryOnLook({
      image: resultImage,
      products,
      profile
    });

    if (db && session) {
      const score = Object.fromEntries(assessment.scores.map((item) => [item.key, item.score]));
      await db.outfitAssessment.upsert({
        where: { tryOnSessionId: session.id },
        create: {
          tryOnSessionId: session.id,
          userId: user?.id ?? session.userId,
          productIds,
          overallScore: assessment.overallScore,
          colorScore: score.color ?? 0,
          proportionScore: score.proportion ?? 0,
          styleScore: score.style ?? 0,
          preferenceScore: score.preference ?? 0,
          renderScore: score.render ?? 0,
          verdict: assessment.verdict,
          summary: assessment.summary,
          positives: assessment.positives,
          cautions: assessment.cautions,
          suggestions: assessment.suggestions,
          mode: assessment.mode,
          profileConfidence: assessment.profileConfidence
        },
        update: {
          userId: user?.id ?? session.userId,
          productIds,
          overallScore: assessment.overallScore,
          colorScore: score.color ?? 0,
          proportionScore: score.proportion ?? 0,
          styleScore: score.style ?? 0,
          preferenceScore: score.preference ?? 0,
          renderScore: score.render ?? 0,
          verdict: assessment.verdict,
          summary: assessment.summary,
          positives: assessment.positives,
          cautions: assessment.cautions,
          suggestions: assessment.suggestions,
          mode: assessment.mode,
          profileConfidence: assessment.profileConfidence
        }
      });
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI Stylist chưa thể đánh giá outfit." },
      { status: 500 }
    );
  }
}
