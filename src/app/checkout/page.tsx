"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  QrCode,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tag,
  UserRound
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useStore } from "@/components/store-provider";
import { OrderTracker } from "@/components/order-tracker";
import { calculateCouponDiscount, type OrderRecord } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

type Shipping = { name: string; phone: string; address: string; city: string; note: string };

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, coupon, applyCoupon, clearCoupon, placeOrder, user, addresses, accountLoading } = useStore();

  const [payment, setPayment] = useState<"qr" | "cod">("qr");
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const [pendingQrOrder, setPendingQrOrder] = useState<OrderRecord | null>(null);
  const [shippingInfo, setShippingInfo] = useState<Shipping>({ name: "", phone: "", address: "", city: "", note: "" });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Voucher state in checkout
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!accountLoading && !user) {
      router.push("/login?next=/checkout");
    }
  }, [accountLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const address = addresses.find((item) => item.isDefault) ?? addresses[0];
    setShippingInfo((current) => ({
      ...current,
      name: address?.recipientName ?? user.name,
      phone: address?.phone ?? user.phone ?? "",
      address: address?.address ?? "",
      city: address?.city ?? ""
    }));
  }, [user, addresses]);

  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discount = calculateCouponDiscount(coupon, subtotal);
  const isTestOrder = subtotal <= 10000 || Boolean(coupon?.code?.startsWith("TEST"));
  const shipping = (subtotal >= 699000 || isTestOrder) ? 0 : 30000;
  const total = Math.max(0, subtotal - discount + shipping);

  const bankId = process.env.NEXT_PUBLIC_BANK_ID ?? "MB";
  const account = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "0123456789";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "LSOUL";

  function change(field: keyof Shipping, value: string) {
    setShippingInfo((current) => ({ ...current, [field]: value }));
  }

  function copyText(text: string, key: string) {
    if (typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  // Handle coupon application in checkout
  async function handleApplyCoupon(event?: React.SyntheticEvent, directCode?: string) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const codeToApply = (directCode ?? couponInput).trim();
    if (!codeToApply) return;

    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const success = await applyCoupon(codeToApply);
      if (success) {
        setCouponMessage({ text: `Đã áp dụng mã ${codeToApply.toUpperCase()} thành công!`, type: "success" });
        setCouponInput("");
      } else {
        setCouponMessage({ text: "Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện áp dụng.", type: "error" });
      }
    } catch {
      setCouponMessage({ text: "Không thể kiểm tra mã ưu đãi.", type: "error" });
    } finally {
      setCouponLoading(false);
    }
  }

  // Check VietQR payment status
  async function checkQrStatus(orderId: string, showIndicator = false) {
    if (showIndicator) setCheckingPayment(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/payment`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json() as { paymentStatus: string; status: string };
        if (data.paymentStatus === "paid") {
          const updated: OrderRecord = {
            ...(pendingQrOrder ?? ({} as OrderRecord)),
            id: orderId,
            paymentStatus: "paid",
            status: "confirmed"
          };
          setPendingQrOrder(null);
          setCompletedOrder(updated);
          return true;
        }
      }
    } catch (err) {
      console.warn("Poll payment status error:", err);
    } finally {
      if (showIndicator) setCheckingPayment(false);
    }
    return false;
  }

  // Simulate payment for local testing
  async function simulatePayment(orderId: string) {
    setSimulating(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json() as { paymentStatus: string };
        if (data.paymentStatus === "paid") {
          const updated: OrderRecord = {
            ...(pendingQrOrder ?? ({} as OrderRecord)),
            id: orderId,
            paymentStatus: "paid",
            status: "confirmed"
          };
          setPendingQrOrder(null);
          setCompletedOrder(updated);
        }
      }
    } catch (err) {
      console.error("Simulate payment failed:", err);
    } finally {
      setSimulating(false);
    }
  }

  // Polling loop when waiting for VietQR
  useEffect(() => {
    if (!pendingQrOrder) return;
    const interval = setInterval(() => {
      void checkQrStatus(pendingQrOrder.id, false);
    }, 2500);

    return () => clearInterval(interval);
  }, [pendingQrOrder?.id]);

  // Submit order form
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    const draft: OrderRecord = {
      id: "",
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal,
      shipping,
      discount,
      total,
      payment,
      status: "processing",
      paymentStatus: payment === "qr" ? "pending" : "cod_pending",
      couponCode: coupon?.code,
      customer: {
        name: shippingInfo.name,
        phone: shippingInfo.phone,
        address: shippingInfo.address,
        city: shippingInfo.city
      }
    };

    try {
      const order = await placeOrder({ ...draft, couponCode: coupon?.code });
      if (payment === "qr") {
        // DO NOT complete immediately for QR. Transition to VietQR waiting room!
        setPendingQrOrder(order);
      } else {
        // COD confirms immediately
        setCompletedOrder(order);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể tạo đơn hàng.");
    } finally {
      setSubmitting(false);
    }
  }

  if (accountLoading) {
    return (
      <div className="emptyState">
        <div>
          <h2>Đang tải thông tin thanh toán...</h2>
          <p>Vui lòng đợi trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="checkoutPage">
        <div className="panel" style={{ textAlign: "center", padding: "64px 24px", maxWidth: 500, margin: "40px auto" }}>
          <div className="authIcon" style={{ margin: "0 auto 16px" }}><UserRound size={32} /></div>
          <p className="eyebrow">YÊU CẦU ĐĂNG NHẬP</p>
          <h2 style={{ marginBottom: 12 }}>Đăng nhập để thanh toán</h2>
          <p style={{ color: "var(--muted)", marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
            Vui lòng đăng nhập vào tài khoản LSOUL của bạn để tiếp tục thanh toán, áp dụng ưu đãi và theo dõi tiến độ đơn hàng.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link className="btn" href="/login?next=/checkout">Đăng nhập ngay</Link>
            <Link className="btn secondary" href="/register?next=/checkout">Tạo tài khoản</Link>
          </div>
        </div>
      </section>
    );
  }

  // --- STATE 1: Completed Order (Confirmed & Paid / COD) ---
  if (completedOrder) {
    return (
      <section className="checkoutPage">
        <div className="panel" style={{ maxWidth: 780, margin: "20px auto 40px" }}>
          <div className="successIcon">
            <Check size={28} />
          </div>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p className="eyebrow">ĐẶT HÀNG THÀNH CÔNG</p>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 34, margin: "6px 0 10px", fontWeight: 400 }}>
              Cảm ơn bạn đã mua sắm tại LSOUL
            </h1>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              Đơn hàng của bạn đã được xác nhận. Bạn có thể theo dõi tiến độ chuẩn bị và vận chuyển ngay bên dưới:
            </p>
          </div>

          {/* Interactive Order Tracker for Client */}
          <OrderTracker order={completedOrder} showItems={true} />

          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <Link className="btn" href="/orders">
              Xem tất cả đơn hàng <ArrowRight size={15} />
            </Link>
            <Link className="btn secondary" href="/shop">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // --- STATE 2: Waiting for VietQR Transfer ---
  if (pendingQrOrder) {
    const qrPaymentUrl = `https://img.vietqr.io/image/${bankId}-${account}-compact2.png?amount=${pendingQrOrder.total}&addInfo=${encodeURIComponent(pendingQrOrder.id)}&accountName=${encodeURIComponent(accountName)}`;

    return (
      <section className="checkoutPage">
        <div className="qrWaitingSection">
          <p className="eyebrow">VIETQR PAYMENT</p>
          <h1 className="qrWaitingTitle">Quét mã QR để thanh toán</h1>
          <p className="qrWaitingSubtitle">
            Vui lòng chuyển khoản đúng số tiền và <strong>giữ nguyên nội dung chuyển khoản</strong>.
            Hệ thống ngân hàng sẽ tự động xác nhận đơn ngay khi nhận được thanh toán.
          </p>

          <div className="qrPulseBadge">
            <div className="qrPulseDot" />
            <span>Đang lắng nghe giao dịch chuyển khoản từ ngân hàng...</span>
          </div>

          <div className="qrImageFrame">
            <Image
              src={qrPaymentUrl}
              alt="Mã QR thanh toán VietQR"
              width={320}
              height={320}
              unoptimized
              priority
            />
          </div>

          <div className="qrBankingTable">
            <div className="qrBankingRow">
              <span className="qrBankingLabel">Ngân hàng</span>
              <span className="qrBankingValue">{bankId} (Quân Đội)</span>
            </div>
            <div className="qrBankingRow">
              <span className="qrBankingLabel">Số tài khoản</span>
              <div className="qrBankingValue">
                <span>{account}</span>
                <button
                  type="button"
                  className="copyMiniBtn"
                  onClick={() => copyText(account, "account")}
                >
                  {copiedKey === "account" ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === "account" ? "Đã chép" : "Chép"}</span>
                </button>
              </div>
            </div>
            <div className="qrBankingRow">
              <span className="qrBankingLabel">Chủ tài khoản</span>
              <span className="qrBankingValue">{accountName}</span>
            </div>
            <div className="qrBankingRow">
              <span className="qrBankingLabel">Số tiền</span>
              <div className="qrBankingValue">
                <span style={{ color: "#b91c1c", fontSize: 16 }}>{formatPrice(pendingQrOrder.total)}</span>
                <button
                  type="button"
                  className="copyMiniBtn"
                  onClick={() => copyText(String(pendingQrOrder.total), "amount")}
                >
                  {copiedKey === "amount" ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === "amount" ? "Đã chép" : "Chép"}</span>
                </button>
              </div>
            </div>
            <div className="qrBankingRow highlight">
              <span className="qrBankingLabel" style={{ color: "#92400e", fontWeight: 700 }}>
                Nội dung chuyển khoản
              </span>
              <div className="qrBankingValue">
                <span style={{ color: "#92400e", fontSize: 15, fontFamily: "monospace" }}>
                  {pendingQrOrder.id}
                </span>
                <button
                  type="button"
                  className="copyMiniBtn"
                  onClick={() => copyText(pendingQrOrder.id, "orderCode")}
                >
                  {copiedKey === "orderCode" ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === "orderCode" ? "Đã chép" : "Chép"}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="qrWaitingActions">
            <button
              type="button"
              className="btn"
              style={{ minWidth: 260 }}
              onClick={() => void checkQrStatus(pendingQrOrder.id, true)}
              disabled={checkingPayment}
            >
              <RefreshCw size={15} className={checkingPayment ? "spin" : ""} />
              {checkingPayment ? "Đang kiểm tra giao dịch..." : "Kiểm tra thanh toán ngay"}
            </button>

            {/* Test Simulation Button for Local / Dev testing */}
            <button
              type="button"
              className="qrSimulateBtn"
              onClick={() => void simulatePayment(pendingQrOrder.id)}
              disabled={simulating}
              title="Kích hoạt xác nhận thanh toán ngay lập tức mà không cần chờ callback"
            >
              <Sparkles size={14} />
              {simulating ? "Đang ghi nhận..." : "⚡ Giả lập thanh toán thành công (Dành cho thử nghiệm)"}
            </button>

            <button
              type="button"
              className="btn ghost small"
              onClick={() => setPendingQrOrder(null)}
              style={{ marginTop: 10, color: "var(--muted)" }}
            >
              Quay lại chỉnh sửa đơn hàng
            </button>
          </div>
        </div>
      </section>
    );
  }

  // --- STATE 3: Cart Empty ---
  if (!cart.length) {
    return (
      <div className="emptyState">
        <div>
          <ShoppingBag size={40} />
          <h2>Chưa có sản phẩm để thanh toán</h2>
          <p>Hãy chọn những thiết kế ưng ý từ bộ sưu tập của LSOUL.</p>
          <Link className="btn" href="/shop">Khám phá cửa hàng</Link>
        </div>
      </div>
    );
  }

  // --- STATE 4: Normal Checkout Form ---
  return (
    <section className="checkoutPage">
      <div className="pageHero" style={{ padding: 0, border: 0, marginBottom: 30 }}>
        <p className="eyebrow">SECURE CHECKOUT</p>
        <h1>Thanh toán</h1>
      </div>

      <form onSubmit={submit} className="twoCol">
        <div className="panel">
          <div className="checkoutSectionHead">
            <h2>Thông tin nhận hàng</h2>
            {user && addresses.length ? <span>Đang dùng địa chỉ đã lưu</span> : null}
          </div>

          <div className="formGrid">
            <div className="field">
              <label>Họ tên</label>
              <input required value={shippingInfo.name} onChange={(e) => change("name", e.target.value)} placeholder="Nguyễn Văn A" />
            </div>
            <div className="field">
              <label>Số điện thoại</label>
              <input required value={shippingInfo.phone} onChange={(e) => change("phone", e.target.value)} placeholder="09xxxxxxxx" />
            </div>
            <div className="field full">
              <label>Địa chỉ</label>
              <input required value={shippingInfo.address} onChange={(e) => change("address", e.target.value)} placeholder="Số nhà, tên đường, phường/xã..." />
            </div>
            <div className="field">
              <label>Tỉnh / Thành</label>
              <input required value={shippingInfo.city} onChange={(e) => change("city", e.target.value)} placeholder="Hà Nội / TP.HCM" />
            </div>
            <div className="field">
              <label>Ghi chú đơn hàng</label>
              <input value={shippingInfo.note} onChange={(e) => change("note", e.target.value)} placeholder="Giao giờ hành chính, gọi trước khi giao..." />
            </div>
          </div>

          <h2>Phương thức thanh toán</h2>
          <div className="paymentChoice">
            <button
              type="button"
              className={"paymentCard " + (payment === "qr" ? "active" : "")}
              onClick={() => setPayment("qr")}
            >
              <QrCode size={20} />
              <div>
                <strong>Chuyển khoản VietQR</strong>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Tự động xác nhận sau khi quét mã & chuyển khoản
                </div>
              </div>
            </button>
            <button
              type="button"
              className={"paymentCard " + (payment === "cod" ? "active" : "")}
              onClick={() => setPayment("cod")}
            >
              <CreditCard size={20} />
              <div>
                <strong>Thanh toán khi nhận hàng (COD)</strong>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  Nhận hàng, kiểm tra và thanh toán tiền mặt
                </div>
              </div>
            </button>
          </div>

          {payment === "qr" ? (
            <div className="notice" style={{ marginTop: 12 }}>
              💡 Khi bấm <strong>"Tiếp tục thanh toán QR"</strong>, hệ thống sẽ tạo đơn và hiển thị mã VietQR chính xác số tiền cùng mã đơn hàng của bạn. Bạn chỉ cần quét mã bằng app ngân hàng là đơn hàng sẽ tự động xác nhận thành công.
            </div>
          ) : null}
        </div>

        <aside className="panel">
          <h2>Đơn hàng ({cart.reduce((s, i) => s + i.quantity, 0)})</h2>

          <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12 }}>
            {cart.map((line) => (
              <div className="summaryLine" key={`${line.product.id}-${line.size ?? ""}`}>
                <span>{line.quantity} × {line.product.name} {line.size ? `(${line.size})` : ""}</span>
                <strong>{formatPrice(line.product.price * line.quantity)}</strong>
              </div>
            ))}
          </div>

          {/* VOUCHER / COUPON SECTION IN CLIENT CHECKOUT */}
          <div className="checkoutPromoCard">
            <div className="checkoutPromoCardHead">
              <Tag size={14} />
              <span>Mã ưu đãi / Voucher</span>
            </div>

            {coupon ? (
              <div className="checkoutPromoApplied">
                <div className="checkoutPromoAppliedInfo">
                  <span className="checkoutPromoCodeTag">{coupon.code}</span>
                  <span style={{ fontSize: 12, color: "#198754", fontWeight: 600 }}>
                    {coupon.type === "percentage" ? `Giảm ${coupon.value}%` : `Giảm ${formatPrice(coupon.value)}`}
                  </span>
                </div>
                <button
                  type="button"
                  className="checkoutPromoRemoveBtn"
                  onClick={clearCoupon}
                >
                  Gỡ mã
                </button>
              </div>
            ) : (
              <>
                <div className="checkoutPromoForm">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        void handleApplyCoupon(e);
                      }
                    }}
                    placeholder="Nhập mã voucher (vd: LSOUL10, WELCOME15)"
                  />
                  <button
                    type="button"
                    onClick={(e) => void handleApplyCoupon(e)}
                    disabled={couponLoading || !couponInput.trim()}
                  >
                    {couponLoading ? "Đang áp dụng..." : "Áp dụng"}
                  </button>
                </div>

                <div className="checkoutPromoChips">
                  <span className="checkoutPromoChipHint">Mã đang có:</span>
                  <button
                    type="button"
                    className="checkoutPromoChip"
                    onClick={() => void handleApplyCoupon(undefined, "LSOUL10")}
                  >
                    LSOUL10 (-10%)
                  </button>
                  <button
                    type="button"
                    className="checkoutPromoChip"
                    onClick={() => void handleApplyCoupon(undefined, "WELCOME15")}
                  >
                    WELCOME15 (-15%)
                  </button>
                </div>
              </>
            )}

            {couponMessage ? (
              <p className={`checkoutPromoFeedback ${couponMessage.type}`}>
                {couponMessage.text}
              </p>
            ) : null}
          </div>

          <div className="summaryLine">
            <span>Tạm tính</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          {discount > 0 ? (
            <div className="summaryLine" style={{ color: "#198754" }}>
              <span>Mã ưu đãi ({coupon?.code})</span>
              <strong>-{formatPrice(discount)}</strong>
            </div>
          ) : null}

          <div className="summaryLine">
            <span>Phí vận chuyển</span>
            <strong>{shipping ? formatPrice(shipping) : "Miễn phí"}</strong>
          </div>

          <div className="summaryLine total">
            <span>Tổng thanh toán</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          {submitError ? <div className="authError">{submitError}</div> : null}

          <button className="btn block" type="submit" disabled={submitting}>
            {submitting
              ? "Đang khởi tạo đơn..."
              : payment === "qr"
                ? "Tiếp tục thanh toán QR"
                : "Đặt hàng COD"}
          </button>

          <p style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.6, marginTop: 12 }}>
            Bằng việc đặt hàng, bạn đồng ý với chính sách đổi trả và quy chuẩn giao nhận của LSOUL.
          </p>
        </aside>
      </form>
    </section>
  );
}
