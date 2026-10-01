import { NextResponse } from "next/server";
import type { OrderRecord } from "@/lib/cart";
import type { Product } from "@/lib/products";
import { getCurrentUser } from "@/lib/server/auth";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const user = await getCurrentUser();
  if (!db || !user) return NextResponse.json({ authenticated: false }, { status: 401 });

  const [wishlistRows, cartRows, orderRows, addresses] = await Promise.all([
    db.wishlistItem.findMany({ where: { userId: user.id } }),
    db.cartItem.findMany({ where: { userId: user.id } }),
    db.order.findMany({ where: { userId: user.id }, include: { items: true }, orderBy: { createdAt: "desc" } }),
    db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] })
  ]);

  const productIds = Array.from(new Set([
    ...cartRows.map((item) => item.productId),
    ...orderRows.flatMap((order) => order.items.map((item) => item.productId))
  ]));
  const productRows = productIds.length ? await db.product.findMany({ where: { id: { in: productIds } } }) : [];
  const productMap = new Map(productRows.map((row) => [row.id, fromProductRow(row)]));

  const cart = cartRows.flatMap((item) => {
    const product = productMap.get(item.productId);
    return product ? [{ product, quantity: item.quantity, size: item.size || undefined }] : [];
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
    customer: { name: order.customerName, phone: order.phone, address: order.address, city: order.city },
    items: order.items.map((item) => {
      const current = productMap.get(item.productId);
      const product: Product = current ?? {
        id: item.productId, sku: item.productId, name: item.productName, subtitle: "Sản phẩm đã mua",
        category: "tops", type: "tshirt", gender: "unisex", price: item.productPrice,
        color: item.productColor, colorFamily: "black", sizes: item.size ? [item.size] : ["M"],
        stock: 0, image: item.productImage, images: [item.productImage], style: ["minimal"],
        occasion: ["casual"], material: "—", fit: "—", active: false
      };
      return { product, quantity: item.quantity, size: item.size ?? undefined };
    })
  }));

  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone ?? undefined, role: user.role },
    wishlist: wishlistRows.map((item) => item.productId),
    cart,
    orders,
    addresses: addresses.map((address) => ({
      id: address.id, label: address.label, recipientName: address.recipientName,
      phone: address.phone, address: address.address, city: address.city, isDefault: address.isDefault
    }))
  });
}
