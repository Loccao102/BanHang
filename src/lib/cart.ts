import { Product } from "./products";

export type CartLine = {
  product: Product;
  quantity: number;
  size?: string;
};

export const CART_KEY = "elane-cart-v1";
export const WISHLIST_KEY = "elane-wishlist-v1";
export const CHAT_KEY = "elane-chat-v1";
