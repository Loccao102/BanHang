"use client";

import Link from "next/link";
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
                    onChange={(event) =>
                      updateOrderStatus(order.id, event.target.value as OrderStatus)
                    }
                  >
                    {statuses.map((item) => (
                      <option value={item.value} key={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="antFulfillColField">
                  <label className="antFulfillLabel">Trạng thái thanh toán</label>
                  <select
                    className="antInput"
                    value={
                      order.paymentStatus ??
                      (order.payment === "cod" ? "cod_pending" : "pending")
                    }
                    onChange={(event) =>
                      updateOrderStatus(order.id, order.status, {
                        paymentStatus: event.target.value as PaymentStatus
                      })
                    }
                  >
                    {payments.map((item) => (
                      <option value={item.value} key={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="antFulfillColField">
                  <label className="antFulfillLabel">Hãng vận chuyển</label>
                  <input
                    className="antInput"
                    defaultValue={order.shippingCarrier ?? ""}
                    placeholder="GHN, GHTK, Viettel Post..."
                    onBlur={(event) =>
                      updateOrderStatus(order.id, order.status, {
                        shippingCarrier: event.target.value,
                        trackingCode: order.trackingCode
                      })
                    }
                  />
                </div>

                <div className="antFulfillColField">
                  <label className="antFulfillLabel">Mã vận đơn (Tracking)</label>
                  <input
                    className="antInput"
                    defaultValue={order.trackingCode ?? ""}
                    placeholder="Nhập mã vận đơn"
                    onBlur={(event) =>
                      updateOrderStatus(order.id, order.status, {
                        shippingCarrier: order.shippingCarrier,
                        trackingCode: event.target.value
                      })
                    }
                  />
                </div>

                <div className="antFulfillColAction">
                  <span className="antTag antTagInfo">
                    {order.items.reduce((sum, line) => sum + line.quantity, 0)} món
                  </span>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="antBtn antBtnDefault antBtnSm"
                  >
                    Chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
