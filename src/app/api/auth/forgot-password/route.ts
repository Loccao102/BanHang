import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Hệ thống tài khoản chưa được cấu hình." }, { status: 503 });

  const body = await request.json() as { email?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Email chưa hợp lệ." }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ accepted: true });

  await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await db.passwordResetToken.create({
    data: { id: randomUUID(), tokenHash: hashToken(token), userId: user.id, expiresAt }
  });

  const origin = new URL(request.url).origin;
  const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

  // Chưa tích hợp dịch vụ gửi email: ở môi trường phát triển/demo, liên kết được ghi ra log
  // và trả về response để luồng đặt lại mật khẩu vẫn kiểm thử được.
  // Production chỉ bật khi đặt PASSWORD_RESET_EXPOSE_LINK=1 (ví dụ khi demo đồ án).
  const exposeLink = process.env.NODE_ENV !== "production" || process.env.PASSWORD_RESET_EXPOSE_LINK === "1";
  if (exposeLink) {
    console.log(`[LSOUL] Liên kết đặt lại mật khẩu cho ${user.email}: ${resetUrl}`);
  }

  return NextResponse.json({
    accepted: true,
    ...(exposeLink ? { resetUrl } : {})
  });
}
