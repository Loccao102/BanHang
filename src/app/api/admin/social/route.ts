import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const posts = await db.socialPost.findMany({
      include: { products: { include: { product: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({
      posts: posts.map((post) => ({
        id: post.id, authorName: post.authorName, authorHandle: post.authorHandle, platform: post.platform,
        caption: post.caption, image: post.image, status: post.status, likes: post.likes, createdAt: post.createdAt.toISOString(),
        products: post.products.map((item) => item.product)
      }))
    });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const body = await request.json() as { id?: string; status?: "pending" | "approved" | "rejected" };
    if (!body.id || !body.status) return NextResponse.json({ error: "Thiếu dữ liệu." }, { status: 400 });
    const post = await db.socialPost.update({ where: { id: body.id }, data: { status: body.status } });
    return NextResponse.json({ post });
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật bài social." }, { status: 400 });
  }
}
