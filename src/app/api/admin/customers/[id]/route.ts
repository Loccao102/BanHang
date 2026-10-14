import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const db = getDb()!;
    const { id } = await params;
    const user = await db.user.findFirst({
      where: { id, role: "customer" },
      include: {
        addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
        wishlist: { include: { product: { select: { id: true, name: true, image: true, price: true } } } },
        orders: { include: { items: true }, orderBy: { createdAt: "desc" } },
        styleProfile: true,
        productAffinities: {
          orderBy: { score: "desc" },
          take: 10,
          include: { product: { select: { id: true, name: true, image: true, category: true, color: true } } }
        },
        tryOnSessions: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, status: true, accepted: true, productIds: true, createdAt: true } },
        outfitAssessments: { orderBy: { createdAt: "desc" }, take: 20, select: { overallScore: true, feedback: true, createdAt: true } }
      }
    });
    if (!user) return NextResponse.json({ error: "Không tìm thấy khách hàng." }, { status: 404 });

    const validOrders = user.orders.filter((o) => o.status !== "cancelled" && o.paymentStatus === "paid");
    return NextResponse.json({
      customer: {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        createdAt: user.createdAt.toISOString(),
        lifetimeValue: validOrders.reduce((s,o) => s + o.total, 0),
        orders: user.orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
        addresses: user.addresses,
        wishlist: user.wishlist.map((x) => x.product),
        styleProfile: user.styleProfile,
        affinities: user.productAffinities.map((x) => ({ score: x.score, product: x.product })),
        tryOns: user.tryOnSessions.map((x) => ({ ...x, createdAt: x.createdAt.toISOString() })),
        assessments: user.outfitAssessments.map((x) => ({ ...x, createdAt: x.createdAt.toISOString() }))
      }
    });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
