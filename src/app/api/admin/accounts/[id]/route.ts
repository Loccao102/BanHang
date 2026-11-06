import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { sendTransactionalMail } from "@/lib/server/mailer";

export const runtime = "nodejs";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    const body = await request.json() as { action?: string; role?: string };
    const target = await db.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true } });
    if (!target) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });

    if (body.action === "revoke-sessions") {
      if (id === admin.id) return NextResponse.json({ error: "Không thể tự thu hồi phiên đăng nhập của chính mình." }, { status: 400 });
      const result = await db.session.deleteMany({ where: { userId: id } });
      return NextResponse.json({ revoked: result.count });
    }

    if (body.action === "change-role") {
      if (id === admin.id) return NextResponse.json({ error: "Không thể tự thay đổi quyền của chính mình." }, { status: 400 });
      if (body.role !== "customer" && body.role !== "admin") return NextResponse.json({ error: "Vai trò không hợp lệ." }, { status: 400 });
      if (target.role === "admin" && body.role === "customer" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
        return NextResponse.json({ error: "Không thể hạ quyền quản trị viên cuối cùng." }, { status: 409 });
      }
      await db.user.update({ where: { id }, data: { role: body.role } });
      await db.session.deleteMany({ where: { userId: id } });
      return NextResponse.json({ updated: true, role: body.role });
    }

    if (body.action === "create-reset-link") {
      await db.passwordResetToken.deleteMany({ where: { userId: target.id, usedAt: null } });
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await db.passwordResetToken.create({
        data: { id: randomUUID(), tokenHash: hashToken(token), userId: target.id, expiresAt }
      });

      const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.AUTH_URL;
      const origin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

      const delivery = await sendTransactionalMail({
        to: target.email,
        toName: target.name || undefined,
        subject: "Đặt lại mật khẩu LSOUL",
        html: `<p>Xin chào ${target.name || "bạn"},</p><p>Quản trị viên LSOUL đã tạo liên kết đặt lại mật khẩu cho bạn (hiệu lực 30 phút):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        text: `Đặt lại mật khẩu LSOUL (hiệu lực 30 phút): ${resetUrl}`
      });

      return NextResponse.json({
        resetUrl,
        delivered: delivery.delivered,
        provider: delivery.provider
      });
    }

    return NextResponse.json({ error: "Thao tác không hợp lệ." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
