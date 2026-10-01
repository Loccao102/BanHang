"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CART_KEY, COUPON_KEY, CartLine, ORDER_KEY, OrderRecord, WISHLIST_KEY } from "@/lib/cart";
import type { Product } from "@/lib/products";

type CouponState = {
  code: string;
  rate: number;
};

type StoreContextValue = {
  cart: CartLine[];
  wishlist: string[];
  orders: OrderRecord[];
  cartCount: number;
  coupon: CouponState | null;
  addToCart: (product: Product, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, size: string | undefined, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyCoupon: (code: string) => boolean;
  clearCoupon: () => void;
  placeOrder: (order: OrderRecord) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [coupon, setCoupon] = useState<CouponState | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readLocal<CartLine[]>(CART_KEY, []));
    setWishlist(readLocal<string[]>(WISHLIST_KEY, []));
    setOrders(readLocal<OrderRecord[]>(ORDER_KEY, []));
    setCoupon(readLocal<CouponState | null>(COUPON_KEY, null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
  }, [orders, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (coupon) window.localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    else window.localStorage.removeItem(COUPON_KEY);
  }, [coupon, hydrated]);

  const addToCart = useCallback((product: Product, size?: string, quantity = 1) => {
    setCart((current) => {
      const index = current.findIndex((line) => line.product.id === product.id && line.size === size);
      if (index === -1) return [...current, { product, size, quantity }];
      return current.map((line, i) => i === index ? { ...line, quantity: Math.min(line.quantity + quantity, product.stock) } : line);
    });
  }, []);

  const removeFromCart = useCallback((productId: string, size?: string) => {
    setCart((current) => current.filter((line) => !(line.product.id === productId && line.size === size)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string | undefined, quantity: number) => {
    setCart((current) => current
      .map((line) => line.product.id === productId && line.size === size
        ? { ...line, quantity: Math.min(Math.max(quantity, 0), line.product.stock) }
        : line)
      .filter((line) => line.quantity > 0));
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  }, []);

  const applyCoupon = useCallback((rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    const rate = code === "ELANE10" ? 0.1 : code === "NEW15" ? 0.15 : 0;
    if (!rate) return false;
    setCoupon({ code, rate });
    return true;
  }, []);

  const clearCoupon = useCallback(() => setCoupon(null), []);

  const placeOrder = useCallback((order: OrderRecord) => {
    setOrders((current) => [order, ...current]);
    setCart([]);
    setCoupon(null);
  }, []);

  const value = useMemo(() => ({
    cart,
    wishlist,
    orders,
    cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    coupon,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart: () => setCart([]),
    toggleWishlist,
    applyCoupon,
    clearCoupon,
    placeOrder
  }), [cart, wishlist, orders, coupon, addToCart, removeFromCart, updateQuantity, toggleWishlist, applyCoupon, clearCoupon, placeOrder]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
