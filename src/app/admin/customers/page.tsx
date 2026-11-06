"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  HeartOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  RightOutlined,
  SearchOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import { ToneTag } from "@/components/admin/status-tag";
import { formatPrice } from "@/lib/products";
import { Pagination } from "@/components/pagination";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  orderCount: number;
  paidOrderCount: number;
  wishlistCount: number;
  addressCount: number;
  lifetimeValue: number;
  lastOrderAt?: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const last = parts[parts.length - 1][0] ?? "";
  const first = parts.length > 1 ? parts[0][0] : "";
  return `${first}${last}`.toUpperCase();
}

function customerSegment(c: CustomerRow) {
  if (c.lifetimeValue >= 5_000_000) return { label: "Khách VIP", tone: "purple" as const };
  if (c.paidOrderCount > 0) return { label: "Đã mua hàng", tone: "success" as const };
  if (c.orderCount > 0) return { label: "Chờ thanh toán", tone: "warning" as const };
  return { label: "Mới đăng ký", tone: "default" as const };
}

const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function AdminCustomersPage() {
  const { user, accountLoading } = useStore();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [segment, setSegment] = useState<"all" | "purchased" | "no-orders" | "no-payment">("all");
  const [sort, setSort] = useState<"recent" | "ltv" | "orders">("recent");
  const [page, setPage] = useState(1);
  const CUSTOMERS_PER_PAGE = 10;

  async function loadCustomers() {
    if (user?.role !== "admin") return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/customers", { cache: "no-store" });
      if (!response.ok) throw new Error("Không thể tải danh sách khách hàng.");
      const data = await response.json() as { customers: CustomerRow[] };
      setCustomers(data.customers);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lỗi kết nối CRM.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  useEffect(() => {
    setPage(1);
  }, [query, segment, sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = customers.filter((customer) => {
      const matchesQuery = !q || `${customer.name} ${customer.email} ${customer.phone ?? ""}`.toLowerCase().includes(q);
      const matchesSegment = segment === "all" ||
        (segment === "purchased" && customer.paidOrderCount > 0) ||
        (segment === "no-orders" && customer.orderCount === 0) ||
        (segment === "no-payment" && customer.orderCount > 0 && customer.paidOrderCount === 0);
      return matchesQuery && matchesSegment;
    });
    return matches.sort((a, b) => sort === "ltv"
      ? b.lifetimeValue - a.lifetimeValue
      : sort === "orders" ? b.orderCount - a.orderCount
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customers, query, segment, sort]);

  const totalPages = Math.ceil(filtered.length / CUSTOMERS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * CUSTOMERS_PER_PAGE;
    return filtered.slice(start, start + CUSTOMERS_PER_PAGE);
  }, [filtered, page]);

  if (accountLoading) {
    return (
      <div className="antLoadingState">
        <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
        <p>Đang tải danh sách khách hàng...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực Quản trị Bị Hạn chế</h2>
          <p>Yêu cầu tài khoản quản trị để truy cập dữ liệu CRM khách hàng.</p>
          <Link className="antBtn antBtnPrimary" href="/login?next=/admin/customers">
            Đăng nhập Quản trị
          </Link>
        </div>
      </section>
    );
  }

  const totalOrders = customers.reduce((sum, item) => sum + item.orderCount, 0);
  const totalLTV = customers.reduce((sum, item) => sum + item.lifetimeValue, 0);
  const totalWishlist = customers.reduce((sum, item) => sum + item.wishlistCount, 0);
  const purchasedCustomers = customers.filter((c) => c.paidOrderCount > 0).length;

  return (
    <div className="antAdminPageContainer">
      {/* Page Header */}
      <div className="antPageHeader">
        <div className="antPageHeaderLeft">
          <div className="antBreadcrumb">
            <Link href="/admin">Trang chủ</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <span>Hệ thống Quản trị</span>
            <span className="antBreadcrumbSeparator">/</span>
            <span className="antBreadcrumbCurrent">Quản lý Khách hàng CRM</span>
          </div>
          <h1 className="antPageTitle">Hồ sơ & Dữ liệu Khách hàng</h1>
          <p className="antPageSubtitle">
            Theo dõi hành vi mua sắm, phân nhóm hội viên, giá trị vòng đời (LTV) và hồ sơ phong cách 360° trong hệ sinh thái LSOUL.
          </p>
        </div>

        <div className="antPageHeaderRight">
          <div className="antHeaderActionGroup">
            <button type="button" className="antBtn antBtnDefault" disabled={loading} onClick={() => void loadCustomers()}>
              <ReloadOutlined spin={loading} /> Làm mới
            </button>
            <Link className="antBtn antBtnDefault" href="/admin/marketing">
              Mã giảm giá & Social
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">TỔNG KHÁCH HÀNG</span>
            <div className="antStatIconWrap blue">
              <TeamOutlined />
            </div>
          </div>
          <div className="antStatValue">{customers.length}</div>
          <div className="antStatFooter">
            <span className="antTag antTagSuccess">
              <CheckCircleOutlined /> {purchasedCustomers} khách đã thanh toán
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">ĐƠN GẮN TÀI KHOẢN</span>
            <div className="antStatIconWrap purple">
              <ShoppingOutlined />
            </div>
          </div>
          <div className="antStatValue">{totalOrders}</div>
          <div className="antStatFooter">
            <span className="antTag antTagInfo">Đơn từ hội viên đã đăng ký</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">TỔNG LIFETIME VALUE (LTV)</span>
            <div className="antStatIconWrap green">
              <DollarCircleOutlined />
            </div>
          </div>
          <div className="antStatValue greenText">{formatPrice(totalLTV)}</div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">Doanh số tích lũy từ hội viên</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">SẢN PHẨM TRONG WISHLIST</span>
            <div className="antStatIconWrap orange">
              <HeartOutlined />
            </div>
          </div>
          <div className="antStatValue">{totalWishlist}</div>
          <div className="antStatFooter">
            <span className="antTag antTagWarning">Mục yêu thích được lưu</span>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="antInlineAlert error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Main Customers Table Card */}
      <div className="antCard">
        <div className="antCardHead antToolbar">
          <div className="antToolbarLeft">
            <h2 className="antCardTitle">
              Danh sách hội viên{" "}
              <span className="antCountTag">{filtered.length}</span>
            </h2>
          </div>
          <div className="antToolbarRight">
            <div className="antSearchInput">
              <SearchOutlined className="antSearchIcon" />
              <input value={query} onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm tên, email, số điện thoại..." />
            </div>
            <select className="antSelect" value={segment} aria-label="Lọc nhóm khách"
              onChange={(event) => setSegment(event.target.value as typeof segment)}>
              <option value="all">Tất cả khách ({customers.length})</option>
              <option value="purchased">Đã thanh toán ({purchasedCustomers})</option>
              <option value="no-payment">Có đơn, chờ thanh toán</option>
              <option value="no-orders">Chưa đặt đơn</option>
            </select>
            <select className="antSelect" value={sort} aria-label="Sắp xếp khách"
              onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="recent">Mới đăng ký</option>
              <option value="ltv">Chi tiêu cao nhất</option>
              <option value="orders">Nhiều đơn nhất</option>
            </select>
          </div>
        </div>

        <div className="antTableContainer">
          <table className="antTable">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Thông tin liên hệ</th>
                <th>Trạng thái</th>
                <th>Đơn đặt & Yêu thích</th>
                <th>Tổng chi tiêu (LTV)</th>
                <th>Thanh toán gần nhất</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#8c8c8c" }}>
                    Không có khách hàng phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
              {paginatedCustomers.map((customer) => {
                const seg = customerSegment(customer);
                return (
                  <tr key={customer.id}>
                    <td>
                      <div className="antCustomerCell">
                        <div className="antAvatar small">{initials(customer.name)}</div>
                        <div className="antCustomerMeta">
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="antCustomerName"
                          >
                            {customer.name}
                          </Link>
                          <small className="antSubDate">
                            Tham gia {dateFmt.format(new Date(customer.createdAt))}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="antCustomerContact">
                        <span className="antCustomerEmail">
                          <MailOutlined /> {customer.email}
                        </span>
                        <small className={`antCustomerPhone ${customer.phone ? "" : "muted"}`}>
                          <PhoneOutlined /> {customer.phone || "Chưa cập nhật SĐT"}
                        </small>
                      </div>
                    </td>
                    <td>
                      <ToneTag tone={seg.tone}>{seg.label}</ToneTag>
                    </td>
                    <td>
                      <div className="antTagWrap">
                        <ToneTag tone={customer.orderCount > 0 ? "info" : "default"}>
                          {customer.orderCount} đơn{customer.paidOrderCount > 0 ? ` (${customer.paidOrderCount} đã TT)` : ""}
                        </ToneTag>
                        {customer.wishlistCount > 0 ? (
                          <ToneTag tone="default">{customer.wishlistCount} yêu thích</ToneTag>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <strong className={`antPrice ${customer.lifetimeValue > 0 ? "greenText" : ""}`}>
                        {formatPrice(customer.lifetimeValue)}
                      </strong>
                    </td>
                    <td>
                      {customer.lastOrderAt ? (
                        <span className="antSubDate">
                          {dateFmt.format(new Date(customer.lastOrderAt))}
                        </span>
                      ) : (
                        <span className="antTextMuted">Chưa phát sinh</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="antBtn antBtnDefault antBtnSm"
                      >
                        Hồ sơ 360 <RightOutlined style={{ fontSize: 10 }} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--ant-border)" }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              totalItems={filtered.length}
              pageSize={CUSTOMERS_PER_PAGE}
              itemLabel="khách hàng"
            />
          </div>
        )}
      </div>
    </div>
  );
}
