import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    await db.product.updateMany({ where: { id }, data: { active: false } });
    return NextResponse.json({ deleted: true, mode: "soft-delete" });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
