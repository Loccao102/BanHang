import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { rebuildUserStyleProfile } from "@/lib/server/style-learning";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const profile = await rebuildUserStyleProfile(db, user.id);
    const affinities = await db.productAffinity.findMany({
      where: { userId: user.id },
      orderBy: { score: "desc" },
      take: 12,
      include: { product: { select: { id: true, name: true, image: true, category: true, type: true, color: true } } }
    });
    return NextResponse.json({ profile, affinities });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}
