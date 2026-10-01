import type { Product } from "./products";

export type CartLine = {
  product: Product;
  quantity: number;
  size?: string;
};

export type OrderStatus = "processing" | "confirmed" | "shipping" | "completed" | "cancelled";

export type OrderRecord = {
  id: string;
  createdAt: string;
  items: CartLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment: "qr" | "cod";
  status: OrderStatus;
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
};

export const CART_KEY = "elane-cart-v2";
export const WISHLIST_KEY = "elane-wishlist-v1";
export const ORDER_KEY = "elane-orders-v1";
export const COUPON_KEY = "elane-coupon-v1";
export const CATALOG_KEY = "elane-catalog-v1";
export const SETTINGS_KEY = "elane-settings-v1";
export const CHAT_KEY = "elane-chat-v1";
