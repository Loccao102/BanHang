import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

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
    // Keep the response identical for known and unknown addresses.
    if (!user) return NextResponse.json({ accepted: true });

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      console.error("[LSOUL] Password reset email is not configured: RESEND_API_KEY or EMAIL_FROM is missing.");
      return NextResponse.json({ error: "Chức năng gửi email khôi phục chưa được cấu hình. Vui lòng thử lại sau." }, { status: 503 });
    }

    await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const tokenRecord = await db.passwordResetToken.create({
      data: { id: randomUUID(), tokenHash: hashToken(token), userId: user.id, expiresAt }
    });

    const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
    const origin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
    const safeUrl = escapeHtml(resetUrl);
    const safeName = escapeHtml(user.name || "bạn");

    try {
      const mailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [user.email],
          subject: "Đặt lại mật khẩu LSOUL",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:32px auto;color:#171717;line-height:1.6">
              <h1 style="font-family:Georgia,serif;font-weight:400">Khôi phục tài khoản LSOUL</h1>
              <p>Xin chào ${safeName},</p>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
              <p style="margin:28px 0"><a href="${safeUrl}" style="background:#171717;color:#fff;padding:14px 24px;text-decoration:none;border-radius:28px;display:inline-block">Đặt lại mật khẩu</a></p>
              <p>Liên kết có hiệu lực trong <strong>30 phút</strong> và chỉ sử dụng được một lần.</p>
              <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p>
              <p style="color:#777;font-size:12px">Nếu nút không hoạt động, sao chép liên kết sau vào trình duyệt:<br/><a href="${safeUrl}">${safeUrl}</a></p>
            </div>
          `
        })
      });

      if (!mailResponse.ok) {
        const detail = await mailResponse.text();
        console.error("[LSOUL] Resend rejected password reset email:", mailResponse.status, detail.slice(0, 1000));
        await db.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => undefined);
        return NextResponse.json({ error: "Không gửi được email khôi phục. Vui lòng thử lại sau." }, { status: 502 });
      }
    } catch (error) {
      console.error("[LSOUL] Password reset email request failed:", error);
      await db.passwordResetToken.delete({ where: { id: tokenRecord.id } }).catch(() => undefined);
      return NextResponse.json({ error: "Không thể kết nối dịch vụ gửi email. Vui lòng thử lại sau." }, { status: 502 });
    }

    return NextResponse.json({ accepted: true });
  } catch (error) {
    console.error("[LSOUL] Forgot password failed:", error);
    return NextResponse.json({ error: "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại sau." }, { status: 500 });
  }
}
