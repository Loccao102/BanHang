"use client";

import Link from "next/link";
import { useState } from "react";
import { allowedOrderStatuses } from "@/lib/order-workflow";
import {
  ArrowLeftOutlined,
  BarcodeOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  InboxOutlined,
  ShoppingOutlined,
  SyncOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import type { OrderStatus, PaymentStatus } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

const statuses: { value: OrderStatus; label: string }[] = [
  { value: "processing", label: "Đang xử lý" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipping", label: "Đang giao hàng" },
  { value: "completed", label: "Hoàn tất đơn" },
  { value: "cancelled", label: "Đã hủy đơn" }
];

const payments: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Chờ thanh toán" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "cod_pending", label: "COD chờ thu tiền" },
  { value: "failed", label: "Thanh toán lỗi" },
  { value: "refunded", label: "Đã hoàn tiền" }
];

export default function FulfillmentPage() {
  const { user, accountLoading, orders, updateOrderStatus } = useStore();
  const [shippingDrafts, setShippingDrafts] = useState<Record<string, { carrier: string; tracking: string }>>({});
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

  const shippingCount = orders.filter((o) => o.status === "shipping").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const paidCount = orders.filter((o) => o.paymentStatus === "paid").length;

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

      {/* Ant Design Stat Cards Grid */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">ĐƠN CHỜ ĐIỀU PHỐI</span>
            <div className="antStatIconWrap blue">
              <ShoppingOutlined />
            </div>
          </div>
          <div className="antStatValue">{processingCount}</div>
          <div className="antStatFooter">
            <span className="antTag antTagProcessing">
              <SyncOutlined spin /> Cần đóng gói & xác nhận
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
        <div className="antCardHead">
          <div>
            <div className="antCardEyebrow">DANH SÁCH ĐIỀU PHỐI</div>
            <h2 className="antCardTitle">
              Xử lý vận chuyển đơn hàng{" "}
              <span className="antCountTag">{orders.length}</span>
            </h2>
          </div>
          <CarOutlined style={{ fontSize: 20, color: "#1677ff" }} />
        </div>

        <div className="antCardBody">
          <div className="antFulfillmentList">
            {orders.map((order) => (
              <div key={order.id} className="antFulfillmentRow">
                <div className="antFulfillColInfo">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="antOrderId"
                  >
                    #{order.id}
                  </Link>
                  <strong className="antCustomerName">
                    {order.customer.name}
                  </strong>
                  <span className="antSubPhone">
                    {order.customer.phone} · {order.customer.city}
                  </span>
                  <strong className="antPrice greenText" style={{ marginTop: 4 }}>
                    {formatPrice(order.total)}
                  </strong>
                </div>

                <div className="antFulfillColField">
                  <label className="antFulfillLabel">Trạng thái giao nhận</label>
                  <select
                    className="antInput"
                    value={order.status}
                    onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus, {
                      shippingCarrier: draft(order).carrier,
                      trackingCode: draft(order).tracking
                    })}
                  >
                    {statuses.filter((item) => allowedOrderStatuses(order.status).includes(item.value)).map((item) => (
                      <option value={item.value} key={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="antFulfillColField">
                  <label className="antFulfillLabel">Thanh toán</label>
                  <span className={`antTag ${order.paymentStatus === "paid" ? "antTagSuccess" : "antTagWarning"}`}>
                    {payments.find((item) => item.value === order.paymentStatus)?.label || order.paymentStatus}
                  </span>
                  {order.payment === "cod" && order.status === "completed" && order.paymentStatus !== "paid" && (
                    <button type="button" className="antBtn antBtnDefault antBtnSm"
                      onClick={() => updateOrderStatus(order.id, order.status, { paymentStatus: "paid" })}>
                      Ghi nhận đã thu COD
                    </button>
                  )}
                </div>

                <div className="antFulfillColField">
                  <label className="antFulfillLabel">Hãng vận chuyển</label>
                  <input
                    className="antInput"
                    value={draft(order).carrier}
                    placeholder="GHN, GHTK, Viettel Post..."
                    onChange={(event) => updateDraft(order.id, "carrier", event.target.value, order)}
                  />
                </div>

                <div className="antFulfillColField">
                  <label className="antFulfillLabel">Mã vận đơn (Tracking)</label>
                  <input
                    className="antInput"
                    value={draft(order).tracking}
                    placeholder="Nhập mã vận đơn"
                    onChange={(event) => updateDraft(order.id, "tracking", event.target.value, order)}
                  />
                </div>

                <div className="antFulfillColAction">
                  <span className="antTag antTagInfo">
                    {order.items.reduce((sum, line) => sum + line.quantity, 0)} món
                  </span>
                  <button type="button" className="antBtn antBtnPrimary antBtnSm"
                    onClick={() => updateOrderStatus(order.id, order.status, {
                      shippingCarrier: draft(order).carrier,
                      trackingCode: draft(order).tracking
                    })}>
                    Lưu vận chuyển
                  </button>
                  <Link href={`/admin/orders/${order.id}`} className="antBtn antBtnDefault antBtnSm">Chi tiết</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
