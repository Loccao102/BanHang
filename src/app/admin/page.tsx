"use client";

import Image from "next/image";
import Link from "next/link";
import { Boxes, ChevronDown, Eye, EyeOff, PackageCheck, Pencil, Plus, RefreshCcw, Save, Settings2, ShoppingBag, Trash2, TrendingUp } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/store-provider";
import type { OrderStatus } from "@/lib/cart";
import { categoryLabels, formatPrice, typeLabels, type ClothingType, type Product, type ProductCategory } from "@/lib/products";

type Tab = "overview" | "products" | "orders" | "settings";

const statusLabel: Record<OrderStatus, string> = {
  processing: "Đang xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy"
};

function blankProduct(): Product {
  return {
    id: "",
    sku: "",
    name: "",
    subtitle: "",
    category: "tops",
    type: "corset",
    gender: "women",
    price: 399000,
    color: "Đen",
    colorFamily: "black",
    sizes: ["S", "M", "L", "XL"],
    stock: 10,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85"],
    style: ["minimal"],
    occasion: ["casual"],
    material: "Cotton",
    fit: "Regular fit",
    active: true,
    featured: false,
    isNew: true,
    tryOnCategory: "tops",
    tryOnPhotoType: "model",
    season: ["spring", "summer"],
    formality: 2,
    warmth: 2,
    stretch: 2,
    coverage: 3,
    colorTemperature: "neutral",
    pairingTags: [],
    avoidPairingTags: [],
    styleKeywords: ["minimal"],
    aiSearchText: "",
    analyzerReady: false
  };
}

export default function AdminPage() {
  const { catalog, orders, settings, persistenceMode, user, accountLoading, saveProduct, deleteProduct, adjustStock, toggleProductActive, updateOrderStatus, resetCatalog, updateSettings } = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState<Product | null>(null);
  const [promo, setPromo] = useState(settings.promoText);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setPromo(settings.promoText);
  }, [settings.promoText]);

  const visibleCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((product) => !q || `${product.name} ${product.sku ?? ""} ${product.color}`.toLowerCase().includes(q));
  }, [catalog, query]);

  const stock = catalog.reduce((sum, item) => sum + item.stock, 0);
  const inventoryValue = catalog.reduce((sum, item) => sum + item.price * item.stock, 0);
  const revenue = orders.filter((order) => order.status !== "cancelled" && (order.paymentStatus === "paid" || (order.payment === "cod" && order.status === "completed"))).reduce((sum, order) => sum + order.total, 0);
  const lowStock = catalog.filter((item) => item.stock <= 8).toSorted((a, b) => a.stock - b.stock);

  if (accountLoading) return <div className="accountLoading"><div className="skeletonLine title" /><div className="skeletonBlock detailSkeleton" /></div>;
  if (!user || user.role !== "admin") return <section className="adminAccessDenied"><div><p className="eyebrow">RESTRICTED AREA</p><h1>Khu vực quản trị</h1><p>Trang này chỉ dành cho tài khoản quản trị LSOUL.</p><Link className="btn" href={user ? "/account" : "/login?next=/admin"}>{user ? "Về tài khoản" : "Đăng nhập quản trị"}</Link></div></section>;

  function openNewProduct() {
    setEditing(blankProduct());
  }

  function submitProduct(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const generatedId = editing.id.trim() || `${editing.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 5)}`;
    saveProduct({
      ...editing,
      id: generatedId,
      sku: editing.sku?.trim() || `LSO-${String(catalog.length + 1).padStart(3, "0")}`,
      images: editing.images.length ? editing.images : [editing.image],
      stock: Math.max(0, Number(editing.stock)),
      price: Math.max(0, Number(editing.price)),
      oldPrice: editing.oldPrice ? Number(editing.oldPrice) : undefined
    });
    setEditing(null);
  }

  return (
    <section className="adminPage adminConsole">
      <div className="adminHero">
        <div><p className="eyebrow">LSOUL COMMERCE CONSOLE</p><h1>Store operations.</h1></div>
        <div className="adminHeroActions"><span className={`dbStatus ${persistenceMode === "database" ? "connected" : ""}`}>{persistenceMode === "database" ? "PostgreSQL · Đã kết nối" : "Bộ nhớ trình duyệt"}</span><Link className="btn ghost small" href="/admin/analytics">Analytics</Link><Link className="btn ghost small" href="/admin/ai">AI Insights</Link><Link className="btn ghost small" href="/admin/customers">Khách hàng</Link><Link className="btn ghost small" href="/admin/marketing">Social & ưu đãi</Link><Link className="btn ghost small" href="/admin/fulfillment">Vận hành đơn</Link><Link className="btn ghost small" href="/">Xem cửa hàng</Link><button className="btn small" onClick={openNewProduct}><Plus size={15} /> Thêm sản phẩm</button></div>
      </div>

      <div className="adminTabs">
        {([["overview","Tổng quan"],["products","Sản phẩm & kho"],["orders","Đơn hàng"],["settings","Cài đặt"]] as const).map(([value,label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{label}</button>)}
      </div>

      {tab === "overview" ? <>
        <div className="statsGrid">
          <div className="statCard"><Boxes size={18} /><small>Sản phẩm</small><strong>{catalog.length}</strong><span>{catalog.filter((item) => item.active !== false).length} đang hiển thị</span></div>
          <div className="statCard"><PackageCheck size={18} /><small>Tồn kho</small><strong>{stock}</strong><span>{lowStock.length} SKU sắp hết</span></div>
          <div className="statCard"><ShoppingBag size={18} /><small>Đơn hàng</small><strong>{orders.length}</strong><span>{orders.filter((order) => order.status === "processing").length} chờ xử lý</span></div>
          <div className="statCard"><TrendingUp size={18} /><small>Doanh thu</small><strong className="moneyStat">{formatPrice(revenue)}</strong><span>Giá trị kho {formatPrice(inventoryValue)}</span></div>
        </div>

        <div className="adminOverviewGrid">
          <div className="adminPanel">
            <div className="adminPanelHead"><div><p className="eyebrow">INVENTORY ALERT</p><h2>Sắp hết hàng</h2></div><button onClick={() => setTab("products")}>Xem kho →</button></div>
            {lowStock.length ? <div className="compactList">{lowStock.slice(0, 6).map((product) => <div key={product.id}><div className="adminThumb"><Image src={product.image} alt={product.name} fill sizes="48px" /></div><span><strong>{product.name}</strong><small>{product.sku ?? product.id}</small></span><b className={product.stock <= 3 ? "dangerText" : ""}>{product.stock}</b></div>)}</div> : <div className="adminEmpty">Kho đang ổn.</div>}
          </div>
          <div className="adminPanel">
            <div className="adminPanelHead"><div><p className="eyebrow">LATEST ORDERS</p><h2>Đơn gần đây</h2></div><button onClick={() => setTab("orders")}>Quản lý →</button></div>
            {orders.length ? <div className="compactOrders">{orders.slice(0, 5).map((order) => <div key={order.id}><span><strong>#{order.id}</strong><small>{order.customer.name} · {order.items.length} sản phẩm</small></span><span><b>{formatPrice(order.total)}</b><small>{statusLabel[order.status]}</small></span></div>)}</div> : <div className="adminEmpty">Chưa có đơn hàng.</div>}
          </div>
        </div>
      </> : null}

      {tab === "products" ? <div className="adminPanel">
        <div className="adminPanelHead adminPanelToolbar">
          <div><p className="eyebrow">PRODUCTS & INVENTORY</p><h2>{catalog.length} sản phẩm</h2></div>
          <div className="adminSearch"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, SKU, màu..." /><button className="btn small" onClick={openNewProduct}><Plus size={15} /> Thêm mới</button></div>
        </div>
        <div className="tableWrap"><table className="adminTable productAdminTable"><thead><tr><th>Sản phẩm</th><th>SKU</th><th>Danh mục</th><th>Loại</th><th>Giá</th><th>Tồn kho</th><th>Hiển thị</th><th></th></tr></thead><tbody>{visibleCatalog.map((product) => <tr key={product.id}>
          <td><div className="adminProductCell"><div className="adminProductImage"><Image src={product.image} alt={product.name} fill sizes="50px" /></div><span><strong>{product.name}</strong><small>{product.color} · {product.fit}</small></span></div></td>
          <td>{product.sku ?? "—"}</td><td>{categoryLabels[product.category]}</td><td>{typeLabels[product.type]}</td><td>{formatPrice(product.price)}</td>
          <td><div className="stockStepper"><button onClick={() => adjustStock(product.id, -1)}>−</button><strong className={product.stock <= 3 ? "dangerText" : ""}>{product.stock}</strong><button onClick={() => adjustStock(product.id, 1)}>+</button></div></td>
          <td><button className={`visibilityButton ${product.active === false ? "off" : ""}`} onClick={() => toggleProductActive(product.id)}>{product.active === false ? <><EyeOff size={14} /> Đang ẩn</> : <><Eye size={14} /> Đang bán</>}</button></td>
          <td><div className="rowActions"><button aria-label="Sửa" onClick={() => setEditing(product)}><Pencil size={15} /></button><button aria-label="Xóa" onClick={() => { if (window.confirm(`Xóa ${product.name}?`)) deleteProduct(product.id); }}><Trash2 size={15} /></button></div></td>
        </tr>)}</tbody></table></div>
      </div> : null}

      {tab === "orders" ? <div className="adminPanel">
        <div className="adminPanelHead"><div><p className="eyebrow">ORDER MANAGEMENT</p><h2>Đơn hàng</h2></div><span className="adminHint">Đơn hàng mới từ website sẽ xuất hiện tại đây.</span></div>
        {orders.length ? <div className="adminOrderList">{orders.map((order) => <article key={order.id}>
          <div><strong><Link href={`/admin/orders/${order.id}`}>#{order.id}</Link></strong><small>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt))}</small></div>
          <div><strong>{order.customer.name}</strong><small>{order.customer.phone} · {order.customer.city}</small></div>
          <div><strong>{order.items.reduce((sum, line) => sum + line.quantity, 0)} sản phẩm</strong><small>{order.payment === "qr" ? "QR chuyển khoản" : "COD"}</small></div>
          <div><strong>{formatPrice(order.total)}</strong><small>{order.customer.address}</small></div>
          <label className="statusSelect"><select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}>{Object.entries(statusLabel).map(([value,label]) => <option value={value} key={value}>{label}</option>)}</select><ChevronDown size={14} /></label>
        </article>)}</div> : <div className="adminEmpty large">Chưa có đơn hàng. Đơn hàng mới sẽ xuất hiện tại đây sau khi khách hoàn tất checkout.</div>}
      </div> : null}

      {tab === "settings" ? <div className="adminSettingsGrid">
        <div className="adminPanel">
          <div className="adminPanelHead"><div><p className="eyebrow">PROMOTION BAR</p><h2>Thông báo đầu trang</h2></div><Settings2 size={19} /></div>
          <label className="adminField"><span>Nội dung</span><textarea rows={4} value={promo} onChange={(event) => setPromo(event.target.value)} /></label>
          <button className="btn" onClick={() => updateSettings({ promoText: promo.trim() || settings.promoText })}><Save size={15} /> Lưu thông báo</button>
        </div>
        <div className="adminPanel dangerPanel">
          <div className="adminPanelHead"><div><p className="eyebrow">PRODUCT DATA</p><h2>Khôi phục dữ liệu sản phẩm</h2></div><RefreshCcw size={19} /></div>
          <p>Đưa toàn bộ sản phẩm, giá và tồn kho về trạng thái mặc định. Đơn hàng và wishlist vẫn được giữ nguyên.</p>
          <button className="btn secondary" onClick={() => { if (window.confirm("Khôi phục dữ liệu sản phẩm mặc định?")) resetCatalog(); }}><RefreshCcw size={15} /> Khôi phục mặc định</button>
        </div>
      </div> : null}

      {editing ? <div className="adminModalBackdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setEditing(null); }}>
        <form className="adminProductForm" onSubmit={submitProduct}>
          <div className="adminFormHead"><div><p className="eyebrow">{editing.id ? "EDIT PRODUCT" : "NEW PRODUCT"}</p><h2>{editing.id ? editing.name : "Thêm sản phẩm"}</h2></div><button type="button" className="iconButton" onClick={() => setEditing(null)}>×</button></div>
          <div className="adminFormGrid">
            <label className="adminField full"><span>Tên sản phẩm</span><input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
            <label className="adminField full"><span>Mô tả ngắn</span><input required value={editing.subtitle} onChange={(event) => setEditing({ ...editing, subtitle: event.target.value })} /></label>
            <label className="adminField"><span>SKU</span><input value={editing.sku ?? ""} onChange={(event) => setEditing({ ...editing, sku: event.target.value })} placeholder="Tự sinh nếu để trống" /></label>
            <label className="adminField"><span>Danh mục</span><select value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value as ProductCategory })}>{Object.entries(categoryLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="adminField"><span>Loại sản phẩm</span><select value={editing.type} onChange={(event) => setEditing({ ...editing, type: event.target.value as ClothingType })}>{Object.entries(typeLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="adminField"><span>Đối tượng</span><select value={editing.gender} onChange={(event) => setEditing({ ...editing, gender: event.target.value as Product["gender"] })}><option value="women">Nữ</option></select></label>
            <label className="adminField"><span>Giá bán</span><input type="number" min="0" value={editing.price} onChange={(event) => setEditing({ ...editing, price: Number(event.target.value) })} /></label>
            <label className="adminField"><span>Giá cũ</span><input type="number" min="0" value={editing.oldPrice ?? ""} onChange={(event) => setEditing({ ...editing, oldPrice: event.target.value ? Number(event.target.value) : undefined })} /></label>
            <label className="adminField"><span>Tồn kho</span><input type="number" min="0" value={editing.stock} onChange={(event) => setEditing({ ...editing, stock: Number(event.target.value) })} /></label>
            <label className="adminField"><span>Màu hiển thị</span><input value={editing.color} onChange={(event) => setEditing({ ...editing, color: event.target.value })} /></label>
            <label className="adminField"><span>Nhóm màu</span><select value={editing.colorFamily} onChange={(event) => setEditing({ ...editing, colorFamily: event.target.value as Product["colorFamily"] })}>{["black","white","navy","beige","blue","brown","red","green","gray","pink"].map((color) => <option key={color}>{color}</option>)}</select></label>
            <label className="adminField"><span>Size (ngăn cách dấu phẩy)</span><input value={editing.sizes.join(", ")} onChange={(event) => setEditing({ ...editing, sizes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label><div className="adminField full"><span>Tồn kho theo size</span><div className="variantStockEditor">{editing.sizes.map((size) => { const variant = editing.variants?.find((item) => item.size === size); return <label key={size}><span>{size}</span><input type="number" min="0" value={variant?.stock ?? 0} onChange={(event) => { const stock = Math.max(0, Number(event.target.value)); const variants = editing.sizes.map((itemSize) => { const current = editing.variants?.find((item) => item.size === itemSize); return itemSize === size ? { id: current?.id, sku: current?.sku ?? `${editing.sku || "LSO"}-${itemSize}`, size: itemSize, stock, active: stock > 0 } : current ?? { sku: `${editing.sku || "LSO"}-${itemSize}`, size: itemSize, stock: 0, active: false }; }); setEditing({ ...editing, variants, stock: variants.reduce((sum, item) => sum + item.stock, 0) }); }} /></label>; })}</div></div>
            <label className="adminField"><span>Chất liệu</span><input value={editing.material} onChange={(event) => setEditing({ ...editing, material: event.target.value })} /></label>
            <label className="adminField"><span>Phom</span><input value={editing.fit} onChange={(event) => setEditing({ ...editing, fit: event.target.value })} /></label>
            <label className="adminField full"><span>Ảnh chính (URL)</span><input required value={editing.image} onChange={(event) => setEditing({ ...editing, image: event.target.value, images: [event.target.value, ...editing.images.slice(1)] })} /></label>
            <label className="adminField full"><span>Gallery ảnh (mỗi URL một dòng)</span><textarea rows={4} value={editing.images.join("\n")} onChange={(event) => setEditing({ ...editing, images: event.target.value.split(/\n+/).map((item) => item.trim()).filter(Boolean) })} /></label>
            <label className="adminField"><span>Ảnh hover</span><input value={editing.hoverImage ?? ""} onChange={(event) => setEditing({ ...editing, hoverImage: event.target.value || undefined })} /></label>
            <label className="adminField"><span>Ảnh dùng cho Try-On</span><input value={editing.tryOnImage ?? ""} onChange={(event) => setEditing({ ...editing, tryOnImage: event.target.value || undefined })} /></label>

            <div className="adminField full"><span><strong>AI & Virtual Try-On metadata</strong></span></div>
            <label className="adminField"><span>Try-On category</span><select value={editing.tryOnCategory ?? ""} onChange={(event) => setEditing({ ...editing, tryOnCategory: (event.target.value || undefined) as Product["tryOnCategory"] })}><option value="">Chưa chọn</option><option value="tops">tops</option><option value="bottoms">bottoms</option><option value="one-pieces">one-pieces</option></select></label>
            <label className="adminField"><span>Loại ảnh Try-On</span><select value={editing.tryOnPhotoType ?? ""} onChange={(event) => setEditing({ ...editing, tryOnPhotoType: (event.target.value || undefined) as Product["tryOnPhotoType"] })}><option value="">Chưa chọn</option><option value="model">model</option><option value="flat-lay">flat-lay</option></select></label>
            <label className="adminField"><span>Silhouette</span><input value={editing.silhouette ?? ""} onChange={(event) => setEditing({ ...editing, silhouette: event.target.value || undefined })} /></label>
            <label className="adminField"><span>Length class</span><input value={editing.lengthClass ?? ""} onChange={(event) => setEditing({ ...editing, lengthClass: event.target.value || undefined })} /></label>
            <label className="adminField"><span>Neckline</span><input value={editing.neckline ?? ""} onChange={(event) => setEditing({ ...editing, neckline: event.target.value || undefined })} /></label>
            <label className="adminField"><span>Pattern</span><input value={editing.pattern ?? ""} onChange={(event) => setEditing({ ...editing, pattern: event.target.value || undefined })} /></label>
            <label className="adminField"><span>Mùa</span><input value={(editing.season ?? []).join(", ")} onChange={(event) => setEditing({ ...editing, season: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
            <label className="adminField"><span>Nhiệt độ màu</span><select value={editing.colorTemperature ?? ""} onChange={(event) => setEditing({ ...editing, colorTemperature: (event.target.value || undefined) as Product["colorTemperature"] })}><option value="">Chưa chọn</option><option value="warm">warm</option><option value="cool">cool</option><option value="neutral">neutral</option></select></label>
            <label className="adminField"><span>Formality (1-5)</span><input type="number" min="1" max="5" value={editing.formality ?? 2} onChange={(event) => setEditing({ ...editing, formality: Number(event.target.value) })} /></label>
            <label className="adminField"><span>Warmth (1-5)</span><input type="number" min="1" max="5" value={editing.warmth ?? 2} onChange={(event) => setEditing({ ...editing, warmth: Number(event.target.value) })} /></label>
            <label className="adminField"><span>Stretch (1-5)</span><input type="number" min="1" max="5" value={editing.stretch ?? 2} onChange={(event) => setEditing({ ...editing, stretch: Number(event.target.value) })} /></label>
            <label className="adminField"><span>Coverage (1-5)</span><input type="number" min="1" max="5" value={editing.coverage ?? 3} onChange={(event) => setEditing({ ...editing, coverage: Number(event.target.value) })} /></label>
            <label className="adminField full"><span>Pairing tags</span><input value={(editing.pairingTags ?? []).join(", ")} onChange={(event) => setEditing({ ...editing, pairingTags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
            <label className="adminField full"><span>Avoid pairing tags</span><input value={(editing.avoidPairingTags ?? []).join(", ")} onChange={(event) => setEditing({ ...editing, avoidPairingTags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
            <label className="adminField full"><span>AI search text</span><textarea rows={3} value={editing.aiSearchText ?? ""} onChange={(event) => setEditing({ ...editing, aiSearchText: event.target.value })} /></label>
            <label className="adminField"><span>Style</span><input value={editing.style.join(", ")} onChange={(event) => setEditing({ ...editing, style: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
            <label className="adminField"><span>Hoàn cảnh</span><input value={editing.occasion.join(", ")} onChange={(event) => setEditing({ ...editing, occasion: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} /></label>
          </div>
          <div className="adminChecks"><label><input type="checkbox" checked={editing.active !== false} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /> Đang bán</label><label><input type="checkbox" checked={Boolean(editing.featured)} onChange={(event) => setEditing({ ...editing, featured: event.target.checked })} /> Best seller</label><label><input type="checkbox" checked={Boolean(editing.isNew)} onChange={(event) => setEditing({ ...editing, isNew: event.target.checked })} /> New arrival</label><label><input type="checkbox" checked={Boolean(editing.analyzerReady)} onChange={(event) => setEditing({ ...editing, analyzerReady: event.target.checked })} /> Sẵn sàng cho AI Analyst</label></div>
          <div className="adminFormActions"><button type="button" className="btn secondary" onClick={() => setEditing(null)}>Hủy</button><button className="btn" type="submit"><Save size={15} /> Lưu sản phẩm</button></div>
        </form>
      </div> : null}
    </section>
  );
}
