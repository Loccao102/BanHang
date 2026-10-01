import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
    return NextResponse.json({ addresses });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const body = await request.json() as { label?: string; recipientName?: string; phone?: string; address?: string; city?: string; isDefault?: boolean };
    const data = {
      label: String(body.label ?? "Địa chỉ").trim(),
      recipientName: String(body.recipientName ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      address: String(body.address ?? "").trim(),
      city: String(body.city ?? "").trim(),
      isDefault: Boolean(body.isDefault)
    };

    if (!data.recipientName || !data.phone || !data.address || !data.city) {
      return NextResponse.json({ error: "Vui lòng nhập đủ thông tin địa chỉ." }, { status: 400 });
    }

    if (data.isDefault) await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });

    const created = await db.address.create({ data: { id: randomUUID(), userId: user.id, ...data } });
    return NextResponse.json({ address: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}
