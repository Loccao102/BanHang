"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CART_KEY, CartLine, WISHLIST_KEY } from "@/lib/cart";
import type { Product } from "@/lib/products";

type StoreContextValue = {
  cart: CartLine[];
  wishlist: string[];
  cartCount: number;
  addToCart: (product: Product, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, size: string | undefined, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readLocal<CartLine[]>(CART_KEY, []));
    setWishlist(readLocal<string[]>(WISHLIST_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, hydrated]);

  const addToCart = useCallback((product: Product, size?: string, quantity = 1) => {
    setCart((current) => {
      const index = current.findIndex((line) => line.product.id === product.id && line.size === size);
      if (index === -1) return [...current, { product, size, quantity }];
      return current.map((line, i) => i === index ? { ...line, quantity: line.quantity + quantity } : line);
    });
  }, []);

  const removeFromCart = useCallback((productId: string, size?: string) => {
    setCart((current) => current.filter((line) => !(line.product.id === productId && line.size === size)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string | undefined, quantity: number) => {
    setCart((current) => current
      .map((line) => line.product.id === productId && line.size === size ? { ...line, quantity } : line)
      .filter((line) => line.quantity > 0));
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((current) => current.includes(productId)
      ? current.filter((id) => id !== productId)
      : [...current, productId]);
  }, []);

  const value = useMemo(() => ({
    cart,
    wishlist,
    cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart: () => setCart([]),
    toggleWishlist
  }), [cart, wishlist, addToCart, removeFromCart, updateQuantity, toggleWishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
