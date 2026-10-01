import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Hệ thống tài khoản chưa được cấu hình." }, { status: 503 });

  const body = await request.json() as { name?: string; email?: string; phone?: string; password?: string };
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const password = String(body.password ?? "");

  if (name.length < 2) return NextResponse.json({ error: "Vui lòng nhập họ tên." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Email chưa hợp lệ." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Mật khẩu cần ít nhất 8 ký tự." }, { status: 400 });

  const exists = await db.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email này đã được sử dụng." }, { status: 409 });

  const user = await db.user.create({
    data: {
      id: randomUUID(),
      name,
      email,
      phone: phone || null,
      passwordHash: hashPassword(password),
      role: "customer"
    }
  });

  await createSession(user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone ?? undefined, role: user.role }
  }, { status: 201 });
}
