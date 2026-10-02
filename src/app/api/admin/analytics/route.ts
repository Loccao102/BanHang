import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const [orders, customers, products, items] = await Promise.all([
      db.order.findMany({ orderBy: { createdAt: "desc" } }),
      db.user.count({ where: { role: "customer" } }),
      db.product.findMany({ select: { id: true, name: true, category: true, stock: true, active: true } }),
      db.orderItem.findMany({
        where: { order: { status: { not: "cancelled" } } },
        select: { productId: true, productName: true, quantity: true, productPrice: true, order: { select: { createdAt: true } } }
      })
    ]);

    const activeOrders = orders.filter((o) => o.status !== "cancelled");
    const paidOrders = orders.filter((o) =>
      o.status !== "cancelled" && (o.paymentStatus === "paid" || (o.payment === "cod" && o.status === "completed"))
    );
    const paidRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const grossOrderValue = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const averageOrderValue = paidOrders.length ? Math.round(paidRevenue / paidOrders.length) : 0;

    const daily = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      daily.set(key, { date: key, orders: 0, revenue: 0 });
    }
    for (const order of orders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const bucket = daily.get(key);
      if (!bucket) continue;
      if (order.status !== "cancelled") bucket.orders += 1;
      if (order.paymentStatus === "paid" || (order.payment === "cod" && order.status === "completed")) bucket.revenue += order.total;
    }

    const top = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
    for (const item of items) {
      const current = top.get(item.productId) ?? { productId: item.productId, name: item.productName, quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += item.quantity * item.productPrice;
      top.set(item.productId, current);
    }

    const byStatus = Object.fromEntries(["processing","confirmed","shipping","completed","cancelled"].map((status) => [
      status, orders.filter((o) => o.status === status).length
    ]));
    const byPayment = Object.fromEntries(["pending","paid","cod_pending","failed","refunded"].map((status) => [
      status, orders.filter((o) => o.paymentStatus === status).length
    ]));

    return NextResponse.json({
      summary: {
        customers,
        products: products.length,
        activeProducts: products.filter((p) => p.active).length,
        totalStock: products.reduce((sum, p) => sum + p.stock, 0),
        orders: orders.length,
        paidOrders: paidOrders.length,
        paidRevenue,
        grossOrderValue,
        averageOrderValue
      },
      byStatus,
      byPayment,
      daily: [...daily.values()],
      topProducts: [...top.values()].sort((a,b) => b.quantity - a.quantity).slice(0, 10)
    });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
