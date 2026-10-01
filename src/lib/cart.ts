import type { Product } from "./products";

export type CartLine = {
  product: Product;
  quantity: number;
  size?: string;
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
  status: "processing" | "confirmed" | "shipping" | "completed";
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
export const CHAT_KEY = "elane-chat-v1";
