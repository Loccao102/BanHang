import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { analyticsDay, isRecognizedPaidOrder, parseAnalyticsDays } from "@/lib/admin-analytics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try { await requireAdmin(); }
  catch { return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 }); }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const days = parseAnalyticsDays(new URL(request.url).searchParams.get("days"));
  const today = new Date();
  const endDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const since = new Date(endDay.getTime() - (days - 1) * 86400000);
  const tomorrow = new Date(endDay.getTime() + 86400000);

  try {
    const [orders, customers, products, items] = await Promise.all([
      db.order.findMany({
        where: {
          OR: [
            { createdAt: { gte: since, lt: tomorrow } },
            { paidAt: { gte: since, lt: tomorrow } }
          ]
        },
        select: {
          id: true, status: true, paymentStatus: true, payment: true,
          total: true, createdAt: true, paidAt: true
        }
      }),
      db.user.count({ where: { role: "customer" } }),
      db.product.findMany({ select: { id: true, stock: true, active: true } }),
      db.orderItem.findMany({
        where: {
          order: {
            status: { not: "cancelled" },
            paymentStatus: "paid",
            paidAt: { gte: since, lt: tomorrow }
          }
        },
        select: { productId: true, productName: true, quantity: true, productPrice: true }
      })
    ]);

    const placedOrders = orders.filter((order) => order.createdAt >= since && order.createdAt < tomorrow);
    const activeOrders = placedOrders.filter((order) => order.status !== "cancelled");
    const revenueOrders = orders.filter((order) =>
      isRecognizedPaidOrder(order) &&
      order.paidAt && order.paidAt >= since && order.paidAt < tomorrow
    );
    const paidRevenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
    const grossOrderValue = activeOrders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = revenueOrders.length ? Math.round(paidRevenue / revenueOrders.length) : 0;

    const daily = new Map<string, { date: string; orders: number; revenue: number }>();
    for (let day = 0; day < days; day++) {
      const date = new Date(since.getTime() + day * 86400000);
      const key = analyticsDay(date);
      daily.set(key, { date: key, orders: 0, revenue: 0 });
    }
    for (const order of placedOrders) {
      const bucket = daily.get(analyticsDay(order.createdAt));
      if (bucket && order.status !== "cancelled") bucket.orders += 1;
    }
    for (const order of revenueOrders) {
      if (!order.paidAt) continue;
      const bucket = daily.get(analyticsDay(order.paidAt));
      if (bucket) bucket.revenue += order.total;
    }

    const top = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
    for (const item of items) {
      const entry = top.get(item.productId) ?? { productId: item.productId, name: item.productName, quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.quantity * item.productPrice;
      top.set(item.productId, entry);
    }

    const byStatus = Object.fromEntries(["processing", "confirmed", "shipping", "completed", "cancelled"].map((status) => [
      status, placedOrders.filter((order) => order.status === status).length
    ]));
    const byPayment = Object.fromEntries(["pending", "paid", "cod_pending", "failed", "refunded"].map((status) => [
      status, placedOrders.filter((order) => order.paymentStatus === status).length
    ]));

    return NextResponse.json({
      period: { days, from: analyticsDay(since), to: analyticsDay(endDay) },
      summary: {
        customers,
        products: products.length,
        activeProducts: products.filter((product) => product.active).length,
        totalStock: products.reduce((sum, product) => sum + product.stock, 0),
        orders: placedOrders.length,
        paidOrders: revenueOrders.length,
        paidRevenue,
        grossOrderValue,
        averageOrderValue
      },
      byStatus,
      byPayment,
      daily: [...daily.values()],
      topProducts: [...top.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 10)
    });
  } catch (error) {
    console.error("Admin analytics query failed", error);
    return NextResponse.json({ error: "Không thể tải dữ liệu báo cáo." }, { status: 500 });
  }
}
