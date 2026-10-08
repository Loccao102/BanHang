"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AppstoreOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DollarCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  InboxOutlined,
  LoadingOutlined,
  MinusOutlined,
  PictureOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TagOutlined,
  UploadOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import type { OrderStatus } from "@/lib/cart";
import {
  formatPrice,
  storefrontCategory,
  storefrontCategoryLabels,
  typesForStorefrontCategory,
  typeLabels,
  type ClothingType,
  type Product,
  type StorefrontCategory
} from "@/lib/products";

type Tab = "overview" | "products" | "orders" | "settings";

const statusLabel: Record<OrderStatus, string> = {
  processing: "Đang xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy"
};

const statusTagClass: Record<OrderStatus, string> = {
  processing: "antTagProcessing",
  confirmed: "antTagInfo",
  shipping: "antTagWarning",
  completed: "antTagSuccess",
  cancelled: "antTagError"
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

function AdminContent() {
  const {
    catalog,
    orders,
    settings,
    user,
    accountLoading,
    saveProduct,
    deleteProduct,
    adjustStock,
    toggleProductActive,
    updateOrderStatus,
    resetCatalog,
    updateSettings
  } = useStore();

  const searchParams = useSearchParams();
  const tabFromQuery = searchParams?.get("tab") as Tab | null;

  const [tab, setTab] = useState<Tab>(
    tabFromQuery && ["overview", "products", "orders", "settings"].includes(tabFromQuery)
      ? tabFromQuery
      : "overview"
  );
  const [editing, setEditing] = useState<Product | null>(null);
  const isProductModalOpen = Boolean(editing);

  useEffect(() => {
    if (!isProductModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isProductModalOpen]);
  const [saving, setSaving] = useState(false);
  const [promo, setPromo] = useState(settings.promoText);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (tabFromQuery && ["overview", "products", "orders", "settings"].includes(tabFromQuery)) {
      setTab(tabFromQuery);
    }
  }, [tabFromQuery]);

  useEffect(() => {
    setPromo(settings.promoText);
  }, [settings.promoText]);

  const visibleCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((product) => {
      const matchQuery =
        !q || `${product.name} ${product.sku ?? ""} ${product.color}`.toLowerCase().includes(q);
      const matchCat = categoryFilter === "all" || storefrontCategory(product) === categoryFilter;
      return matchQuery && matchCat;
    });
  }, [catalog, query, categoryFilter]);

  const stock = catalog.reduce((sum, item) => sum + item.stock, 0);
  const inventoryValue = catalog.reduce((sum, item) => sum + item.price * item.stock, 0);
  const revenue = orders
    .filter(
      (order) =>
        order.status !== "cancelled" &&
        (order.paymentStatus === "paid" ||
          (order.payment === "cod" && order.status === "completed"))
    )
    .reduce((sum, order) => sum + order.total, 0);
  const lowStock = catalog.filter((item) => item.stock <= 8).toSorted((a, b) => a.stock - b.stock);
  const processingCount = orders.filter((order) => order.status === "processing").length;
  const activeCount = catalog.filter((item) => item.active !== false).length;

  if (accountLoading) {
    return (
      <div className="antLoadingState">
        <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
        <p>Đang tải dữ liệu hệ thống quản trị...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực Quản trị Bị Hạn chế</h2>
          <p>Tài khoản hiện tại của bạn không có đặc quyền truy cập trang quản trị LSOUL.</p>
          <Link className="antBtn antBtnPrimary" href={user ? "/account" : "/login?next=/admin"}>
            {user ? "Về trang tài khoản" : "Đăng nhập với quyền Quản trị"}
          </Link>
        </div>
      </section>
    );
  }

  async function uploadProductImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = (await res.json()) as { url?: string };
        if (data.url) return data.url;
      }
    } catch (err) {
      console.warn("Upload to server failed, falling back to data URL:", err);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSingleUpload(
    field: "image" | "hoverImage" | "tryOnImage",
    file: File | undefined
  ) {
    if (!file || !editing) return;
    setUploadingField(field);
    try {
      const url = await uploadProductImage(file);
      if (field === "image") {
        setEditing({
          ...editing,
          image: url,
          images: editing.images.length ? [url, ...editing.images.slice(1)] : [url]
        });
      } else {
        setEditing({ ...editing, [field]: url });
      }
    } finally {
      setUploadingField(null);
    }
  }

  async function handleAlbumUpload(files: FileList | null) {
    if (!files || !files.length || !editing) return;
    setUploadingField("images");
    try {
      const uploadPromises = Array.from(files).map((f) => uploadProductImage(f));
      const urls = await Promise.all(uploadPromises);
      const nextImages = [...editing.images, ...urls];
      setEditing({
        ...editing,
        images: nextImages,
        image: editing.image || urls[0] || ""
      });
    } finally {
      setUploadingField(null);
    }
  }

  function removeAlbumImage(indexToRemove: number) {
    if (!editing) return;
    const nextImages = editing.images.filter((_, idx) => idx !== indexToRemove);
    setEditing({
      ...editing,
      images: nextImages,
      image: indexToRemove === 0 ? nextImages[0] || "" : editing.image
    });
  }

  function openNewProduct() {
    setEditing(blankProduct());
  }

  async function submitProduct(event: FormEvent) {
    event.preventDefault();
    if (!editing || saving) return;
    const generatedId =
      editing.id.trim() ||
      `${editing.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 5)}`;
    setSaving(true);
    // SKU để trống => máy chủ tự sinh mã kế tiếp (không trùng với sản phẩm đang ẩn).
    const saved = await saveProduct({
      ...editing,
      id: generatedId,
      name: editing.name.trim(),
      subtitle: editing.subtitle.trim(),
      sku: editing.sku?.trim() ?? "",
      images: editing.images.length ? editing.images : [editing.image],
      stock: Math.max(0, Number(editing.stock)),
      price: Math.max(0, Number(editing.price)),
      oldPrice: editing.oldPrice ? Number(editing.oldPrice) : undefined
    });
    setSaving(false);
    if (saved) setEditing(null); // lỗi thì giữ form mở để sửa lại
  }

  return (
    <div className="antAdminPageContainer">
      {/* Ant Design Page Header */}
      <div className="antPageHeader">
        <div className="antPageHeaderLeft">
          <div className="antBreadcrumb">
            <Link href="/admin">Trang chủ</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <span>Hệ thống Quản trị</span>
            <span className="antBreadcrumbSeparator">/</span>
            <span className="antBreadcrumbCurrent">
              {tab === "overview" && "Bảng điều khiển Tổng quan"}
              {tab === "products" && "Sản phẩm & Kho hàng"}
              {tab === "orders" && "Quản lý Đơn hàng"}
              {tab === "settings" && "Cài đặt Hệ thống"}
            </span>
          </div>
          <h1 className="antPageTitle">
            {tab === "overview" && "Tổng quan Vận hành"}
            {tab === "products" && "Quản lý Sản phẩm & Tồn kho"}
            {tab === "orders" && "Quản lý Đơn hàng Bán lẻ"}
            {tab === "settings" && "Cài đặt & Cấu hình"}
          </h1>
          <p className="antPageSubtitle">
            {tab === "overview" &&
              "Theo dõi trạng thái kinh doanh theo thời gian thực, quản lý cảnh báo tồn kho và theo dõi dòng tiền."}
            {tab === "products" &&
              `Danh mục hiện có ${catalog.length} sản phẩm, đồng bộ cơ sở dữ liệu PostgreSQL chuẩn doanh nghiệp.`}
            {tab === "orders" &&
              `Hệ thống tiếp nhận ${orders.length} đơn hàng, xử lý thông suốt trạng thái thanh toán và vận chuyển.`}
            {tab === "settings" &&
              "Cấu hình thanh thông báo tiếp thị người dùng và quản lý sao lưu/khôi phục dữ liệu catalog."}
          </p>
        </div>

        <div className="antPageHeaderRight">
          {tab === "products" ? (
            <button className="antBtn antBtnPrimary" onClick={openNewProduct}>
              <PlusOutlined /> Thêm sản phẩm mới
            </button>
          ) : tab === "overview" ? (
            <div className="antHeaderActionGroup">
              <button
                className="antBtn antBtnDefault"
                onClick={() => setTab("products")}
              >
                <AppstoreOutlined /> Xem danh mục kho
              </button>
              <button className="antBtn antBtnPrimary" onClick={openNewProduct}>
                <PlusOutlined /> Thêm sản phẩm
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Subpage Tab Pills (if switched locally) */}
      <div className="antTabSegmentBar">
        <button
          type="button"
          className={`antTabSegmentBtn ${tab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          <AppstoreOutlined />
          <span>Tổng quan</span>
        </button>
        <button
          type="button"
          className={`antTabSegmentBtn ${tab === "products" ? "active" : ""}`}
          onClick={() => setTab("products")}
        >
          <TagOutlined />
          <span>Sản phẩm & kho ({catalog.length})</span>
        </button>
        <button
          type="button"
          className={`antTabSegmentBtn ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          <ShoppingOutlined />
          <span>Đơn hàng ({orders.length})</span>
          {processingCount > 0 && (
            <span className="antBadgeCountSmall">{processingCount}</span>
          )}
        </button>
        <button
          type="button"
          className={`antTabSegmentBtn ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
        >
          <SettingOutlined />
          <span>Cài đặt hệ thống</span>
        </button>
      </div>

      {/* Tab: Overview */}
      {tab === "overview" && (
        <>
          {/* Ant Design Stat Cards Grid */}
          <div className="antStatCardsGrid">
            <div className="antStatCard">
              <div className="antStatCardHeader">
                <span className="antStatLabel">TỔNG SẢN PHẨM</span>
                <div className="antStatIconWrap blue">
                  <AppstoreOutlined />
                </div>
              </div>
              <div className="antStatValue">{catalog.length}</div>
              <div className="antStatFooter">
                <span className="antTag antTagSuccess">
                  <CheckCircleOutlined /> {activeCount} đang bán
                </span>
                <span className="antStatSubtext">
                  {catalog.length - activeCount} đang ẩn
                </span>
              </div>
            </div>

            <div className="antStatCard">
              <div className="antStatCardHeader">
                <span className="antStatLabel">TỔNG TỒN KHO</span>
                <div className="antStatIconWrap cyan">
                  <InboxOutlined />
                </div>
              </div>
              <div className="antStatValue">{stock.toLocaleString("vi-VN")}</div>
              <div className="antStatFooter">
                {lowStock.length > 0 ? (
                  <span className="antTag antTagWarning">
                    <ExclamationCircleOutlined /> {lowStock.length} SKU sắp hết
                  </span>
                ) : (
                  <span className="antTag antTagSuccess">
                    <CheckCircleOutlined /> Kho an toàn
                  </span>
                )}
                <span className="antStatSubtext">sản phẩm lưu kho</span>
              </div>
            </div>

            <div className="antStatCard">
              <div className="antStatCardHeader">
                <span className="antStatLabel">TỔNG ĐƠN HÀNG</span>
                <div className="antStatIconWrap purple">
                  <ShoppingOutlined />
                </div>
              </div>
              <div className="antStatValue">{orders.length}</div>
              <div className="antStatFooter">
                {processingCount > 0 ? (
                  <span className="antTag antTagProcessing">
                    <SyncOutlined spin /> {processingCount} chờ xử lý
                  </span>
                ) : (
                  <span className="antTag antTagSuccess">
                    <CheckCircleOutlined /> Đã hoàn tất xử lý
                  </span>
                )}
                <span className="antStatSubtext">đơn từ khách hàng</span>
              </div>
            </div>

            <div className="antStatCard">
              <div className="antStatCardHeader">
                <span className="antStatLabel">DOANH THU ĐÃ THU</span>
                <div className="antStatIconWrap green">
                  <DollarCircleOutlined />
                </div>
              </div>
              <div className="antStatValue greenText">{formatPrice(revenue)}</div>
              <div className="antStatFooter">
                <span className="antTag antTagDefault">
                  Giá trị kho: {formatPrice(inventoryValue)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Panels: Low Stock & Latest Orders */}
          <div className="antTwoColGrid">
            {/* Panel 1: Sắp hết hàng */}
            <div className="antCard">
              <div className="antCardHead">
                <div>
                  <div className="antCardEyebrow">CẢNH BÁO TỒN KHO</div>
                  <h2 className="antCardTitle">Sắp hết hàng</h2>
                </div>
                <button
                  type="button"
                  className="antBtn antBtnLink"
                  onClick={() => setTab("products")}
                >
                  Quản lý kho <ArrowRightOutlined />
                </button>
              </div>
              <div className="antCardBody">
                {lowStock.length ? (
                  <div className="antInventoryList">
                    {lowStock.slice(0, 6).map((product) => (
                      <div key={product.id} className="antInventoryItem">
                        <div className="antProductThumb">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="48px"
                          />
                        </div>
                        <div className="antProductInfo">
                          <strong className="antProductName">{product.name}</strong>
                          <span className="antProductSku">
                            {product.sku ?? product.id} · {product.color}
                          </span>
                        </div>
                        <div className="antStockBadgeWrap">
                          <span
                            className={`antTag ${
                              product.stock <= 3 ? "antTagError" : "antTagWarning"
                            }`}
                          >
                            Còn {product.stock} cái
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="antEmptyState">
                    <CheckCircleOutlined style={{ fontSize: 32, color: "#52c41a" }} />
                    <p>Kho hàng đang ở trạng thái đầy đủ, không có SKU nào dưới mức báo động.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Panel 2: Đơn hàng gần đây */}
            <div className="antCard">
              <div className="antCardHead">
                <div>
                  <div className="antCardEyebrow">HOẠT ĐỘNG MỚI</div>
                  <h2 className="antCardTitle">Đơn gần đây</h2>
                </div>
                <button
                  type="button"
                  className="antBtn antBtnLink"
                  onClick={() => setTab("orders")}
                >
                  Xem tất cả đơn <ArrowRightOutlined />
                </button>
              </div>
              <div className="antCardBody">
                {orders.length ? (
                  <div className="antOrderRecentList">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="antOrderRecentItem">
                        <div className="antOrderMain">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="antOrderId"
                          >
                            #{order.id}
                          </Link>
                          <span className="antOrderMeta">
                            {order.customer.name} · {order.items.length} món
                          </span>
                        </div>
                        <div className="antOrderPricing">
                          <strong className="antOrderAmount">
                            {formatPrice(order.total)}
                          </strong>
                          <span
                            className={`antTag ${
                              statusTagClass[order.status] ?? "antTagDefault"
                            }`}
                          >
                            {statusLabel[order.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="antEmptyState">
                    <ShoppingOutlined style={{ fontSize: 32, color: "#8c8c8c" }} />
                    <p>Chưa có đơn hàng phát sinh trong hệ thống.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab: Products & Inventory */}
      {tab === "products" && (
        <div className="antCard">
          <div className="antCardHead antToolbar">
            <div className="antToolbarLeft">
              <h2 className="antCardTitle">
                Danh sách sản phẩm{" "}
                <span className="antCountTag">{visibleCatalog.length}</span>
              </h2>
            </div>
            <div className="antToolbarRight">
              <div className="antSearchInput">
                <SearchOutlined className="antSearchIcon" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm tên, SKU, màu sắc..."
                />
                {query && (
                  <button
                    type="button"
                    className="antSearchClear"
                    onClick={() => setQuery("")}
                  >
                    <CloseOutlined />
                  </button>
                )}
              </div>

              <select
                className="antSelect"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">Tất cả danh mục</option>
                {Object.entries(storefrontCategoryLabels).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>

              <button className="antBtn antBtnPrimary" onClick={openNewProduct}>
                <PlusOutlined /> Thêm mới
              </button>
            </div>
          </div>

          <div className="antTableContainer">
            <table className="antTable">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Mã SKU</th>
                  <th>Danh mục</th>
                  <th>Kiểu dáng</th>
                  <th>Giá niêm yết</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleCatalog.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="antProductTableCell">
                        <div className="antProductTableImg">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="52px"
                          />
                        </div>
                        <div className="antProductTableText">
                          <strong className="antProductTableName">
                            {product.name}
                          </strong>
                          <span className="antProductTableSub">
                            {product.color} · {product.fit}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="antSkuBadge">{product.sku ?? "—"}</code>
                    </td>
                    <td>{storefrontCategoryLabels[storefrontCategory(product)]}</td>
                    <td>{typeLabels[product.type] ?? product.type}</td>
                    <td>
                      <strong className="antPrice">
                        {formatPrice(product.price)}
                      </strong>
                      {product.oldPrice && (
                        <small className="antOldPrice">
                          {formatPrice(product.oldPrice)}
                        </small>
                      )}
                    </td>
                    <td>
                      <div className="antStockStepper">
                        <button
                          type="button"
                          className="antStepBtn"
                          onClick={() => adjustStock(product.id, -1)}
                          title="Giảm 1"
                        >
                          <MinusOutlined />
                        </button>
                        <span
                          className={`antStockNumber ${
                            product.stock <= 3 ? "danger" : ""
                          }`}
                        >
                          {product.stock}
                        </span>
                        <button
                          type="button"
                          className="antStepBtn"
                          onClick={() => adjustStock(product.id, 1)}
                          title="Tăng 1"
                        >
                          <PlusOutlined />
                        </button>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`antStatusToggle ${
                          product.active === false ? "inactive" : "active"
                        }`}
                        onClick={() => toggleProductActive(product.id)}
                        title="Bấm để bật/tắt hiển thị trên website"
                      >
                        {product.active === false ? (
                          <>
                            <EyeInvisibleOutlined /> Đang ẩn
                          </>
                        ) : (
                          <>
                            <EyeOutlined /> Đang bán
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="antActionRow">
                        <button
                          type="button"
                          className="antActionBtn edit"
                          aria-label="Sửa sản phẩm"
                          title="Sửa thông tin"
                          onClick={() => setEditing(product)}
                        >
                          <EditOutlined /> Sửa
                        </button>
                        <button
                          type="button"
                          className="antActionBtn delete"
                          aria-label="Xóa sản phẩm"
                          title="Xóa sản phẩm"
                          onClick={() => {
                            if (window.confirm(`Xóa vĩnh viễn sản phẩm ${product.name}?`)) {
                              deleteProduct(product.id);
                            }
                          }}
                        >
                          <DeleteOutlined />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Orders */}
      {tab === "orders" && (
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">QUẢN LÝ ĐƠN HÀNG</div>
              <h2 className="antCardTitle">
                Danh sách đơn hàng{" "}
                <span className="antCountTag">{orders.length}</span>
              </h2>
            </div>
            <span className="antCardSubtitle">
              Đơn hàng khách đặt qua website sẽ được đồng bộ và cập nhật trạng thái tức thời.
            </span>
          </div>

          <div className="antCardBody">
            {orders.length ? (
              <div className="antOrdersTableContainer">
                <table className="antTable">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Số lượng</th>
                      <th>Thanh toán</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái đơn</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="antOrderId"
                          >
                            #{order.id}
                          </Link>
                          <small className="antSubDate">
                            {new Intl.DateTimeFormat("vi-VN", {
                              dateStyle: "short",
                              timeStyle: "short"
                            }).format(new Date(order.createdAt))}
                          </small>
                        </td>
                        <td>
                          <strong>{order.customer.name}</strong>
                          <span className="antSubPhone">
                            {order.customer.phone} · {order.customer.city}
                          </span>
                        </td>
                        <td>
                          {order.items.reduce((sum, line) => sum + line.quantity, 0)}{" "}
                          sản phẩm
                        </td>
                        <td>
                          <span
                            className={`antTag ${
                              order.payment === "qr"
                                ? "antTagInfo"
                                : "antTagDefault"
                            }`}
                          >
                            {order.payment === "qr" ? "QR Chuyển khoản" : "COD"}
                          </span>
                        </td>
                        <td>
                          <strong className="antPrice greenText">
                            {formatPrice(order.total)}
                          </strong>
                        </td>
                        <td>
                          <div className="antSelectWrap">
                            <select
                              className="antSelectStatus"
                              value={order.status}
                              onChange={(event) =>
                                updateOrderStatus(
                                  order.id,
                                  event.target.value as OrderStatus
                                )
                              }
                            >
                              {Object.entries(statusLabel).map(([val, label]) => (
                                <option key={val} value={val}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="antBtn antBtnDefault antBtnSm"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="antEmptyState large">
                <ShoppingOutlined style={{ fontSize: 44, color: "#8c8c8c" }} />
                <h3>Chưa có đơn hàng nào</h3>
                <p>
                  Khi khách hàng hoàn tất giỏ hàng và thanh toán trên website, đơn hàng sẽ ngay lập tức hiển thị tại đây.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {tab === "settings" && (
        <div className="antTwoColGrid">
          <div className="antCard">
            <div className="antCardHead">
              <div>
                <div className="antCardEyebrow">BANNER THÔNG BÁO</div>
                <h2 className="antCardTitle">Thông báo khuyến mãi đầu trang</h2>
              </div>
              <SettingOutlined style={{ fontSize: 20, color: "#1677ff" }} />
            </div>
            <div className="antCardBody">
              <label className="antFormField">
                <span className="antFormLabel">Nội dung hiển thị trên thanh announcement bar</span>
                <textarea
                  className="antInput antTextarea"
                  rows={4}
                  value={promo}
                  onChange={(event) => setPromo(event.target.value)}
                />
              </label>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="antBtn antBtnPrimary"
                  onClick={() =>
                    updateSettings({
                      promoText: promo.trim() || settings.promoText
                    })
                  }
                >
                  <SaveOutlined /> Lưu thay đổi banner
                </button>
              </div>
            </div>
          </div>

          <div className="antCard antDangerCard">
            <div className="antCardHead">
              <div>
                <div className="antCardEyebrow">DỮ LIỆU SẢN PHẨM</div>
                <h2 className="antCardTitle">Khôi phục danh mục mẫu</h2>
              </div>
              <ReloadOutlined style={{ fontSize: 20, color: "#faad14" }} />
            </div>
            <div className="antCardBody">
              <p className="antDangerNotice">
                Hành động này sẽ thiết lập lại toàn bộ sản phẩm, bảng giá và số lượng tồn kho ban đầu.
                Đơn hàng và giỏ hàng của khách hàng vẫn được bảo toàn nguyên vẹn.
              </p>
              <button
                type="button"
                className="antBtn antBtnDashed"
                onClick={() => {
                  if (
                    window.confirm(
                      "Bạn có chắc chắn muốn khôi phục dữ liệu sản phẩm mặc định?"
                    )
                  ) {
                    resetCatalog();
                  }
                }}
              >
                <ReloadOutlined /> Khôi phục dữ liệu mặc định
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ant Design Modal: Product Create / Edit */}
      {editing && typeof document !== "undefined" && createPortal(
        <div
          className="antModalBackdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setEditing(null);
          }}
        >
          <div className="antModal">
            <div className="antModalHead">
              <div>
                <div className="antCardEyebrow">
                  {editing.id ? "CHỈNH SỬA SẢN PHẨM" : "THÊM MỚI SẢN PHẨM"}
                </div>
                <h2 className="antModalTitle">
                  {editing.id ? editing.name : "Tạo sản phẩm thời trang mới"}
                </h2>
              </div>
              <button
                type="button"
                className="antModalCloseBtn"
                onClick={() => setEditing(null)}
              >
                <CloseOutlined />
              </button>
            </div>

            <form onSubmit={submitProduct} className="antModalForm">
              <div className="antModalBody">
                <div className="antFormSection">
                  <div className="antSectionTitle">Thông tin cơ bản</div>
                  <div className="antFormGrid">
                    <label className="antFormField full">
                      <span className="antFormLabel">Tên sản phẩm *</span>
                      <input
                        required
                        className="antInput"
                        value={editing.name}
                        onChange={(event) =>
                          setEditing({ ...editing, name: event.target.value })
                        }
                      />
                    </label>
                    <label className="antFormField full">
                      <span className="antFormLabel">Mô tả ngắn *</span>
                      <input
                        required
                        className="antInput"
                        value={editing.subtitle}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            subtitle: event.target.value
                          })
                        }
                      />
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Mã SKU</span>
                      <input
                        className="antInput"
                        value={editing.sku ?? ""}
                        onChange={(event) =>
                          setEditing({ ...editing, sku: event.target.value })
                        }
                        placeholder="Tự động sinh nếu để trống"
                      />
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Mã nhóm màu (groupCode)</span>
                      <input
                        className="antInput"
                        list="groupCodeOptions"
                        value={editing.groupCode ?? ""}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            groupCode: event.target.value.trim().toUpperCase().replace(/\s+/g, "-") || undefined
                          })
                        }
                        placeholder="VD: DR-AURA-MAXI - các màu cùng mã sẽ nối với nhau"
                      />
                      <datalist id="groupCodeOptions">
                        {Array.from(new Set(catalog.map((item) => item.groupCode).filter(Boolean))).map((code) => (
                          <option key={code} value={code} />
                        ))}
                      </datalist>
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Danh mục</span>
                      <select
                        className="antInput"
                        value={storefrontCategory(editing)}
                        onChange={(event) => {
                          const nextCategory = event.target.value as StorefrontCategory;
                          const allowedTypes = typesForStorefrontCategory(nextCategory);
                          const nextType = allowedTypes.includes(editing.type) ? editing.type : allowedTypes[0];
                          setEditing({
                            ...editing,
                            category: nextCategory === "pants" || nextCategory === "skirts" ? "bottoms" : nextCategory,
                            type: nextType,
                            tryOnCategory: nextCategory === "pants" || nextCategory === "skirts"
                              ? "bottoms"
                              : nextCategory === "dress" || nextCategory === "set" ? "one-pieces" : "tops"
                          });
                        }}
                      >
                        {Object.entries(storefrontCategoryLabels).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Loại trang phục</span>
                      <select
                        className="antInput"
                        value={editing.type}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            type: event.target.value as ClothingType
                          })
                        }
                      >
                        {Object.entries(typeLabels)
                          .filter(([val]) => typesForStorefrontCategory(storefrontCategory(editing)).includes(val as ClothingType))
                          .map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Đối tượng</span>
                      <select
                        className="antInput"
                        value={editing.gender}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            gender: event.target.value as Product["gender"]
                          })
                        }
                      >
                        <option value="women">Nữ (Women)</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="antFormSection">
                  <div className="antSectionTitle">Giá bán & Tồn kho</div>
                  <div className="antFormGrid">
                    <label className="antFormField">
                      <span className="antFormLabel">Giá bán (VND) *</span>
                      <input
                        type="number"
                        min="0"
                        className="antInput"
                        value={editing.price}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            price: Number(event.target.value)
                          })
                        }
                      />
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Giá cũ (nếu có giảm)</span>
                      <input
                        type="number"
                        min="0"
                        className="antInput"
                        value={editing.oldPrice ?? ""}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            oldPrice: event.target.value
                              ? Number(event.target.value)
                              : undefined
                          })
                        }
                      />
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Tổng tồn kho *</span>
                      <input
                        type="number"
                        min="0"
                        className="antInput"
                        value={editing.stock}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            stock: Number(event.target.value)
                          })
                        }
                      />
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Màu sắc hiển thị</span>
                      <input
                        className="antInput"
                        value={editing.color}
                        onChange={(event) =>
                          setEditing({ ...editing, color: event.target.value })
                        }
                      />
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Nhóm màu (Filter)</span>
                      <select
                        className="antInput"
                        value={editing.colorFamily}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            colorFamily: event.target
                              .value as Product["colorFamily"]
                          })
                        }
                      >
                        {[
                          "black",
                          "white",
                          "navy",
                          "beige",
                          "blue",
                          "brown",
                          "red",
                          "green",
                          "gray",
                          "pink"
                        ].map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Danh sách size (cách dấu phẩy)</span>
                      <input
                        className="antInput"
                        value={editing.sizes.join(", ")}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            sizes: event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean)
                          })
                        }
                      />
                    </label>
                    <div className="antFormField full">
                      <span className="antFormLabel">Phân bổ tồn kho theo size</span>
                      <div className="antVariantGrid">
                        {editing.sizes.map((size) => {
                          const variant = editing.variants?.find(
                            (item) => item.size === size
                          );
                          return (
                            <div key={size} className="antVariantItem">
                              <span className="antVariantSizeLabel">Size {size}</span>
                              <input
                                type="number"
                                min="0"
                                className="antInput"
                                value={variant?.stock ?? 0}
                                onChange={(event) => {
                                  const stock = Math.max(
                                    0,
                                    Number(event.target.value)
                                  );
                                  const variants = editing.sizes.map(
                                    (itemSize) => {
                                      const current = editing.variants?.find(
                                        (item) => item.size === itemSize
                                      );
                                      return itemSize === size
                                        ? {
                                            id: current?.id,
                                            sku:
                                              current?.sku ??
                                              `${editing.sku || "LSO"}-${itemSize}`,
                                            size: itemSize,
                                            stock,
                                            active: stock > 0
                                          }
                                        : current ?? {
                                            sku: `${
                                              editing.sku || "LSO"
                                            }-${itemSize}`,
                                            size: itemSize,
                                            stock: 0,
                                            active: false
                                          };
                                    }
                                  );
                                  setEditing({
                                    ...editing,
                                    variants,
                                    stock: variants.reduce(
                                      (sum, item) => sum + item.stock,
                                      0
                                    )
                                  });
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="antFormSection">
                  <div className="antSectionTitle">Hình ảnh sản phẩm</div>
                  <div className="antFormGrid">
                    {/* Ảnh chính */}
                    <div className="antFormField full">
                      <span className="antFormLabel">Ảnh chính (URL hoặc Tải ảnh từ máy) *</span>
                      <div className="antImageInputRow">
                        <input
                          required
                          className="antInput"
                          placeholder="https://... hoặc tải ảnh từ máy tính"
                          value={editing.image}
                          onChange={(event) =>
                            setEditing({
                              ...editing,
                              image: event.target.value,
                              images: [
                                event.target.value,
                                ...editing.images.slice(1)
                              ]
                            })
                          }
                        />
                        <label className={`antUploadBtn ${uploadingField === "image" ? "loading" : ""}`}>
                          {uploadingField === "image" ? (
                            <LoadingOutlined spin />
                          ) : (
                            <UploadOutlined />
                          )}
                          <span>{uploadingField === "image" ? "Đang tải..." : "Tải ảnh lên"}</span>
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            disabled={uploadingField === "image"}
                            onChange={(e) => handleSingleUpload("image", e.target.files?.[0])}
                          />
                        </label>
                      </div>
                      {editing.image && (
                        <div className="antImageThumbPreview">
                          <img src={editing.image} alt="Ảnh chính" />
                          <div className="antThumbInfo">
                            <span className="antThumbLabel">Ảnh đại diện chính của sản phẩm</span>
                            <span className="antThumbUrl">{editing.image}</span>
                          </div>
                          <button
                            type="button"
                            className="antThumbRemoveBtn"
                            onClick={() => setEditing({ ...editing, image: "" })}
                            title="Xóa ảnh"
                          >
                            <CloseOutlined />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Album ảnh chi tiết */}
                    <div className="antFormField full">
                      <div className="antAlbumHeadRow">
                        <span className="antFormLabel">
                          Album ảnh chi tiết ({editing.images.length} ảnh)
                        </span>
                        <label className={`antUploadBtn secondary ${uploadingField === "images" ? "loading" : ""}`}>
                          {uploadingField === "images" ? (
                            <LoadingOutlined spin />
                          ) : (
                            <UploadOutlined />
                          )}
                          <span>
                            {uploadingField === "images"
                              ? "Đang tải ảnh..."
                              : "+ Tải thêm ảnh vào album"}
                          </span>
                          <input
                            type="file"
                            hidden
                            multiple
                            accept="image/*"
                            disabled={uploadingField === "images"}
                            onChange={(e) => handleAlbumUpload(e.target.files)}
                          />
                        </label>
                      </div>

                      {/* Visual Gallery of Album */}
                      {editing.images.length > 0 && (
                        <div className="antAlbumThumbGrid">
                          {editing.images.map((imgUrl, idx) => (
                            <div key={`${imgUrl}-${idx}`} className="antAlbumThumbItem">
                              <img src={imgUrl} alt={`Ảnh ${idx + 1}`} />
                              {idx === 0 && <span className="antMainBadge">Chính</span>}
                              <button
                                type="button"
                                className="antAlbumDeleteBtn"
                                onClick={() => removeAlbumImage(idx)}
                                title="Xóa ảnh này khỏi album"
                              >
                                <CloseOutlined />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <textarea
                        rows={2}
                        className="antInput antTextarea"
                        placeholder="Mỗi URL ảnh một dòng (hoặc dùng nút Tải thêm ảnh phía trên)..."
                        value={editing.images.join("\n")}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            images: event.target.value
                              .split(/\n+/)
                              .map((item) => item.trim())
                              .filter(Boolean)
                          })
                        }
                      />
                    </div>

                    {/* Ảnh hover khi rê chuột */}
                    <div className="antFormField">
                      <span className="antFormLabel">Ảnh hover khi rê chuột</span>
                      <div className="antImageInputRow">
                        <input
                          className="antInput"
                          placeholder="https://... hoặc tải ảnh"
                          value={editing.hoverImage ?? ""}
                          onChange={(event) =>
                            setEditing({
                              ...editing,
                              hoverImage: event.target.value || undefined
                            })
                          }
                        />
                        <label className={`antUploadBtn iconOnly ${uploadingField === "hoverImage" ? "loading" : ""}`} title="Tải ảnh hover từ máy">
                          {uploadingField === "hoverImage" ? <LoadingOutlined spin /> : <UploadOutlined />}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            disabled={uploadingField === "hoverImage"}
                            onChange={(e) => handleSingleUpload("hoverImage", e.target.files?.[0])}
                          />
                        </label>
                      </div>
                      {editing.hoverImage && (
                        <div className="antImageThumbPreview small">
                          <img src={editing.hoverImage} alt="Ảnh hover" />
                          <button
                            type="button"
                            className="antThumbRemoveBtn"
                            onClick={() => setEditing({ ...editing, hoverImage: undefined })}
                            title="Xóa ảnh hover"
                          >
                            <CloseOutlined />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Ảnh dành cho Virtual Try-On */}
                    <div className="antFormField">
                      <span className="antFormLabel">Ảnh dành cho Virtual Try-On</span>
                      <div className="antImageInputRow">
                        <input
                          className="antInput"
                          placeholder="https://... hoặc tải ảnh"
                          value={editing.tryOnImage ?? ""}
                          onChange={(event) =>
                            setEditing({
                              ...editing,
                              tryOnImage: event.target.value || undefined
                            })
                          }
                        />
                        <label className={`antUploadBtn iconOnly ${uploadingField === "tryOnImage" ? "loading" : ""}`} title="Tải ảnh thử đồ từ máy">
                          {uploadingField === "tryOnImage" ? <LoadingOutlined spin /> : <UploadOutlined />}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            disabled={uploadingField === "tryOnImage"}
                            onChange={(e) => handleSingleUpload("tryOnImage", e.target.files?.[0])}
                          />
                        </label>
                      </div>
                      {editing.tryOnImage && (
                        <div className="antImageThumbPreview small">
                          <img src={editing.tryOnImage} alt="Ảnh Try-On" />
                          <button
                            type="button"
                            className="antThumbRemoveBtn"
                            onClick={() => setEditing({ ...editing, tryOnImage: undefined })}
                            title="Xóa ảnh Try-On"
                          >
                            <CloseOutlined />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="antFormSection">
                  <div className="antSectionTitle">Cấu hình AI & Virtual Try-On</div>
                  <div className="antFormGrid">
                    <label className="antFormField">
                      <span className="antFormLabel">Phân loại Try-On</span>
                      <select
                        className="antInput"
                        value={editing.tryOnCategory ?? ""}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            tryOnCategory: (event.target.value ||
                              undefined) as Product["tryOnCategory"]
                          })
                        }
                      >
                        <option value="">Chưa chọn</option>
                        <option value="tops">tops (Áo / Corset)</option>
                        <option value="bottoms">bottoms (Vùng thử AI cho quần và chân váy)</option>
                        <option value="one-pieces">one-pieces (Đầm / Liền thân)</option>
                      </select>
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Loại ảnh Try-On</span>
                      <select
                        className="antInput"
                        value={editing.tryOnPhotoType ?? ""}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            tryOnPhotoType: (event.target.value ||
                              undefined) as Product["tryOnPhotoType"]
                          })
                        }
                      >
                        <option value="">Chưa chọn</option>
                        <option value="model">Người mẫu chụp (model)</option>
                        <option value="flat-lay">Trải sàn (flat-lay)</option>
                      </select>
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Silhouette (Kiểu dáng)</span>
                      <input
                        className="antInput"
                        value={editing.silhouette ?? ""}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            silhouette: event.target.value || undefined
                          })
                        }
                      />
                    </label>
                    <label className="antFormField">
                      <span className="antFormLabel">Độ dài (Length class)</span>
                      <input
                        className="antInput"
                        value={editing.lengthClass ?? ""}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            lengthClass: event.target.value || undefined
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="antCheckGroup">
                  <label className="antCheckboxLabel">
                    <input
                      type="checkbox"
                      checked={editing.active !== false}
                      onChange={(event) =>
                        setEditing({ ...editing, active: event.target.checked })
                      }
                    />
                    <span>Hiển thị và mở bán trên website</span>
                  </label>
                  <label className="antCheckboxLabel">
                    <input
                      type="checkbox"
                      checked={Boolean(editing.featured)}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          featured: event.target.checked
                        })
                      }
                    />
                    <span>Gắn nhãn Bán chạy (Best Seller)</span>
                  </label>
                  <label className="antCheckboxLabel">
                    <input
                      type="checkbox"
                      checked={Boolean(editing.isNew)}
                      onChange={(event) =>
                        setEditing({ ...editing, isNew: event.target.checked })
                      }
                    />
                    <span>Gắn nhãn Hàng mới về (New Arrival)</span>
                  </label>
                  <label className="antCheckboxLabel">
                    <input
                      type="checkbox"
                      checked={Boolean(editing.analyzerReady)}
                      onChange={(event) =>
                        setEditing({
                          ...editing,
                          analyzerReady: event.target.checked
                        })
                      }
                    />
                    <span>Sẵn sàng cho AI Stylist & Gợi ý phối đồ</span>
                  </label>
                </div>
              </div>

              <div className="antModalFoot">
                <button
                  type="button"
                  className="antBtn antBtnDefault"
                  onClick={() => setEditing(null)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="antBtn antBtnPrimary">
                  <SaveOutlined /> Lưu thông tin sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="antLoadingState">
          <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
          <p>Đang tải trang quản trị...</p>
        </div>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
