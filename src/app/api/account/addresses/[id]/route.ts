import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const { id } = await params;
    const current = await db.address.findFirst({ where: { id, userId: user.id } });
    if (!current) return NextResponse.json({ error: "Không tìm thấy địa chỉ." }, { status: 404 });

    const body = await request.json() as Partial<{ label: string; recipientName: string; phone: string; address: string; city: string; isDefault: boolean }>;
    if (body.isDefault) await db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });

    const updated = await db.address.update({
      where: { id },
      data: {
        label: body.label?.trim() ?? current.label,
        recipientName: body.recipientName?.trim() ?? current.recipientName,
        phone: body.phone?.trim() ?? current.phone,
        address: body.address?.trim() ?? current.address,
        city: body.city?.trim() ?? current.city,
        isDefault: body.isDefault ?? current.isDefault
      }
    });
    return NextResponse.json({ address: updated });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const db = getDb()!;
    const { id } = await params;
    await db.address.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  }
}
