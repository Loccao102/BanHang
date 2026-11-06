import { createHash, randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { sendTransactionalMail } from "@/lib/server/mailer";
import { hashPassword } from "@/lib/server/password";

export const runtime = "nodejs";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      password?: string;
    };

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, role: true }
    });
    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
    }

    // Default to "edit" if name/email are passed without an explicit action
    const action =
      body.action ||
      (body.name !== undefined || body.email !== undefined || body.phone !== undefined
        ? "edit"
        : body.role !== undefined
        ? "change-role"
        : "");

    if (action === "edit") {
      const name = String(body.name ?? target.name ?? "").trim();
      const email = String(body.email ?? target.email ?? "").trim().toLowerCase();
      const phone = body.phone !== undefined ? String(body.phone ?? "").trim() : target.phone ?? "";
      if (name.length < 2) {
        return NextResponse.json({ error: "Họ tên cần ít nhất 2 ký tự." }, { status: 400 });
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: "Email chưa hợp lệ." }, { status: 400 });
      }
      const duplicate = await db.user.findFirst({
        where: { email, id: { not: id } },
        select: { id: true }
      });
      if (duplicate) {
        return NextResponse.json({ error: "Email đã được tài khoản khác sử dụng." }, { status: 409 });
      }

      const nextRole =
        body.role === "admin" || body.role === "customer" ? body.role : target.role;
      if (id === admin.id && nextRole !== target.role) {
        return NextResponse.json({ error: "Không thể tự thay đổi quyền của chính mình." }, { status: 400 });
      }
      if (target.role === "admin" && nextRole === "customer") {
        const adminCount = await db.user.count({ where: { role: "admin" } });
        if (adminCount <= 1) {
          return NextResponse.json({ error: "Không thể hạ quyền quản trị viên cuối cùng." }, { status: 409 });
        }
      }

      const customPassword = String(body.password ?? "").trim();
      if (customPassword && customPassword.length < 8) {
        return NextResponse.json({ error: "Mật khẩu mới cần ít nhất 8 ký tự." }, { status: 400 });
      }

      await db.user.update({
        where: { id },
        data: {
          name,
          email,
          phone: phone || null,
          role: nextRole,
          ...(customPassword ? { passwordHash: hashPassword(customPassword) } : {})
        }
      });
      return NextResponse.json({ updated: true, role: nextRole });
    }

    if (action === "reset-password" || action === "set-password") {
      const customPassword = String(body.password ?? "").trim();
      if (customPassword && customPassword.length < 8) {
        return NextResponse.json({ error: "Mật khẩu cần ít nhất 8 ký tự." }, { status: 400 });
      }
      const temporaryPassword = customPassword || randomBytes(9).toString("base64url");
      await db.$transaction([
        db.user.update({ where: { id }, data: { passwordHash: hashPassword(temporaryPassword) } }),
        db.session.deleteMany({ where: { userId: id } }),
        db.passwordResetToken.deleteMany({ where: { userId: id } })
      ]);
      return NextResponse.json({ updated: true, temporaryPassword });
    }

    if (action === "create-reset-link") {
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
        updated: true,
        resetUrl,
        delivered: delivery.delivered,
        provider: delivery.provider
      });
    }

    if (action === "revoke-sessions") {
      if (id === admin.id) {
        return NextResponse.json(
          { error: "Không thể tự thu hồi phiên đăng nhập của tài khoản đang dùng." },
          { status: 400 }
        );
      }
      const result = await db.session.deleteMany({ where: { userId: id } });
      return NextResponse.json({ revoked: result.count });
    }

    if (action === "change-role") {
      if (id === admin.id) {
        return NextResponse.json({ error: "Không thể tự thay đổi quyền của chính mình." }, { status: 400 });
      }
      const nextRole =
        body.role === "admin" || body.role === "customer"
          ? body.role
          : target.role === "admin"
          ? "customer"
          : "admin";
      if (target.role === "admin" && nextRole === "customer" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
        return NextResponse.json({ error: "Không thể hạ quyền quản trị viên cuối cùng." }, { status: 409 });
      }
      await db.user.update({ where: { id }, data: { role: nextRole } });
      await db.session.deleteMany({ where: { userId: id } });
      return NextResponse.json({ updated: true, role: nextRole });
    }

    return NextResponse.json({ error: `Thao tác không hợp lệ (${action || "trống"}).` }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập hoặc thao tác thất bại." }, { status: 403 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    if (id === admin.id) {
      return NextResponse.json({ error: "Không thể xóa tài khoản đang đăng nhập." }, { status: 400 });
    }
    const target = await db.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!target) {
      return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
    }
    if (target.role === "admin" && (await db.user.count({ where: { role: "admin" } })) <= 1) {
      return NextResponse.json({ error: "Không thể xóa quản trị viên cuối cùng." }, { status: 409 });
    }
    await db.user.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập hoặc không thể xóa tài khoản." }, { status: 403 });
  }
}
