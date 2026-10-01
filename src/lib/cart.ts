import type { Product } from "./products";

export type CartLine = {
  product: Product;
  quantity: number;
  size?: string;
};

export type OrderStatus = "processing" | "confirmed" | "shipping" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "cod_pending" | "failed" | "refunded";
export type CouponState = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount?: number;
};

export type OrderRecord = {
  id: string;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment: "qr" | "cod";
  paymentStatus?: PaymentStatus;
  status: OrderStatus;
  couponCode?: string;
  shippingCarrier?: string;
  trackingCode?: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
};

export function calculateCouponDiscount(coupon: CouponState | null, subtotal: number) {
  if (!coupon || subtotal < coupon.minOrder) return 0;
  const raw = coupon.type === "percentage"
    ? Math.round(subtotal * (coupon.value / 100))
    : coupon.value;
  return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
}

export const CART_KEY = "lsoul-cart-v1";
export const WISHLIST_KEY = "lsoul-wishlist-v1";
export const ORDER_KEY = "lsoul-orders-v1";
export const COUPON_KEY = "lsoul-coupon-v1";
export const CATALOG_KEY = "lsoul-catalog-v1";
export const SETTINGS_KEY = "lsoul-settings-v1";
export const CHAT_KEY = "lsoul-chat-v1";
