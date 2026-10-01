import { NextResponse } from "next/server";
import type { OrderRecord } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { requireAdmin } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireAdmin();
    const db = getDb()!;
    const rows = await db.order.findMany({ include: { items: true }, orderBy: { createdAt: "desc" } });
    const productIds = Array.from(new Set(rows.flatMap((order) => order.items.map((item) => item.productId))));
    const productRows = productIds.length ? await db.product.findMany({ where: { id: { in: productIds } } }) : [];
    const productMap = new Map(productRows.map((row) => [row.id, fromProductRow(row)]));

    const orders: OrderRecord[] = rows.map((order) => ({
      id: order.id, createdAt: order.createdAt.toISOString(), subtotal: order.subtotal, shipping: order.shipping,
      discount: order.discount, total: order.total, payment: order.payment as OrderRecord["payment"], status: order.status as OrderRecord["status"],
      customer: { name: order.customerName, phone: order.phone, address: order.address, city: order.city },
      items: order.items.map((item) => {
        const current = productMap.get(item.productId);
        const product: Product = current ?? {
          id:item.productId, sku:item.productId, name:item.productName, subtitle:"Sản phẩm đã mua", category:"tops", type:"tshirt",
          gender:"unisex", price:item.productPrice, color:item.productColor, colorFamily:"black", sizes:item.size?[item.size]:["M"],
          stock:0, image:item.productImage, images:[item.productImage], style:["minimal"], occasion:["casual"], material:"—", fit:"—", active:false
        };
        return { product, quantity:item.quantity, size:item.size ?? undefined };
      })
    }));

    return NextResponse.json({ orders });
  } catch {
    return NextResponse.json({ error: "Không có quyền truy cập." }, { status: 403 });
  }
}
