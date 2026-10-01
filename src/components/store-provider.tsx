"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CART_KEY, CATALOG_KEY, COUPON_KEY, CartLine, ORDER_KEY, OrderRecord, OrderStatus, SETTINGS_KEY, WISHLIST_KEY } from "@/lib/cart";
import { products as seedProducts, type Product } from "@/lib/products";

type CouponState = { code: string; rate: number };
export type StoreSettings = { promoText: string };
type Notice = { id: number; message: string; detail?: string } | null;

type StoreContextValue = {
  cart: CartLine[];
  wishlist: string[];
  orders: OrderRecord[];
  catalog: Product[];
  settings: StoreSettings;
  cartCount: number;
  coupon: CouponState | null;
  cartDrawerOpen: boolean;
  notice: Notice;
  addToCart: (product: Product, size?: string, quantity?: number) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, size: string | undefined, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyCoupon: (code: string) => boolean;
  clearCoupon: () => void;
  placeOrder: (order: OrderRecord) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  toggleProductActive: (id: string) => void;
  resetCatalog: () => void;
  updateSettings: (next: StoreSettings) => void;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  dismissNotice: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const defaultSettings: StoreSettings = { promoText: "FALL / WINTER 2026 · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY" };

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
  const [catalog, setCatalog] = useState<Product[]>(seedProducts);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [coupon, setCoupon] = useState<CouponState | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readLocal<CartLine[]>(CART_KEY, []));
    setWishlist(readLocal<string[]>(WISHLIST_KEY, []));
    setOrders(readLocal<OrderRecord[]>(ORDER_KEY, []));
    setCatalog(readLocal<Product[]>(CATALOG_KEY, seedProducts));
    setSettings(readLocal<StoreSettings>(SETTINGS_KEY, defaultSettings));
    setCoupon(readLocal<CouponState | null>(COUPON_KEY, null));
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }, [wishlist, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(ORDER_KEY, JSON.stringify(orders)); }, [orders, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog)); }, [catalog, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    if (coupon) window.localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    else window.localStorage.removeItem(COUPON_KEY);
  }, [coupon, hydrated]);

  const showNotice = useCallback((message: string, detail?: string) => {
    const id = Date.now();
    setNotice({ id, message, detail });
    window.setTimeout(() => setNotice((current) => current?.id === id ? null : current), 2600);
  }, []);

  const addToCart = useCallback((product: Product, size?: string, quantity = 1) => {
    if (product.active === false || product.stock <= 0) return;
    setCart((current) => {
      const index = current.findIndex((line) => line.product.id === product.id && line.size === size);
      if (index === -1) return [...current, { product, size, quantity: Math.min(quantity, product.stock) }];
      return current.map((line, i) => i === index ? { ...line, quantity: Math.min(line.quantity + quantity, product.stock) } : line);
    });
    showNotice("Đã thêm vào giỏ", `${product.name}${size ? ` · Size ${size}` : ""}`);
    setCartDrawerOpen(true);
  }, [showNotice]);

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
    setWishlist((current) => {
      const liked = current.includes(productId);
      const next = liked ? current.filter((id) => id !== productId) : [...current, productId];
      const product = catalog.find((item) => item.id === productId);
      showNotice(liked ? "Đã bỏ khỏi wishlist" : "Đã lưu vào wishlist", product?.name);
      return next;
    });
  }, [catalog, showNotice]);

  const applyCoupon = useCallback((rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    const rate = code === "ELANE10" ? 0.1 : code === "NEW15" ? 0.15 : 0;
    if (!rate) return false;
    setCoupon({ code, rate });
    showNotice("Đã áp dụng ưu đãi", `${code} · giảm ${Math.round(rate * 100)}%`);
    return true;
  }, [showNotice]);

  const placeOrder = useCallback((order: OrderRecord) => {
    setOrders((current) => [order, ...current]);
    setCart([]);
    setCoupon(null);
    setCartDrawerOpen(false);
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  }, []);

  const saveProduct = useCallback((product: Product) => {
    setCatalog((current) => current.some((item) => item.id === product.id)
      ? current.map((item) => item.id === product.id ? product : item)
      : [product, ...current]);
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setCatalog((current) => current.filter((item) => item.id !== id));
    setWishlist((current) => current.filter((item) => item !== id));
    setCart((current) => current.filter((line) => line.product.id !== id));
  }, []);

  const adjustStock = useCallback((id: string, delta: number) => {
    setCatalog((current) => current.map((item) => item.id === id ? { ...item, stock: Math.max(0, item.stock + delta) } : item));
  }, []);

  const toggleProductActive = useCallback((id: string) => {
    setCatalog((current) => current.map((item) => item.id === id ? { ...item, active: item.active === false } : item));
  }, []);

  const resetCatalog = useCallback(() => setCatalog(seedProducts), []);

  const value = useMemo(() => ({
    cart,
    wishlist,
    orders,
    catalog,
    settings,
    cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    coupon,
    cartDrawerOpen,
    notice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart: () => setCart([]),
    toggleWishlist,
    applyCoupon,
    clearCoupon: () => setCoupon(null),
    placeOrder,
    updateOrderStatus,
    saveProduct,
    deleteProduct,
    adjustStock,
    toggleProductActive,
    resetCatalog,
    updateSettings: setSettings,
    openCartDrawer: () => setCartDrawerOpen(true),
    closeCartDrawer: () => setCartDrawerOpen(false),
    dismissNotice: () => setNotice(null)
  }), [cart, wishlist, orders, catalog, settings, coupon, cartDrawerOpen, notice, addToCart, removeFromCart, updateQuantity, toggleWishlist, applyCoupon, placeOrder, updateOrderStatus, saveProduct, deleteProduct, adjustStock, toggleProductActive, resetCatalog]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
