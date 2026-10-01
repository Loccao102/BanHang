import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const users = await db.user.findMany({
      where: { role: "customer" },
      include: {
        _count: { select: { orders: true, wishlist: true, addresses: true } },
        orders: { where: { status: { not: "cancelled" } }, select: { total: true, createdAt: true }, orderBy: { createdAt: "desc" } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      customers: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt.toISOString(),
        orderCount: user._count.orders,
        wishlistCount: user._count.wishlist,
        addressCount: user._count.addresses,
        lifetimeValue: user.orders.reduce((sum, order) => sum + order.total, 0),
        lastOrderAt: user.orders[0]?.createdAt.toISOString() ?? null
      }))
    });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
