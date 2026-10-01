import { NextResponse } from "next/server";
import { getCurrentUser, requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!db) return NextResponse.json({ reviews: [], average: 0, count: 0 });

  const { id } = await params;
  const [reviews, aggregate, currentUser] = await Promise.all([
    db.review.findMany({
      where: { productId: id, approved: true },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }),
    db.review.aggregate({
      where: { productId: id, approved: true },
      _avg: { rating: true },
      _count: { rating: true }
    }),
    getCurrentUser()
  ]);

  let canReview = false;
  if (currentUser) {
    const existing = await db.review.findUnique({ where: { userId_productId: { userId: currentUser.id, productId: id } } });
    if (!existing) {
      const purchased = await db.orderItem.findFirst({
        where: { productId: id, order: { userId: currentUser.id, status: "completed" } }
      });
      canReview = Boolean(purchased);
    }
  }

  return NextResponse.json({
    average: aggregate._avg.rating ?? 0,
    count: aggregate._count.rating,
    canReview,
    reviews: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      images: Array.isArray(review.images) ? review.images : [],
      verified: review.verified,
      createdAt: review.createdAt.toISOString(),
      author: review.user.name
    }))
  });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const { id: productId } = await params;
    const body = await request.json() as { rating?: number; title?: string; content?: string; images?: string[] };
    const rating = Math.round(Number(body.rating ?? 0));
    const content = String(body.content ?? "").trim();

    if (rating < 1 || rating > 5) return NextResponse.json({ error: "Vui lòng chọn từ 1 đến 5 sao." }, { status: 400 });
    if (content.length < 10) return NextResponse.json({ error: "Nội dung đánh giá cần ít nhất 10 ký tự." }, { status: 400 });

    const existing = await db.review.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
    if (existing) return NextResponse.json({ error: "Bạn đã đánh giá sản phẩm này." }, { status: 409 });

    const orderItem = await db.orderItem.findFirst({
      where: { productId, order: { userId: user.id, status: "completed" } },
      orderBy: { id: "desc" }
    });
    if (!orderItem) return NextResponse.json({ error: "Chỉ khách đã nhận hàng mới có thể đánh giá." }, { status: 403 });

    const review = await db.review.create({
      data: {
        userId: user.id,
        productId,
        orderItemId: orderItem.id,
        rating,
        title: String(body.title ?? "").trim() || null,
        content,
        images: (body.images ?? []).filter(Boolean).slice(0, 4),
        verified: true,
        approved: true
      }
    });

    return NextResponse.json({ saved: true, id: review.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}
