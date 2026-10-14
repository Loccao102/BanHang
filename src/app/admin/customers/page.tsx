"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  HeartOutlined,
  RightOutlined,
  SearchOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

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

export default function AdminCustomersPage() {
  const { user, accountLoading } = useStore();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [segment, setSegment] = useState<"all" | "purchased" | "no-orders" | "no-payment">("all");
  const [sort, setSort] = useState<"recent" | "ltv" | "orders">("recent");

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
  }, [user?.role]);

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
            <span className="antBreadcrumbCurrent">Quản lý Khách hàng CRM</span>
          </div>
          <h1 className="antPageTitle">Hồ sơ & Dữ liệu Khách hàng</h1>
          <p className="antPageSubtitle">
            Theo dõi hành vi mua sắm, giá trị vòng đời (LTV) và danh sách tài khoản đã đăng ký trong hệ sinh thái LSOUL.
          </p>
        </div>

        <div className="antPageHeaderRight">
          <div className="antHeaderActionGroup">
            <Link className="antBtn antBtnDefault" href="/admin/marketing">
              Quản lý Mã giảm giá & Social
            </Link>
          </div>
        </div>
      </div>

      {/* Ant Design Stat Cards Grid */}
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
              <CheckCircleOutlined /> Tài khoản đã đăng ký
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
            <span className="antTag antTagInfo">Đơn từ thành viên đã đăng nhập</span>
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

      {error && <p role="alert" style={{ color: "#cf1322", margin: "0 0 16px" }}>{error}</p>}

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
              <option value="all">Tất cả khách</option>
              <option value="purchased">Đã thanh toán</option>
              <option value="no-payment">Có đơn, chưa thanh toán</option>
              <option value="no-orders">Chưa đặt đơn</option>
            </select>
            <select className="antSelect" value={sort} aria-label="Sắp xếp khách"
              onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="recent">Mới đăng ký</option>
              <option value="ltv">Chi tiêu cao nhất</option>
              <option value="orders">Nhiều đơn nhất</option>
            </select>
            <button type="button" className="antBtn antBtnDefault" disabled={loading}
              onClick={() => void loadCustomers()}>
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </div>

        <div className="antTableContainer">
          <table className="antTable">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Thông tin liên hệ</th>
                <th>Số đơn đặt</th>
                <th>Mục yêu thích</th>
                <th>Tổng chi tiêu (LTV)</th>
                <th>Lần thanh toán gần nhất</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24 }}>
                  Không có khách hàng phù hợp với bộ lọc.
                </td></tr>
              )}
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="antCustomerCell">
                      <div className="antAvatar small">
                        <UserOutlined />
                      </div>
                      <div className="antCustomerMeta">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="antCustomerName"
                        >
                          {customer.name}
                        </Link>
                        <small className="antSubDate">
                          Tham gia{" "}
                          {new Intl.DateTimeFormat("vi-VN", {
                            dateStyle: "medium"
                          }).format(new Date(customer.createdAt))}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="antCustomerEmail">{customer.email}</span>
                    <small className="antCustomerPhone">
                      {customer.phone || "Chưa cập nhật SĐT"}
                    </small>
                  </td>
                  <td>
                    <span className="antTag antTagInfo">
                      {customer.orderCount} đơn
                    </span>
                  </td>
                  <td>
                    <span className="antTag antTagDefault">
                      {customer.wishlistCount} mục
                    </span>
                  </td>
                  <td>
                    <strong className="antPrice greenText">
                      {formatPrice(customer.lifetimeValue)}
                    </strong>
                  </td>
                  <td>
                    {customer.lastOrderAt ? (
                      <span className="antSubDate">
                        {new Intl.DateTimeFormat("vi-VN", {
                          dateStyle: "medium"
                        }).format(new Date(customer.lastOrderAt))}
                      </span>
                    ) : (
                      <span className="antTextMuted">—</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
