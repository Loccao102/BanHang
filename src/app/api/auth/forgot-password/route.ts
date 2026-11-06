import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";
import { sendTransactionalMail } from "@/lib/server/mailer";

export const runtime = "nodejs";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char] ?? char);
}

export async function POST(request: Request) {
  try {
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

    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
    const origin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
    const safeUrl = escapeHtml(resetUrl);
    const safeName = escapeHtml(user.name || "bạn");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;color:#171717;line-height:1.6">
        <h1 style="font-family:Georgia,serif;font-weight:400">Khôi phục tài khoản LSOUL</h1>
        <p>Xin chào ${safeName},</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <p style="margin:28px 0"><a href="${safeUrl}" style="background:#171717;color:#fff;padding:14px 24px;text-decoration:none;border-radius:28px;display:inline-block">Đặt lại mật khẩu</a></p>
        <p>Liên kết có hiệu lực trong <strong>30 phút</strong> và chỉ sử dụng được một lần.</p>
        <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p>
        <p style="color:#777;font-size:12px">Nếu nút không hoạt động, sao chép liên kết sau vào trình duyệt:<br/><a href="${safeUrl}">${safeUrl}</a></p>
      </div>
    `;
    const text = `Xin chào ${user.name || "bạn"},\n\nĐặt lại mật khẩu LSOUL bằng liên kết sau (có hiệu lực trong 30 phút):\n${resetUrl}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`;

    const delivery = await sendTransactionalMail({
      to: user.email,
      toName: user.name || undefined,
      subject: "Đặt lại mật khẩu LSOUL",
      html,
      text
    });

    const allowBuiltinLink = process.env.PASSWORD_RESET_EXPOSE_LINK !== "0";

    return NextResponse.json({
      accepted: true,
      delivered: delivery.delivered,
      provider: delivery.provider,
      ...(!delivery.delivered && allowBuiltinLink
        ? {
            resetUrl,
            recipientName: user.name,
            expiresMinutes: 30
          }
        : {})
    });
  } catch (error) {
    console.error("[LSOUL] Forgot password failed:", error);
    return NextResponse.json({ error: "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau." }, { status: 500 });
  }
}
