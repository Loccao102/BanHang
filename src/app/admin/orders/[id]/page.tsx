"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeftOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  DollarCircleOutlined,
  ShoppingOutlined,
  SyncOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

export default function AdminOrderDetailPage() {
  const { user, accountLoading } = useStore();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);

  async function load() {
    const r = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
    if (r.ok) setOrder((await r.json()).order);
  }

  useEffect(() => {
    if (user?.role === "admin" && params.id) void load();
  }, [user, params.id]);

  if (accountLoading || (user?.role === "admin" && !order)) {
    return (
      <div className="antLoadingState">
        <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
        <p>Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực Quản trị Bị Hạn chế</h2>
          <p>Yêu cầu tài khoản quản trị để xem chi tiết đơn hàng.</p>
          <Link className="antBtn antBtnPrimary" href="/login?next=/admin">
            Đăng nhập Quản trị
          </Link>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <div className="antAdminPageContainer">
        <div className="antCard">
          <div className="antEmptyState">
            <ShoppingOutlined style={{ fontSize: 44, color: "#8c8c8c" }} />
            <h3>Không tìm thấy đơn hàng</h3>
            <p>Mã đơn hàng không tồn tại hoặc đã bị xóa.</p>
            <Link className="antBtn antBtnPrimary" href="/admin?tab=orders">
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="antAdminPageContainer">
      {/* Ant Design Page Header */}
      <div className="antPageHeader">
        <div className="antPageHeaderLeft">
          <div className="antBreadcrumb">
            <Link href="/admin">Trang chủ</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <Link href="/admin?tab=orders">Quản lý Đơn hàng</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <span className="antBreadcrumbCurrent">Chi tiết #{order.id}</span>
          </div>
          <h1 className="antPageTitle">Đơn hàng #{order.id}</h1>
          <p className="antPageSubtitle">
            Đặt ngày{" "}
            {new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "full",
              timeStyle: "short"
            }).format(new Date(order.createdAt))}
          </p>
        </div>

        <div className="antPageHeaderRight">
          <div className="antHeaderActionGroup">
            <Link className="antBtn antBtnDefault" href="/admin/fulfillment">
              <ArrowLeftOutlined /> Quay lại Vận hành đơn
            </Link>
          </div>
        </div>
      </div>

      {/* Ant Design Stat Cards Grid */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">TỔNG GIÁ TRỊ ĐƠN</span>
            <div className="antStatIconWrap green">
              <DollarCircleOutlined />
            </div>
          </div>
          <div className="antStatValue greenText">{formatPrice(order.total)}</div>
          <div className="antStatFooter">
            <span className="antTag antTagSuccess">
              {order.payment === "qr" ? "QR Chuyển khoản" : "Thanh toán COD"}
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">TRẠNG THÁI ĐƠN</span>
            <div className="antStatIconWrap blue">
              <ShoppingOutlined />
            </div>
          </div>
          <div className="antStatValue" style={{ textTransform: "capitalize" }}>
            {order.status}
          </div>
          <div className="antStatFooter">
            <span className="antTag antTagInfo">Quy trình xử lý</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">TRẠNG THÁI THANH TOÁN</span>
            <div className="antStatIconWrap purple">
              <CreditCardOutlined />
            </div>
          </div>
          <div className="antStatValue" style={{ textTransform: "capitalize" }}>
            {order.paymentStatus}
          </div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">
              Cổng: {order.paymentProvider || order.payment}
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">ĐƠN VỊ VẬN CHUYỂN</span>
            <div className="antStatIconWrap orange">
              <CarOutlined />
            </div>
          </div>
          <div className="antStatValue">{order.shippingCarrier || "—"}</div>
          <div className="antStatFooter">
            <span className="antTag antTagWarning">
              Mã: {order.trackingCode || "Chưa có tracking"}
            </span>
          </div>
        </div>
      </div>

      {/* Customer & Payment 2-Col Grid */}
      <div className="antTwoColGrid">
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">THÔNG TIN GIAO HÀNG</div>
              <h2 className="antCardTitle">Người nhận hàng</h2>
            </div>
            <UserOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          </div>
          <div className="antCardBody">
            <div className="antCustomerDetailBlock">
              <p><strong>Họ và tên:</strong> {order.customerName}</p>
              <p><strong>Số điện thoại:</strong> {order.phone}</p>
              <p><strong>Địa chỉ nhận:</strong> {order.address}, {order.city}</p>
              {order.note && <p><strong>Ghi chú:</strong> {order.note}</p>}
            </div>
          </div>
        </div>

        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">HÓA ĐƠN & THANH TOÁN</div>
              <h2 className="antCardTitle">Chi tiết thanh toán</h2>
            </div>
            <DollarCircleOutlined style={{ fontSize: 20, color: "#52c41a" }} />
          </div>
          <div className="antCardBody">
            <div className="antCustomerDetailBlock">
              <p>Tạm tính hàng hóa: <strong>{formatPrice(order.subtotal)}</strong></p>
              <p>Phí vận chuyển: <strong>{formatPrice(order.shipping)}</strong></p>
              {order.discount > 0 && (
                <p>Khuyến mãi / Giảm giá: <strong style={{ color: "#cf1322" }}>-{formatPrice(order.discount)}</strong></p>
              )}
              {order.couponCode && (
                <p>Mã voucher đã áp dụng: <span className="antTag antTagInfo">{order.couponCode}</span></p>
              )}
              <hr style={{ border: 0, borderTop: "1px solid #f0f0f0", margin: "12px 0" }} />
              <p style={{ fontSize: 16 }}>
                <strong>Tổng thanh toán:</strong>{" "}
                <strong className="greenText" style={{ fontSize: 20 }}>
                  {formatPrice(order.total)}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="antCard" style={{ marginTop: 24 }}>
        <div className="antCardHead">
          <div>
            <div className="antCardEyebrow">DANH SÁCH MẶT HÀNG</div>
            <h2 className="antCardTitle">
              Sản phẩm trong đơn ({order.items.length})
            </h2>
          </div>
        </div>

        <div className="antTableContainer">
          <table className="antTable">
            <thead>
              <tr>
                <th>Tên sản phẩm</th>
                <th>Phân loại Size</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th style={{ textAlign: "right" }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((x: any) => (
                <tr key={x.id}>
                  <td>
                    <strong>{x.productName}</strong>
                    <small className="antSubDate">{x.productColor}</small>
                  </td>
                  <td>
                    <span className="antTag antTagDefault">{x.size || "Free"}</span>
                  </td>
                  <td><strong>{x.quantity}</strong></td>
                  <td>{formatPrice(x.productPrice)}</td>
                  <td style={{ textAlign: "right" }}>
                    <strong className="antPrice greenText">
                      {formatPrice(x.productPrice * x.quantity)}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Transactions Log */}
      <div className="antCard" style={{ marginTop: 24 }}>
        <div className="antCardHead">
          <div>
            <div className="antCardEyebrow">LOG GIAO DỊCH</div>
            <h2 className="antCardTitle">Nhật ký giao dịch cổng thanh toán</h2>
          </div>
        </div>

        <div className="antCardBody">
          {order.paymentTransactions?.length ? (
            <div className="antRankList">
              {order.paymentTransactions.map((tx: any) => (
                <div key={tx.id} className="antRankItem">
                  <div className="antRankInfo">
                    <strong className="antRankName">
                      {tx.gateway || tx.provider} · Mã GD: {tx.providerTransactionId}
                    </strong>
                    <span className="antRankRev">
                      {new Intl.DateTimeFormat("vi-VN", {
                        dateStyle: "medium",
                        timeStyle: "short"
                      }).format(new Date(tx.receivedAt))}
                      {" · "}Ref: {tx.referenceCode || "None"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong className="antPrice greenText">{formatPrice(tx.amount)}</strong>
                    <div style={{ marginTop: 4 }}>
                      <span className={`antTag ${tx.matched ? "antTagSuccess" : "antTagWarning"}`}>
                        {tx.matched ? "Khớp thành công" : tx.failureReason || "Chưa khớp"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="antEmptyState">
              <p>Chưa có log giao dịch tự động nào được ghi nhận cho đơn này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
