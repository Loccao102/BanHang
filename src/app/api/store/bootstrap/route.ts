import { NextResponse } from "next/server";
import type { OrderRecord } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ mode: "browser" });

  const rows = await db.product.findMany({ orderBy: { sku: "asc" } });
  const products = rows.map(fromProductRow);
  const productMap = new Map(products.map((product) => [product.id, product]));

  const orderRows = await db.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" }
  });

  const orders: OrderRecord[] = orderRows.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    payment: order.payment as OrderRecord["payment"],
    status: order.status as OrderRecord["status"],
    customer: {
      name: order.customerName,
      phone: order.phone,
      address: order.address,
      city: order.city
    },
    items: order.items.map((item) => {
      const current = productMap.get(item.productId);
      const product: Product = current ?? {
        id: item.productId,
        sku: item.productId,
        name: item.productName,
        subtitle: "Sản phẩm đã mua",
        category: "tops",
        type: "tshirt",
        gender: "unisex",
        price: item.productPrice,
        color: item.productColor,
        colorFamily: "black",
        sizes: item.size ? [item.size] : ["M"],
        stock: 0,
        image: item.productImage,
        images: [item.productImage],
        style: ["minimal"],
        occasion: ["casual"],
        material: "—",
        fit: "—",
        active: false
      };
      return { product, quantity: item.quantity, size: item.size ?? undefined };
    })
  }));

  const promo = await db.storeSetting.findUnique({ where: { key: "promoText" } });

  return NextResponse.json({
    mode: "database",
    products,
    orders,
    settings: {
      promoText: promo?.value ?? "FALL / WINTER 2026 · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY"
    }
  });
}
