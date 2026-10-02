import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";

export const runtime = "nodejs";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Hệ thống tài khoản chưa được cấu hình." }, { status: 503 });

  const body = await request.json() as { token?: string; password?: string };
  const token = String(body.token ?? "");
  const password = String(body.password ?? "");

  if (!token) return NextResponse.json({ error: "Liên kết đặt lại mật khẩu không hợp lệ." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Mật khẩu mới cần ít nhất 8 ký tự." }, { status: 400 });

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt <= new Date()) {
    return NextResponse.json({ error: "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ." }, { status: 400 });
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash: hashPassword(password) } });
    await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await tx.session.deleteMany({ where: { userId: record.userId } });
  });

  await createSession(record.userId);
  return NextResponse.json({ updated: true });
}
