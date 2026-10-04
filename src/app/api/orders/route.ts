import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import type { CartLine } from "@/lib/cart";
import { getCurrentUser } from "@/lib/server/auth";
import { couponDiscount, couponIsUsable } from "@/lib/server/coupon";
import { getDb } from "@/lib/server/db";
import { fromProductRow } from "@/lib/server/product-db";
import { serializeOrder } from "@/lib/server/order-serializer";
import { recordBehaviorEvent, rebuildUserStyleProfile } from "@/lib/server/style-learning";

export const runtime = "nodejs";

type OrderRequest = {
  items?: CartLine[];
  couponCode?: string;
  payment?: "qr" | "cod";
  note?: string;
  customer?: { name?: string; phone?: string; address?: string; city?: string };
};

function orderId() {
  return `LS${new Date().toISOString().slice(2, 10).replace(/-/g, "")}${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function POST(request: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Cơ sở dữ liệu chưa sẵn sàng." }, { status: 503 });

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để thanh toán đơn hàng." }, { status: 401 });
  }

  const body = await request.json() as OrderRequest;
  const items = (body.items ?? []).filter((line) => line.product?.id && line.size && line.quantity > 0);

  if (!items.length) return NextResponse.json({ error: "Giỏ hàng đang trống." }, { status: 400 });

  const customer = {
    name: String(body.customer?.name ?? "").trim(),
    phone: String(body.customer?.phone ?? "").trim(),
    address: String(body.customer?.address ?? "").trim(),
    city: String(body.customer?.city ?? "").trim()
  };
  if (!customer.name || !customer.phone || !customer.address || !customer.city) {
    return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin nhận hàng." }, { status: 400 });
  }

  try {
    const created = await db.$transaction(async (tx) => {
      const productIds = Array.from(new Set(items.map((line) => line.product.id)));
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, active: true },
        include: { variants: true }
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      let subtotal = 0;
      const prepared = [];

      for (const line of items) {
        const product = productMap.get(line.product.id);
        if (!product) throw new Error("PRODUCT_UNAVAILABLE");
        const variant = product.variants.find((item) => item.size === line.size && item.active);
        if (!variant || variant.stock < line.quantity) throw new Error(`OUT_OF_STOCK:${product.name}:${line.size}`);
        subtotal += product.price * line.quantity;
        prepared.push({ line, product, variant });
      }

      let coupon = null;
      let discount = 0;
      const couponCode = String(body.couponCode ?? "").trim().toUpperCase() || null;

      if (couponCode) {
        coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (!coupon || !couponIsUsable(coupon, subtotal)) throw new Error("COUPON_INVALID");
        discount = couponDiscount(coupon, subtotal);
      }

      const isTestOrder = subtotal <= 10000 || Boolean(couponCode?.startsWith("TEST"));
      const shipping = (subtotal >= 699000 || isTestOrder) ? 0 : 30000;
      const total = Math.max(0, subtotal + shipping - discount);
      const id = orderId();

      for (const item of prepared) {
        const changed = await tx.productVariant.updateMany({
          where: { id: item.variant.id, stock: { gte: item.line.quantity } },
          data: { stock: { decrement: item.line.quantity } }
        });
        if (changed.count !== 1) throw new Error(`OUT_OF_STOCK:${item.product.name}:${item.line.size}`);
        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.line.quantity } }
        });
      }

      const order = await tx.order.create({
        data: {
          id,
          userId: currentUser?.id ?? null,
          couponCode: coupon?.code ?? null,
          subtotal,
          shipping,
          discount,
          total,
          payment: body.payment === "cod" ? "cod" : "qr",
          paymentStatus: body.payment === "cod" ? "cod_pending" : "pending",
          status: "processing",
          customerName: customer.name,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          note: String(body.note ?? "").trim() || null,
          items: {
            create: prepared.map(({ line, product, variant }) => ({
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              productImage: product.image,
              productColor: product.color,
              productPrice: product.price,
              size: line.size,
              quantity: line.quantity
            }))
          }
        },
        include: { items: true }
      });

      if (coupon) {
        await tx.coupon.update({ where: { code: coupon.code }, data: { usedCount: { increment: 1 } } });
      }
      if (currentUser) {
        await tx.cartItem.deleteMany({ where: { userId: currentUser.id } });
      }

      const hydratedProducts = new Map(products.map((product) => [product.id, fromProductRow(product)]));
      return serializeOrder(order, hydratedProducts);
    }, { isolationLevel: "Serializable" });

    if (currentUser) {
      for (const line of items) {
        await recordBehaviorEvent({
          db,
          userId: currentUser.id,
          productId: line.product.id,
          type: "order_created",
          source: "checkout",
          metadata: { orderId: created.id, quantity: line.quantity, size: line.size }
        });
      }
      await rebuildUserStyleProfile(db, currentUser.id);
    }

    return NextResponse.json({ saved: true, order: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("OUT_OF_STOCK:")) {
      const [, product, size] = message.split(":");
      return NextResponse.json({ error: `${product} size ${size} vừa hết hàng. Vui lòng cập nhật giỏ hàng.` }, { status: 409 });
    }
    if (message === "COUPON_INVALID") return NextResponse.json({ error: "Mã ưu đãi không còn hợp lệ." }, { status: 400 });
    if (message === "PRODUCT_UNAVAILABLE") return NextResponse.json({ error: "Có sản phẩm không còn được bán." }, { status: 409 });
    console.error(error);
    return NextResponse.json({ error: "Không thể tạo đơn hàng. Vui lòng thử lại." }, { status: 500 });
  }
}
