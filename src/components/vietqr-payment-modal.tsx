"use client";

import Image from "next/image";
import { Check, CheckCircle2, Copy, CreditCard, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { OrderRecord } from "@/lib/cart";
import { formatPrice } from "@/lib/products";
import { useStore } from "@/components/store-provider";

interface VietQrPaymentModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (orderId: string) => void;
}

export function VietQrPaymentModal({
  order,
  isOpen,
  onClose,
  onPaymentSuccess
}: VietQrPaymentModalProps) {
  const { user, refreshAccount } = useStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [gatewayName, setGatewayName] = useState<string>("PayOS / SePay");

  const bankId = process.env.NEXT_PUBLIC_BANK_ID ?? "VCB";
  const account = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "1021654495";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "CAO TIEN LOC";

  useEffect(() => {
    if (!isOpen || !order) return;
    setIsPaid(order.paymentStatus === "paid");

    fetch("/api/payments/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.activeProvider) {
          setGatewayName(data.activeProvider === "payos" ? "PayOS" : "SePay");
        }
      })
      .catch(() => {});
  }, [isOpen, order]);

  // Polling loop
  useEffect(() => {
    if (!isOpen || !order || isPaid) return;

    const interval = setInterval(() => {
      void verifyPayment(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, order, isPaid]);

  if (!isOpen || !order) return null;

  function copyText(text: string, key: string) {
    if (typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  }

  async function verifyPayment(showLoading = false) {
    if (!order) return;
    if (showLoading) setChecking(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/payment`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { paymentStatus: string };
        if (data.paymentStatus === "paid") {
          setIsPaid(true);
          await refreshAccount(false);
          onPaymentSuccess?.(order.id);
        }
      }
    } catch (err) {
      console.warn("Poll payment error:", err);
    } finally {
      if (showLoading) setChecking(false);
    }
  }

  async function simulatePayment() {
    if (!order) return;
    setSimulating(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(order.id)}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = (await res.json()) as { paymentStatus: string };
        if (data.paymentStatus === "paid") {
          setIsPaid(true);
          await refreshAccount(false);
          onPaymentSuccess?.(order.id);
        }
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setSimulating(false);
    }
  }

  const qrPaymentUrl = `https://img.vietqr.io/image/${bankId}-${account}-compact2.png?amount=${order.total}&addInfo=${encodeURIComponent(order.id)}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div className="paymentModalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="paymentModalCard" onClick={(e) => e.stopPropagation()}>
        <div className="paymentModalHead">
          <div>
            <span className="paymentModalEyebrow">CỔNG THANH TOÁN TỰ ĐỘNG</span>
            <h2 className="paymentModalTitle">Thanh toán đơn hàng #{order.id}</h2>
          </div>
          <button type="button" className="paymentModalCloseBtn" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        {isPaid ? (
          <div className="paymentSuccessBox">
            <CheckCircle2 size={52} className="paymentSuccessIcon" />
            <h3>Đã thanh toán thành công!</h3>
            <p>Hệ thống đã nhận được tiền và xác nhận đơn hàng #{order.id}. Đội ngũ LSOUL đang chuẩn bị kiện hàng cho bạn.</p>
            <div className="paymentSuccessActions">
              <button type="button" className="btn" onClick={onClose}>
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        ) : (
          <div className="paymentModalBody">
            <div className="paymentPulseBadge">
              <span className="paymentPulseDot" />
              <span>Đang lắng nghe giao dịch chuyển khoản VietQR qua {gatewayName}...</span>
            </div>

            <p className="paymentGuideText">
              Mở ứng dụng ngân hàng bất kỳ, quét mã QR bên dưới. Vui lòng chuyển <strong>chính xác số tiền</strong> và <strong>giữ nguyên nội dung chuyển khoản</strong> để hệ thống tự động xác nhận ngay.
            </p>

            <div className="paymentQrFrame">
              <Image
                src={qrPaymentUrl}
                alt="Mã QR thanh toán VietQR"
                width={280}
                height={280}
                unoptimized
                priority
              />
            </div>

            <div className="paymentBankTable">
              <div className="paymentBankRow">
                <span className="paymentBankLabel">Ngân hàng</span>
                <span className="paymentBankValue">{bankId}</span>
              </div>
              <div className="paymentBankRow">
                <span className="paymentBankLabel">Số tài khoản</span>
                <div className="paymentBankValue">
                  <code>{account}</code>
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
              <div className="paymentBankRow">
                <span className="paymentBankLabel">Chủ tài khoản</span>
                <span className="paymentBankValue">{accountName}</span>
              </div>
              <div className="paymentBankRow">
                <span className="paymentBankLabel">Số tiền</span>
                <div className="paymentBankValue">
                  <strong className="paymentPriceText">{formatPrice(order.total)}</strong>
                  <button
                    type="button"
                    className="copyMiniBtn"
                    onClick={() => copyText(String(order.total), "amount")}
                  >
                    {copiedKey === "amount" ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === "amount" ? "Đã chép" : "Chép"}</span>
                  </button>
                </div>
              </div>
              <div className="paymentBankRow highlight">
                <span className="paymentBankLabel" style={{ color: "#92400e", fontWeight: 700 }}>
                  Nội dung CK
                </span>
                <div className="paymentBankValue">
                  <code style={{ color: "#92400e", fontWeight: 700 }}>{order.id}</code>
                  <button
                    type="button"
                    className="copyMiniBtn"
                    onClick={() => copyText(order.id, "orderCode")}
                  >
                    {copiedKey === "orderCode" ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === "orderCode" ? "Đã chép" : "Chép"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="paymentModalActions">
              <button
                type="button"
                className="btn"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => void verifyPayment(true)}
                disabled={checking}
              >
                <RefreshCw size={15} className={checking ? "spin" : ""} />
                <span>{checking ? "Đang kiểm tra giao dịch..." : "Kiểm tra thanh toán ngay"}</span>
              </button>

              {/* Development simulation for fast testing */}
              {process.env.NODE_ENV === "development" && (
                <button
                  type="button"
                  className="qrSimulateBtn"
                  style={{ width: "100%", textAlign: "center" }}
                  onClick={() => void simulatePayment()}
                  disabled={simulating}
                  title="Giả lập thanh toán thành công ngay để thử nghiệm"
                >
                  <Sparkles size={14} style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
                  {simulating ? "Đang ghi nhận..." : "⚡ Giả lập thanh toán thành công (Thử nghiệm)"}
                </button>
              )}

              <button
                type="button"
                className="btn ghost small"
                onClick={onClose}
                style={{ color: "var(--muted)" }}
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
