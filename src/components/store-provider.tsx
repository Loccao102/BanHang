"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CustomerAddress, CustomerUser } from "@/lib/account";
import {
  CART_KEY, CATALOG_KEY, COUPON_KEY, CartLine, CouponState, ORDER_KEY, OrderRecord,
  OrderStatus, PaymentStatus, SETTINGS_KEY, WISHLIST_KEY
} from "@/lib/cart";
import { products as seedProducts, type Product } from "@/lib/products";

export type StoreSettings = { promoText: string };
type Notice = { id: number; message: string; detail?: string } | null;
export type PersistenceMode = "browser" | "database";

type StoreContextValue = {
  cart: CartLine[];
  wishlist: string[];
  orders: OrderRecord[];
  catalog: Product[];
  settings: StoreSettings;
  persistenceMode: PersistenceMode;
  user: CustomerUser | null;
  addresses: CustomerAddress[];
  accountLoading: boolean;
  cartCount: number;
  coupon: CouponState | null;
  cartDrawerOpen: boolean;
  notice: Notice;
  addToCart: (product: Product, size?: string, quantity?: number) => void;
  addBundleToCart: (items: Array<{ product: Product; size?: string; quantity?: number }>) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, size: string | undefined, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  applyCoupon: (code: string) => Promise<boolean>;
  clearCoupon: () => void;
  placeOrder: (order: OrderRecord) => Promise<OrderRecord>;
  updateOrderStatus: (id: string, status: OrderStatus, extra?: { paymentStatus?: PaymentStatus; shippingCarrier?: string; trackingCode?: string }) => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, delta: number) => void;
  toggleProductActive: (id: string) => void;
  resetCatalog: () => void;
  updateSettings: (next: StoreSettings) => void;
  refreshAccount: (mergeGuest?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  dismissNotice: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const defaultSettings: StoreSettings = { promoText: "HÀNG MỚI · MIỄN PHÍ GIAO HÀNG TỪ 699K · ĐỔI CỠ TRONG 7 NGÀY" };

function analyticsGuestKey() {
  if (typeof window === "undefined") return "";
  const key = "lsoul_analytics_guest";
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    window.localStorage.setItem(key, value);
  }
  return value;
}

function trackBehavior(type: string, productId?: string, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  void fetch("/api/analytics/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      productId,
      guestKey: analyticsGuestKey(),
      source: "storefront",
      metadata: metadata ?? {}
    })
  }).catch(() => undefined);
}

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function sizeStock(product: Product, size?: string) {
  if (!size) return product.stock;
  const variant = product.variants?.find((item) => item.size === size);
  return variant ? variant.stock : product.stock;
}

function mergeCart(primary: CartLine[], secondary: CartLine[]) {
  const map = new Map<string, CartLine>();
  for (const line of [...primary, ...secondary]) {
    const key = `${line.product.id}::${line.size ?? ""}`;
    const existing = map.get(key);
    const limit = sizeStock(line.product, line.size);
    map.set(key, existing
      ? { ...existing, quantity: Math.min(existing.quantity + line.quantity, limit) }
      : { ...line, quantity: Math.min(line.quantity, limit) });
  }
  return Array.from(map.values()).filter((line) => line.quantity > 0);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(seedProducts);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [persistenceMode, setPersistenceMode] = useState<PersistenceMode>("browser");
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountReady, setAccountReady] = useState(false);
  const [coupon, setCoupon] = useState<CouponState | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [hydrated, setHydrated] = useState(false);

  const showNotice = useCallback((message: string, detail?: string) => {
    const id = Date.now();
    setNotice({ id, message, detail });
    window.setTimeout(() => setNotice((current) => current?.id === id ? null : current), 2600);
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      const response = await fetch("/api/store/bootstrap", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { mode: PersistenceMode; products?: Product[]; settings?: StoreSettings };
      if (data.mode === "database") {
        if (data.products) setCatalog(data.products);
        if (data.settings) setSettings(data.settings);
        setPersistenceMode("database");
      }
    } catch {
      // Keep the current catalog if the server is temporarily unavailable.
    }
  }, []);

  const refreshAccount = useCallback(async (mergeGuest = false) => {
    setAccountLoading(true);
    try {
      const response = await fetch("/api/account/state", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        setAddresses([]);
        setAccountReady(true);
        return;
      }

      const data = await response.json() as {
        authenticated: boolean;
        user: CustomerUser;
        wishlist: string[];
        cart: CartLine[];
        orders: OrderRecord[];
        addresses: CustomerAddress[];
      };

      const guestCart = mergeGuest ? cart : [];
      const guestWishlist = mergeGuest ? wishlist : [];
      const nextCart = mergeGuest ? mergeCart(data.cart, guestCart) : data.cart;
      const nextWishlist = mergeGuest ? Array.from(new Set([...data.wishlist, ...guestWishlist])) : data.wishlist;

      setUser(data.user);
      setAddresses(data.addresses);
      setCart(nextCart);
      setWishlist(nextWishlist);

      if (data.user.role === "admin") {
        const adminResponse = await fetch("/api/admin/orders", { cache: "no-store" });
        const adminData = adminResponse.ok ? await adminResponse.json() as { orders: OrderRecord[] } : { orders: [] };
        setOrders(adminData.orders);
      } else {
        setOrders(data.orders);
      }

      if (mergeGuest) {
        await Promise.all([
          fetch("/api/account/cart", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: nextCart })
          }),
          fetch("/api/account/wishlist", {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds: nextWishlist })
          })
        ]);
      }
      setAccountReady(true);
    } catch {
      setAccountReady(true);
    } finally {
      setAccountLoading(false);
    }
  }, [cart, wishlist]);

  useEffect(() => {
    setCart(readLocal<CartLine[]>(CART_KEY, []));
    setWishlist(readLocal<string[]>(WISHLIST_KEY, []));
    setOrders(readLocal<OrderRecord[]>(ORDER_KEY, []));
    setCatalog(readLocal<Product[]>(CATALOG_KEY, seedProducts));
    setSettings(readLocal<StoreSettings>(SETTINGS_KEY, defaultSettings));
    setCoupon(readLocal<CouponState | null>(COUPON_KEY, null));
    setHydrated(true);
    void refreshCatalog();
    void refreshAccount(false);
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

  useEffect(() => {
    if (!user || !accountReady) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/account/cart", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart })
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [user, accountReady, cart]);

  useEffect(() => {
    if (!user || !accountReady) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/account/wishlist", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds: wishlist })
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [user, accountReady, wishlist]);

  const persistProduct = useCallback((product: Product) => {
    if (persistenceMode !== "database" || user?.role !== "admin") return;
    void fetch("/api/products", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(product)
    }).then((response) => {
      if (!response.ok) throw new Error("save");
    }).then(refreshCatalog).catch(() => showNotice("Không thể lưu thay đổi", "Kiểm tra quyền truy cập và kết nối cơ sở dữ liệu."));
  }, [persistenceMode, user, showNotice, refreshCatalog]);

  const addToCart = useCallback((product: Product, size?: string, quantity = 1) => {
    const limit = sizeStock(product, size);
    if (product.active === false || limit <= 0) return;
    setCart((current) => {
      const index = current.findIndex((line) => line.product.id === product.id && line.size === size);
      if (index === -1) return [...current, { product, size, quantity: Math.min(quantity, limit) }];
      return current.map((line, i) => i === index ? { ...line, quantity: Math.min(line.quantity + quantity, limit) } : line);
    });
    showNotice("Đã thêm vào giỏ", `${product.name}${size ? ` · Cỡ ${size}` : ""}`);
    trackBehavior("cart_add", product.id, { size, quantity });
    setCartDrawerOpen(true);
  }, [showNotice]);

  const addBundleToCart = useCallback((items: Array<{ product: Product; size?: string; quantity?: number }>) => {
    const valid = items.filter(({ product, size }) => product.active !== false && sizeStock(product, size) > 0);
    if (!valid.length) return;
    setCart((current) => mergeCart(current, valid.map(({ product, size, quantity = 1 }) => ({ product, size, quantity }))));
    showNotice("Đã thêm bộ đồ vào giỏ", `${valid.length} sản phẩm từ trợ lý LSOUL`);
    valid.forEach(({ product, size, quantity = 1 }) => trackBehavior("cart_add", product.id, { size, quantity, bundle: true }));
    setCartDrawerOpen(true);
  }, [showNotice]);

  const removeFromCart = useCallback((productId: string, size?: string) => {
    setCart((current) => current.filter((line) => !(line.product.id === productId && line.size === size)));
    trackBehavior("cart_remove", productId, { size });
  }, []);

  const updateQuantity = useCallback((productId: string, size: string | undefined, quantity: number) => {
    setCart((current) => current
      .map((line) => line.product.id === productId && line.size === size
        ? { ...line, quantity: Math.min(Math.max(quantity, 0), sizeStock(line.product, size)) }
        : line)
      .filter((line) => line.quantity > 0));
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((current) => {
      const liked = current.includes(productId);
      const next = liked ? current.filter((id) => id !== productId) : [...current, productId];
      const product = catalog.find((item) => item.id === productId);
      showNotice(liked ? "Đã bỏ khỏi yêu thích" : "Đã lưu vào yêu thích", product?.name);
      trackBehavior(liked ? "wishlist_remove" : "wishlist_add", productId);
      return next;
    });
  }, [catalog, showNotice]);

  const applyCoupon = useCallback(async (rawCode: string) => {
    const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
    const response = await fetch("/api/coupons/validate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: rawCode, subtotal })
    });
    if (!response.ok) return false;
    const data = await response.json() as { coupon: CouponState };
    setCoupon(data.coupon);
    showNotice("Đã áp dụng ưu đãi", data.coupon.code);
    return true;
  }, [cart, showNotice]);

  const placeOrder = useCallback(async (draft: OrderRecord) => {
    if (persistenceMode !== "database") throw new Error("Cơ sở dữ liệu chưa sẵn sàng.");

    const response = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, couponCode: coupon?.code })
    });
    const data = await response.json() as { order?: OrderRecord; error?: string };
    if (!response.ok || !data.order) throw new Error(data.error ?? "Không thể tạo đơn hàng.");

    setOrders((current) => [data.order!, ...current.filter((order) => order.id !== data.order!.id)]);
    setCart([]);
    setCoupon(null);
    setCartDrawerOpen(false);
    await refreshCatalog();
    return data.order;
  }, [persistenceMode, coupon, refreshCatalog]);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus, extra?: { paymentStatus?: PaymentStatus; shippingCarrier?: string; trackingCode?: string }) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status, ...extra } : order));
    if (persistenceMode === "database" && user?.role === "admin") {
      void fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra })
      }).catch(() => undefined);
    }
  }, [persistenceMode, user]);

  const saveProduct = useCallback((product: Product) => {
    setCatalog((current) => current.some((item) => item.id === product.id)
      ? current.map((item) => item.id === product.id ? product : item)
      : [product, ...current]);
    persistProduct(product);
  }, [persistProduct]);

  const deleteProduct = useCallback((id: string) => {
    if (user?.role !== "admin") return;
    setCatalog((current) => current.filter((item) => item.id !== id));
    setWishlist((current) => current.filter((item) => item !== id));
    setCart((current) => current.filter((line) => line.product.id !== id));
    if (persistenceMode === "database") {
      void fetch(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }).then(refreshCatalog).catch(() => undefined);
    }
  }, [persistenceMode, user, refreshCatalog]);

  const adjustStock = useCallback((id: string, delta: number) => {
    if (user?.role !== "admin") return;
    const product = catalog.find((item) => item.id === id);
    if (!product) return;
    const sizes = product.sizes.length || 1;
    const variants = (product.variants ?? product.sizes.map((size) => ({ sku: `${product.sku}-${size}`, size, stock: 0, active: true }))).map((variant, index) =>
      index === 0 ? { ...variant, stock: Math.max(0, variant.stock + delta), active: Math.max(0, variant.stock + delta) > 0 } : variant
    );
    const next = { ...product, variants, stock: variants.reduce((sum, variant) => sum + variant.stock, 0) || Math.max(0, product.stock + delta * sizes) };
    setCatalog((current) => current.map((item) => item.id === id ? next : item));
    persistProduct(next);
  }, [catalog, persistProduct, user]);

  const toggleProductActive = useCallback((id: string) => {
    if (user?.role !== "admin") return;
    const product = catalog.find((item) => item.id === id);
    if (!product) return;
    const next = { ...product, active: product.active === false };
    setCatalog((current) => current.map((item) => item.id === id ? next : item));
    persistProduct(next);
  }, [catalog, persistProduct, user]);

  const resetCatalog = useCallback(() => {
    if (user?.role !== "admin") return;
    setCatalog(seedProducts);
    if (persistenceMode === "database") {
      void fetch("/api/products/reset", { method: "POST" }).then(refreshCatalog).catch(() => undefined);
    }
  }, [persistenceMode, user, refreshCatalog]);

  const updateSettings = useCallback((next: StoreSettings) => {
    if (user?.role !== "admin") return;
    setSettings(next);
    if (persistenceMode === "database") {
      void fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next)
      }).catch(() => undefined);
    }
  }, [persistenceMode, user]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setAddresses([]);
    setOrders([]);
    setCart([]);
    setWishlist([]);
    setCoupon(null);
    setAccountReady(true);
    window.localStorage.removeItem(CART_KEY);
    window.localStorage.removeItem(WISHLIST_KEY);
    window.localStorage.removeItem(ORDER_KEY);
  }, []);

  const value = useMemo(() => ({
    cart, wishlist, orders, catalog, settings, persistenceMode, user, addresses, accountLoading,
    cartCount: cart.reduce((sum, line) => sum + line.quantity, 0),
    coupon, cartDrawerOpen, notice, addToCart, addBundleToCart, removeFromCart, updateQuantity,
    clearCart: () => setCart([]), toggleWishlist, applyCoupon, clearCoupon: () => setCoupon(null),
    placeOrder, updateOrderStatus, saveProduct, deleteProduct, adjustStock, toggleProductActive,
    resetCatalog, updateSettings, refreshAccount, logout,
    openCartDrawer: () => setCartDrawerOpen(true), closeCartDrawer: () => setCartDrawerOpen(false),
    dismissNotice: () => setNotice(null)
  }), [cart, wishlist, orders, catalog, settings, persistenceMode, user, addresses, accountLoading, coupon, cartDrawerOpen, notice, addToCart, addBundleToCart, removeFromCart, updateQuantity, toggleWishlist, applyCoupon, placeOrder, updateOrderStatus, saveProduct, deleteProduct, adjustStock, toggleProductActive, resetCatalog, updateSettings, refreshAccount, logout]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
