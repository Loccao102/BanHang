import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { hashPassword, verifyPassword } from "@/lib/server/password";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const body = await request.json() as { currentPassword?: string; newPassword?: string };
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");

    if (newPassword.length < 8) return NextResponse.json({ error: "Mật khẩu mới cần ít nhất 8 ký tự." }, { status: 400 });

    const record = await db.user.findUnique({ where: { id: user.id } });
    if (!record || !verifyPassword(currentPassword, record.passwordHash)) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 400 });
    }

    await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } });
    return NextResponse.json({ updated: true });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}
