"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { CustomerAddress, CustomerUser } from "@/lib/account";
import { CART_KEY, CATALOG_KEY, COUPON_KEY, CartLine, ORDER_KEY, OrderRecord, OrderStatus, SETTINGS_KEY, WISHLIST_KEY } from "@/lib/cart";
import { products as seedProducts, type Product } from "@/lib/products";

type CouponState = { code: string; rate: number };
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
  refreshAccount: (mergeGuest?: boolean) => Promise<void>;
  logout: () => Promise<void>;
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

function mergeCart(primary: CartLine[], secondary: CartLine[]) {
  const map = new Map<string, CartLine>();
  for (const line of [...primary, ...secondary]) {
    const key = `${line.product.id}::${line.size ?? ""}`;
    const existing = map.get(key);
    map.set(key, existing
      ? { ...existing, quantity: Math.min(existing.quantity + line.quantity, line.product.stock) }
      : line);
  }
  return Array.from(map.values());
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

      if (!data.authenticated) {
        setUser(null);
        setAddresses([]);
        setAccountReady(true);
        return;
      }

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
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: nextCart })
          }),
          fetch("/api/account/wishlist", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
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

    let cancelled = false;
    void fetch("/api/store/bootstrap", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = await response.json() as {
          mode: PersistenceMode;
          products?: Product[];
          settings?: StoreSettings;
        };
        if (cancelled || data.mode !== "database") return;
        if (data.products) setCatalog(data.products);
        if (data.settings) setSettings(data.settings);
        setPersistenceMode("database");
      })
      .catch(() => undefined);

    void refreshAccount(false);

    return () => {
      cancelled = true;
    };
  }, [refreshAccount]);

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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart })
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [user, accountReady, cart]);

  useEffect(() => {
    if (!user || !accountReady) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/account/wishlist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: wishlist })
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [user, accountReady, wishlist]);

  const persistProduct = useCallback((product: Product) => {
    if (persistenceMode !== "database" || user?.role !== "admin") return;
    void fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product)
    }).then((response) => {
      if (!response.ok) throw new Error("save");
    }).catch(() => showNotice("Không thể lưu thay đổi", "Kiểm tra quyền truy cập và kết nối cơ sở dữ liệu."));
  }, [persistenceMode, user, showNotice]);

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

    if (persistenceMode === "database") {
      void fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order)
      }).then((response) => {
        if (!response.ok) throw new Error("save");
      }).catch(() => showNotice("Đơn hàng chưa được đồng bộ", "Vui lòng kiểm tra lại kết nối."));
    }
  }, [persistenceMode, showNotice]);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    if (persistenceMode === "database" && user?.role === "admin") {
      void fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
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
      void fetch(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => undefined);
    }
  }, [persistenceMode, user]);

  const adjustStock = useCallback((id: string, delta: number) => {
    if (user?.role !== "admin") return;
    const product = catalog.find((item) => item.id === id);
    if (!product) return;
    const next = { ...product, stock: Math.max(0, product.stock + delta) };
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
      void fetch("/api/products/reset", { method: "POST" }).catch(() => undefined);
    }
  }, [persistenceMode, user]);

  const updateSettings = useCallback((next: StoreSettings) => {
    if (user?.role !== "admin") return;
    setSettings(next);
    if (persistenceMode === "database") {
      void fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
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
    coupon, cartDrawerOpen, notice, addToCart, removeFromCart, updateQuantity,
    clearCart: () => setCart([]), toggleWishlist, applyCoupon, clearCoupon: () => setCoupon(null),
    placeOrder, updateOrderStatus, saveProduct, deleteProduct, adjustStock, toggleProductActive,
    resetCatalog, updateSettings, refreshAccount, logout,
    openCartDrawer: () => setCartDrawerOpen(true), closeCartDrawer: () => setCartDrawerOpen(false),
    dismissNotice: () => setNotice(null)
  }), [cart, wishlist, orders, catalog, settings, persistenceMode, user, addresses, accountLoading, coupon, cartDrawerOpen, notice, addToCart, removeFromCart, updateQuantity, toggleWishlist, applyCoupon, placeOrder, updateOrderStatus, saveProduct, deleteProduct, adjustStock, toggleProductActive, resetCatalog, updateSettings, refreshAccount, logout]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
