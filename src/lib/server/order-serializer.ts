import type { OrderRecord } from "@/lib/cart";
import type { Product } from "@/lib/products";

type OrderWithItems = {
  id: string;
  createdAt: Date;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment: string;
  paymentStatus: string;
  status: string;
  couponCode: string | null;
  shippingCarrier: string | null;
  trackingCode: string | null;
  paidAt?: Date | null;
  paymentProvider?: string | null;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage: string;
    productColor: string;
    productPrice: number;
    size: string | null;
    quantity: number;
  }>;
};

export function fallbackOrderProduct(item: OrderWithItems["items"][number]): Product {
  return {
    id: item.productId,
    sku: item.productId,
    name: item.productName,
    subtitle: "Sản phẩm đã mua",
    category: "tops",
    type: "crop-top",
    gender: "women",
    price: item.productPrice,
    color: item.productColor,
    colorFamily: "black",
    sizes: item.size ? [item.size] : ["M"],
    stock: 0,
    image: item.productImage,
    images: [item.productImage],
    style: ["feminine"],
    occasion: ["date"],
    material: "—",
    fit: "—",
    active: false
  };
}

export function serializeOrder(order: OrderWithItems, productMap: Map<string, Product>): OrderRecord {
  return {
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    subtotal: order.subtotal,
    shipping: order.shipping,
    discount: order.discount,
    total: order.total,
    payment: order.payment as OrderRecord["payment"],
    paymentStatus: order.paymentStatus as OrderRecord["paymentStatus"],
    status: order.status as OrderRecord["status"],
    couponCode: order.couponCode ?? undefined,
    shippingCarrier: order.shippingCarrier ?? undefined,
    trackingCode: order.trackingCode ?? undefined,
    paidAt: order.paidAt?.toISOString(),
    paymentProvider: order.paymentProvider ?? undefined,
    customer: {
      name: order.customerName,
      phone: order.phone,
      address: order.address,
      city: order.city
    },
    items: order.items.map((item) => ({
      product: productMap.get(item.productId) ?? fallbackOrderProduct(item),
      quantity: item.quantity,
      size: item.size ?? undefined
    }))
  };
}
