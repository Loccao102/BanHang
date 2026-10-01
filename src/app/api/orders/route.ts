import { NextResponse } from "next/server";
import type { OrderRecord } from "@/lib/cart";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ saved: false, mode: "browser" });

  const order = await request.json() as OrderRecord;

  await db.order.create({
    data: {
      id: order.id,
      createdAt: new Date(order.createdAt),
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      payment: order.payment,
      status: order.status,
      customerName: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address,
      city: order.customer.city,
      items: {
        create: order.items.map((line) => ({
          productId: line.product.id,
          productName: line.product.name,
          productImage: line.product.image,
          productColor: line.product.color,
          productPrice: line.product.price,
          size: line.size ?? null,
          quantity: line.quantity
        }))
      }
    }
  });

  return NextResponse.json({ saved: true });
}
