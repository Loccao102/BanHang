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
import type { OrderStatus } from "@/lib/cart";
import { allowedOrderStatuses } from "@/lib/order-workflow";
import {
  ORDER_FLOW,
  ORDER_STATUS_META,
  orderStatusMeta,
  paymentMethodLabel,
  paymentProviderLabel,
  paymentStatusMeta
} from "@/lib/admin-status";
import { StatusTag } from "@/components/admin/status-tag";

/* eslint-disable @typescript-eslint/no-explicit-any */
const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

export default function AdminOrderDetailPage() {
  const { user, accountLoading } = useStore();
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [draftStatus, setDraftStatus] = useState<OrderStatus>("processing");
  const [draftCarrier, setDraftCarrier] = useState("");
  const [draftTracking, setDraftTracking] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ error: boolean; text: string } | null>(null);

  async function load() {
    const r = await fetch(`/api/orders/${params.id}`, { cache: "no-store" });
    if (!r.ok) {
      setFeedback({ error: true, text: "Không thể tải đơn hàng. Hãy kiểm tra mã đơn và quyền truy cập." });
      return;
    }
    const fetched = (await r.json()).order;
    setOrder(fetched);
    setDraftStatus(fetched.status);
    setDraftCarrier(fetched.shippingCarrier ?? "");
    setDraftTracking(fetched.trackingCode ?? "");
  }

  useEffect(() => {
    if (user?.role === "admin" && params.id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id]);

  if (accountLoading || (user?.role === "admin" && !order && !feedback)) {
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
          <h2>Khu vực quản trị bị hạn chế</h2>
          <p>Yêu cầu tài khoản quản trị để xem chi tiết đơn hàng.</p>
          <Link className="antBtn antBtnPrimary" href={`/login?next=/admin/orders/${params.id ?? ""}`}>
            Đăng nhập quản trị
          </Link>
        </div>
      </section>
    );
  }

  async function saveOperations(collectCod = false) {
    if (!order || saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: collectCod ? order.status : draftStatus,
          shippingCarrier: draftCarrier,
          trackingCode: draftTracking,
          ...(collectCod ? { paymentStatus: "paid" } : {})
        })
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Không thể lưu đơn hàng.");
      await load();
      setFeedback({ error: false, text: collectCod ? "Đã ghi nhận tiền mặt COD." : "Đã lưu thông tin vận hành đơn hàng." });
    } catch (error) {
      setFeedback({ error: true, text: error instanceof Error ? error.message : "Lỗi cập nhật đơn hàng." });
    } finally {
      setSaving(false);
    }
  }

  if (!order) {
    return (
      <div className="antAdminPageContainer">
        <div className="antCard">
          <div className="antEmptyState large">
            <ShoppingOutlined style={{ fontSize: 44, color: "#8c8c8c" }} />
            <h3>Không thể tải đơn hàng</h3>
            <p>{feedback?.text || "Mã đơn hàng không tồn tại hoặc đã bị xóa."}</p>
            <Link className="antBtn antBtnPrimary" href="/admin?tab=orders">
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusMeta = orderStatusMeta(order.status);
  const payMeta = paymentStatusMeta(order.paymentStatus);
  const currentStep = ORDER_FLOW.indexOf(order.status as OrderStatus);
  const isFinal = order.status === "cancelled" || order.status === "completed";
  const needsShippingInfo = draftStatus === "shipping" && (!draftCarrier.trim() || !draftTracking.trim());

  return (
    <div className="antAdminPageContainer">
      {/* Page Header */}
      <div className="antPageHeader">
        <div className="antPageHeaderLeft">
          <div className="antBreadcrumb">
            <Link href="/admin">Trang chủ</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <Link href="/admin?tab=orders">Đơn hàng</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <span className="antBreadcrumbCurrent">#{order.id}</span>
          </div>
          <div className="crmHeroTitleRow">
            <h1 className="antPageTitle">Đơn hàng #{order.id}</h1>
            <StatusTag kind="order" value={order.status} />
            <StatusTag kind="payment" value={order.paymentStatus} />
          </div>
          <p className="antPageSubtitle">
            Đặt lúc{" "}
            {new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeStyle: "short" }).format(new Date(order.createdAt))}
          </p>
        </div>

        <div className="antPageHeaderRight">
          <div className="antHeaderActionGroup">
            <Link className="antBtn antBtnDefault" href="/admin?tab=orders">
              <ArrowLeftOutlined /> Danh sách đơn
            </Link>
            <Link className="antBtn antBtnDefault" href="/admin/fulfillment">
              <CarOutlined /> Vận hành & giao nhận
            </Link>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">Tổng giá trị đơn</span>
            <div className="antStatIconWrap green"><DollarCircleOutlined /></div>
          </div>
          <div className="antStatValue greenText">{formatPrice(order.total)}</div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">{paymentMethodLabel(order.payment)}</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">Trạng thái đơn</span>
            <div className="antStatIconWrap blue"><ShoppingOutlined /></div>
          </div>
          <div className={`antStatValue antStatValueText tone-${statusMeta.tone}`}>{statusMeta.label}</div>
          <div className="antStatFooter"><span>{statusMeta.hint}</span></div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">Trạng thái thanh toán</span>
            <div className="antStatIconWrap purple"><CreditCardOutlined /></div>
          </div>
          <div className={`antStatValue antStatValueText tone-${payMeta.tone}`}>{payMeta.label}</div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">
              Cổng: {paymentProviderLabel(order.paymentProvider || order.payment)}
            </span>
            {order.paidAt ? <span>{dateTimeFmt.format(new Date(order.paidAt))}</span> : null}
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">Đơn vị vận chuyển</span>
            <div className="antStatIconWrap orange"><CarOutlined /></div>
          </div>
          <div className="antStatValue antStatValueText">
            {order.shippingCarrier || <span className="crmMuted">Chưa bàn giao</span>}
          </div>
          <div className="antStatFooter">
            {order.trackingCode ? (
              <span className="antTag antTagInfo">Mã vận đơn: {order.trackingCode}</span>
            ) : (
              <span>Chưa có mã vận đơn</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      <div className="antCard">
        <div className="antCardBody">
          {order.status === "cancelled" ? (
            <div className="orderCancelledBanner">
              <CloseCircleOutlined /> Đơn hàng đã bị hủy — không thể tiếp tục xử lý.
            </div>
          ) : (
            <ol className="orderStepper">
              {ORDER_FLOW.map((step, index) => {
                const state = index < currentStep ? "done" : index === currentStep ? (step === "completed" ? "done" : "current") : "todo";
                return (
                  <li key={step} className={`orderStep ${state}`}>
                    <span className="orderStepDot">
                      {state === "done" ? <CheckCircleOutlined /> : index + 1}
                    </span>
                    <div className="orderStepText">
                      <strong>{ORDER_STATUS_META[step].label}</strong>
                      <small>{ORDER_STATUS_META[step].hint}</small>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {/* Fulfillment operations with server-side transition and payment guards */}
      <div className="antCard">
        <div className="antCardHead">
          <div>
            <div className="antCardEyebrow">Điều phối đơn hàng</div>
            <h2 className="antCardTitle">Xử lý đơn và vận chuyển</h2>
          </div>
          {isFinal ? <span className="antTag antTagDefault">Đơn đã đóng</span> : null}
        </div>
        <div className="antCardBody">
          <div className="antFormGrid">
            <label className="antFormField">
              <span className="antFormLabel">Chuyển trạng thái</span>
              <select className="antInput" value={draftStatus} disabled={isFinal}
                onChange={(event) => setDraftStatus(event.target.value as OrderStatus)}>
                {allowedOrderStatuses(order.status as OrderStatus).map((status) => (
                  <option key={status} value={status}>
                    {status === order.status ? `${ORDER_STATUS_META[status].label} (hiện tại)` : `→ ${ORDER_STATUS_META[status].label}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="antFormField">
              <span className="antFormLabel">Hãng vận chuyển</span>
              <input className="antInput" value={draftCarrier} disabled={isFinal}
                onChange={(event) => setDraftCarrier(event.target.value)}
                placeholder="GHN, GHTK, Viettel Post..." />
            </label>
            <label className="antFormField">
              <span className="antFormLabel">Mã vận đơn</span>
              <input className="antInput" value={draftTracking} disabled={isFinal}
                onChange={(event) => setDraftTracking(event.target.value)}
                placeholder="Mã theo dõi lô hàng" />
            </label>
          </div>

          <div className={`antInlineAlert ${needsShippingInfo ? "warning" : "info"}`}>
            {needsShippingInfo
              ? "Cần nhập hãng vận chuyển và mã vận đơn trước khi chuyển sang “Đang giao hàng”."
              : "Chỉ chuyển sang Đang giao khi đã có hãng vận chuyển và mã vận đơn. Thanh toán QR được xác nhận tự động qua giao dịch, không xác nhận thủ công."}
          </div>

          {feedback && (
            <div role="status" className={`antInlineAlert ${feedback.error ? "error" : "success"}`}>
              {feedback.text}
            </div>
          )}

          <div className="antHeaderActionGroup" style={{ marginTop: 16, flexWrap: "wrap" }}>
            <button type="button" className="antBtn antBtnPrimary"
              disabled={saving || isFinal || needsShippingInfo}
              onClick={() => void saveOperations()}>
              {saving ? "Đang lưu..." : "Lưu xử lý đơn"}
            </button>
            {order.payment === "cod" && order.status === "completed" && order.paymentStatus !== "paid" && (
              <button type="button" className="antBtn antBtnSuccess" disabled={saving}
                onClick={() => void saveOperations(true)}>
                <CheckCircleOutlined /> Ghi nhận đã thu COD
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Customer & Payment */}
      <div className="antTwoColGrid">
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">Thông tin giao hàng</div>
              <h2 className="antCardTitle">Người nhận hàng</h2>
            </div>
            <UserOutlined style={{ fontSize: 18, color: "#1677ff" }} />
          </div>
          <div className="antCardBody">
            <dl className="antDescList">
              <div><dt>Họ và tên</dt><dd>{order.customerName}</dd></div>
              <div><dt>Số điện thoại</dt><dd>{order.phone}</dd></div>
              <div><dt>Địa chỉ</dt><dd>{order.address}, {order.city}</dd></div>
              {order.note ? <div><dt>Ghi chú</dt><dd>{order.note}</dd></div> : null}
            </dl>
          </div>
        </div>

        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">Hóa đơn & thanh toán</div>
              <h2 className="antCardTitle">Chi tiết thanh toán</h2>
            </div>
            <DollarCircleOutlined style={{ fontSize: 18, color: "#52c41a" }} />
          </div>
          <div className="antCardBody">
            <dl className="antDescList money">
              <div><dt>Tạm tính hàng hóa</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              <div><dt>Phí vận chuyển</dt><dd>{order.shipping ? formatPrice(order.shipping) : "Miễn phí"}</dd></div>
              {order.discount > 0 && (
                <div>
                  <dt>Giảm giá{order.couponCode ? <> · <span className="antTag antTagInfo">{order.couponCode}</span></> : null}</dt>
                  <dd style={{ color: "#cf1322" }}>-{formatPrice(order.discount)}</dd>
                </div>
              )}
              <div className="total"><dt>Tổng thanh toán</dt><dd>{formatPrice(order.total)}</dd></div>
            </dl>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="antCard">
        <div className="antCardHead">
          <div>
            <div className="antCardEyebrow">Danh sách mặt hàng</div>
            <h2 className="antCardTitle">
              Sản phẩm trong đơn <span className="antCountTag">{order.items.length}</span>
            </h2>
          </div>
        </div>

        <div className="antTableContainer">
          <table className="antTable">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Size</th>
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
                    {x.productColor ? <small className="antSubDate">Màu: {x.productColor}</small> : null}
                  </td>
                  <td><span className="antTag antTagDefault">{x.size || "Free size"}</span></td>
                  <td><strong>× {x.quantity}</strong></td>
                  <td>{formatPrice(x.productPrice)}</td>
                  <td style={{ textAlign: "right" }}>
                    <strong className="antPrice">{formatPrice(x.productPrice * x.quantity)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Transactions Log */}
      <div className="antCard">
        <div className="antCardHead">
          <div>
            <div className="antCardEyebrow">Nhật ký giao dịch</div>
            <h2 className="antCardTitle">Giao dịch từ cổng thanh toán</h2>
          </div>
        </div>

        <div className="antCardBody">
          {order.paymentTransactions?.length ? (
            <div className="antRankList">
              {order.paymentTransactions.map((tx: any) => (
                <div key={tx.id} className="antRankItem">
                  <div className="antRankInfo">
                    <strong className="antRankName">
                      {paymentProviderLabel(tx.gateway || tx.provider)} · Mã GD: {tx.providerTransactionId}
                    </strong>
                    <span className="antRankRev">
                      {dateTimeFmt.format(new Date(tx.receivedAt))}
                      {" · "}Nội dung: {tx.referenceCode || "—"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong className="antPrice greenText">{formatPrice(tx.amount)}</strong>
                    <div style={{ marginTop: 4 }}>
                      <span className={`antTag ${tx.matched ? "antTagSuccess" : "antTagWarning"}`}>
                        {tx.matched ? "Khớp đơn thành công" : tx.failureReason || "Chưa khớp đơn"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="antEmptyState">
              <CreditCardOutlined style={{ fontSize: 28, color: "#bfbfbf" }} />
              <p>
                {order.payment === "cod"
                  ? "Đơn COD — tiền được ghi nhận khi giao hàng thành công."
                  : "Chưa nhận được giao dịch tự động nào cho đơn này."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
