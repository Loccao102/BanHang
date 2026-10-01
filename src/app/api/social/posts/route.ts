import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { getCurrentUser, requireUser } from "@/lib/server/auth";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ posts: [] });

  const posts = await db.socialPost.findMany({
    where: { status: "approved" },
    include: {
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: {
            include: { variants: true, reviews: { where: { approved: true }, select: { rating: true } } }
          }
        }
      }
    },
    orderBy: { publishedAt: "desc" },
    take: 40
  });

  return NextResponse.json({
    posts: posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      platform: post.platform,
      authorName: post.authorName,
      authorHandle: post.authorHandle,
      caption: post.caption,
      image: post.image,
      videoUrl: post.videoUrl,
      likes: post.likes,
      comments: post.comments,
      saves: post.saves,
      publishedAt: post.publishedAt.toISOString(),
      products: post.products.map((link) => fromProductRow(link.product))
    }))
  });
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const body = await request.json() as {
      caption?: string;
      image?: string;
      platform?: string;
      handle?: string;
      productIds?: string[];
    };
    const caption = String(body.caption ?? "").trim();
    const image = String(body.image ?? "").trim();
    const productIds = Array.from(new Set((body.productIds ?? []).filter(Boolean))).slice(0, 4);

    if (caption.length < 10 || !image.startsWith("http")) {
      return NextResponse.json({ error: "Vui lòng thêm caption và URL ảnh hợp lệ." }, { status: 400 });
    }

    const validProducts = productIds.length
      ? await db.product.findMany({ where: { id: { in: productIds }, active: true }, select: { id: true } })
      : [];

    const post = await db.socialPost.create({
      data: {
        slug: `community-${Date.now()}-${randomUUID().slice(0, 6)}`,
        userId: user.id,
        platform: String(body.platform ?? "community").trim().toLowerCase(),
        authorName: user.name,
        authorHandle: String(body.handle ?? "").trim() || `@${user.name.toLowerCase().replace(/\s+/g, "")}`,
        caption,
        image,
        status: "pending",
        products: {
          create: validProducts.map((product, sortOrder) => ({ productId: product.id, sortOrder }))
        }
      }
    });

    return NextResponse.json({ submitted: true, id: post.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập để gửi bài." }, { status: 401 });
  }
}
