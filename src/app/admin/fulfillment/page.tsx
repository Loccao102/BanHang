"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { allowedOrderStatuses } from "@/lib/order-workflow";
import {
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  InboxOutlined,
  SearchOutlined,
  ShoppingOutlined,
  SyncOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import type { OrderStatus } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { ORDER_STATUS_META, paymentMethodLabel } from "@/lib/admin-status";
import { StatusTag } from "@/components/admin/status-tag";

type FulfillFilter = "all" | "pending_dispatch" | "shipping" | "completed" | "cancelled";

export default function FulfillmentPage() {
  const { user, accountLoading, orders, updateOrderStatus } = useStore();
  const [shippingDrafts, setShippingDrafts] = useState<Record<string, { carrier: string; tracking: string }>>({});
  const [filter, setFilter] = useState<FulfillFilter>("all");
  const [query, setQuery] = useState("");

  function draft(order: (typeof orders)[number]) {
    return shippingDrafts[order.id] || {
      carrier: order.shippingCarrier ?? "",
      tracking: order.trackingCode ?? ""
    };
  }

  function updateDraft(id: string, key: "carrier" | "tracking", value: string, order: (typeof orders)[number]) {
    setShippingDrafts((previous) => ({
      ...previous,
      [id]: { ...draft(order), ...previous[id], [key]: value }
    }));
  }

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchFilter =
        filter === "all" ||
        (filter === "pending_dispatch" && (order.status === "processing" || order.status === "confirmed")) ||
        (filter === "shipping" && order.status === "shipping") ||
        (filter === "completed" && order.status === "completed") ||
        (filter === "cancelled" && order.status === "cancelled");
      const matchQuery =
        !q ||
        `${order.id} ${order.customer.name} ${order.customer.phone} ${order.customer.city} ${order.trackingCode ?? ""} ${order.shippingCarrier ?? ""}`
          .toLowerCase()
          .includes(q);
      return matchFilter && matchQuery;
    });
  }, [orders, filter, query]);

  if (accountLoading) {
    return (
      <div className="antLoadingState">
        <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
        <p>Đang tải dữ liệu vận hành đơn hàng...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực Quản trị Bị Hạn chế</h2>
          <p>Yêu cầu tài khoản quản trị để điều phối giao hàng và thanh toán.</p>
          <Link className="antBtn antBtnPrimary" href="/login?next=/admin/fulfillment">
            Đăng nhập Quản trị
          </Link>
        </div>
      </section>
    );
  }

  const dispatchCount = orders.filter((o) => o.status === "processing" || o.status === "confirmed").length;
  const shippingCount = orders.filter((o) => o.status === "shipping").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const paidCount = orders.filter((o) => o.paymentStatus === "paid").length;

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
            <span className="antBreadcrumbCurrent">Vận hành Đơn & Fulfillment</span>
          </div>
          <h1 className="antPageTitle">Điều phối Giao hàng & Thanh toán</h1>
          <p className="antPageSubtitle">
            Cập nhật trạng thái xử lý đơn hàng, theo dõi đơn vị vận chuyển (GHN, GHTK, Viettel Post) và mã vận đơn tracking.
          </p>
        </div>

        <div className="antPageHeaderRight">
          <Link className="antBtn antBtnDefault" href="/admin?tab=orders">
            Quản lý đơn hàng
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">ĐƠN CẦN ĐIỀU PHỐI</span>
            <div className="antStatIconWrap blue">
              <ShoppingOutlined />
            </div>
          </div>
          <div className="antStatValue">{dispatchCount}</div>
          <div className="antStatFooter">
            <span className="antTag antTagProcessing">
              <SyncOutlined spin={dispatchCount > 0} /> Đang xử lý & Đã xác nhận
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">ĐANG TRÊN ĐƯỜNG GIAO</span>
            <div className="antStatIconWrap orange">
              <CarOutlined />
            </div>
          </div>
          <div className="antStatValue">{shippingCount}</div>
          <div className="antStatFooter">
            <span className="antTag antTagWarning">Đã bàn giao đơn vị vận chuyển</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">ĐÃ THU TIỀN THÀNH CÔNG</span>
            <div className="antStatIconWrap green">
              <DollarCircleOutlined />
            </div>
          </div>
          <div className="antStatValue">{paidCount}</div>
          <div className="antStatFooter">
            <span className="antTag antTagSuccess">
              <CheckCircleOutlined /> Đã khớp thanh toán
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">GIAO THÀNH CÔNG (HOÀN TẤT)</span>
            <div className="antStatIconWrap cyan">
              <InboxOutlined />
            </div>
          </div>
          <div className="antStatValue">{completedCount}</div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">Tổng đơn hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Fulfillment Operations Card */}
      <div className="antCard">
        <div className="antCardHead antToolbar">
          <div className="antToolbarLeft">
            <div>
              <div className="antCardEyebrow">DANH SÁCH ĐIỀU PHỐI</div>
              <h2 className="antCardTitle">
                Xử lý vận chuyển đơn hàng{" "}
                <span className="antCountTag">{filteredOrders.length}/{orders.length}</span>
              </h2>
            </div>
          </div>
          <div className="antToolbarRight">
            <div className="antSearchInput">
              <SearchOutlined className="antSearchIcon" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mã đơn, tên khách, SĐT, vận đơn..."
              />
            </div>
            <select
              className="antSelect"
              aria-label="Lọc trạng thái điều phối"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FulfillFilter)}
            >
              <option value="all">Tất cả đơn ({orders.length})</option>
              <option value="pending_dispatch">Cần điều phối ({dispatchCount})</option>
              <option value="shipping">Đang giao hàng ({shippingCount})</option>
              <option value="completed">Đã hoàn tất ({completedCount})</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        <div className="antCardBody">
          {filteredOrders.length ? (
            <div className="antFulfillmentList">
              {filteredOrders.map((order) => {
                const isFinal = order.status === "cancelled" || order.status === "completed";
                const itemCount = order.items.reduce((sum, line) => sum + line.quantity, 0);
                return (
                  <div key={order.id} className="antFulfillmentRow">
                    <div className="antFulfillColInfo">
                      <div className="antFulfillIdRow">
                        <Link href={`/admin/orders/${order.id}`} className="antOrderId">
                          #{order.id}
                        </Link>
                        <StatusTag kind="order" value={order.status} />
                      </div>
                      <strong className="antCustomerName">{order.customer.name}</strong>
                      <span className="antSubPhone">
                        {order.customer.phone} · {order.customer.city}
                      </span>
                      <div className="antFulfillPriceRow">
                        <strong className="antPrice greenText">{formatPrice(order.total)}</strong>
                        <span className="antTag antTagDefault">{itemCount} sản phẩm</span>
                      </div>
                    </div>

                    <div className="antFulfillColField">
                      <label className="antFulfillLabel">Chuyển trạng thái đơn</label>
                      <select
                        className={`antSelectStatus tone-${ORDER_STATUS_META[order.status]?.tone ?? "default"}`}
                        value={order.status}
                        disabled={isFinal}
                        onChange={(event) =>
                          updateOrderStatus(order.id, event.target.value as OrderStatus, {
                            shippingCarrier: draft(order).carrier,
                            trackingCode: draft(order).tracking
                          })
                        }
                      >
                        {allowedOrderStatuses(order.status).map((val) => (
                          <option value={val} key={val}>
                            {ORDER_STATUS_META[val].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="antFulfillColField">
                      <label className="antFulfillLabel">Trạng thái thanh toán</label>
                      <div className="antTagWrap">
                        <StatusTag kind="payment" value={order.paymentStatus} />
                      </div>
                      <small className="antSubDate">{paymentMethodLabel(order.payment)}</small>
                      {order.payment === "cod" && order.status === "completed" && order.paymentStatus !== "paid" && (
                        <button
                          type="button"
                          className="antBtn antBtnSuccess antBtnSm"
                          style={{ marginTop: 4 }}
                          onClick={() => updateOrderStatus(order.id, order.status, { paymentStatus: "paid" })}
                        >
                          <CheckCircleOutlined /> Đã thu tiền COD
                        </button>
                      )}
                    </div>

                    <div className="antFulfillColField">
                      <label className="antFulfillLabel">Hãng vận chuyển</label>
                      <input
                        className="antInput"
                        value={draft(order).carrier}
                        disabled={isFinal}
                        placeholder="GHN, GHTK, Viettel Post..."
                        onChange={(event) => updateDraft(order.id, "carrier", event.target.value, order)}
                      />
                    </div>

                    <div className="antFulfillColField">
                      <label className="antFulfillLabel">Mã vận đơn (Tracking)</label>
                      <input
                        className="antInput"
                        value={draft(order).tracking}
                        disabled={isFinal}
                        placeholder="Nhập mã vận đơn"
                        onChange={(event) => updateDraft(order.id, "tracking", event.target.value, order)}
                      />
                    </div>

                    <div className="antFulfillColAction">
                      <button
                        type="button"
                        className="antBtn antBtnPrimary antBtnSm"
                        disabled={isFinal}
                        onClick={() =>
                          updateOrderStatus(order.id, order.status, {
                            shippingCarrier: draft(order).carrier,
                            trackingCode: draft(order).tracking
                          })
                        }
                      >
                        Lưu vận chuyển
                      </button>
                      <Link href={`/admin/orders/${order.id}`} className="antBtn antBtnDefault antBtnSm">
                        Chi tiết đơn
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="antEmptyState large">
              <CarOutlined style={{ fontSize: 40, color: "#bfbfbf" }} />
              <h3>Không có đơn hàng phù hợp</h3>
              <p>Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
