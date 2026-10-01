import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const body = await request.json() as { name?: string; phone?: string };
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (name.length < 2) return NextResponse.json({ error: "Họ tên chưa hợp lệ." }, { status: 400 });

    const updated = await db.user.update({
      where: { id: user.id },
      data: { name, phone: phone || null }
    });

    return NextResponse.json({ user: { id: updated.id, email: updated.email, name: updated.name, phone: updated.phone ?? undefined, role: updated.role } });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}
