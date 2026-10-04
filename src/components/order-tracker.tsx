"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileCheck,
  MapPin,
  Package,
  PackageCheck,
  QrCode,
  Truck,
  User
} from "lucide-react";
import { useState } from "react";
import type { OrderRecord, OrderStatus } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

interface OrderTrackerProps {
  order: OrderRecord;
  className?: string;
  showItems?: boolean;
}

const steps = [
  { key: "processing", label: "Tiếp nhận đơn", icon: FileCheck, desc: "Đơn hàng được ghi nhận" },
  { key: "confirmed", label: "Đã xác nhận", icon: CheckCircle2, desc: "Đã kiểm tra & chuẩn bị hàng" },
  { key: "shipping", label: "Đang giao hàng", icon: Truck, desc: "Đang trên đường tới bạn" },
  { key: "completed", label: "Giao thành công", icon: PackageCheck, desc: "Đã nhận kiện hàng" }
] as const;

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case "processing": return 0;
    case "confirmed": return 1;
    case "shipping": return 2;
    case "completed": return 3;
    case "cancelled": return -1;
    default: return 0;
  }
}

export function OrderTracker({ order, className = "", showItems = true }: OrderTrackerProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const currentIndex = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  function copyText(text: string, key: string) {
    if (typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  const paymentBadge = order.payment === "qr"
    ? order.paymentStatus === "paid"
      ? { text: "VietQR · Đã thanh toán", style: "paid" }
      : { text: "VietQR · Chờ thanh toán", style: "pending" }
    : order.paymentStatus === "paid"
      ? { text: "COD · Đã thanh toán", style: "paid" }
      : { text: "COD · Thu khi nhận hàng", style: "cod" };

  return (
    <div className={`orderTrackerCard ${className}`}>
      {/* Tracker Header */}
      <div className="orderTrackerHead">
        <div className="orderTrackerMeta">
          <div className="orderIdRow">
            <span className="orderBadge">Đơn hàng</span>
            <strong className="orderIdText">#{order.id}</strong>
            <button
              type="button"
              className="copyMiniBtn"
              onClick={() => copyText(order.id, "orderId")}
              title="Sao chép mã đơn"
            >
              {copied === "orderId" ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied === "orderId" ? "Đã chép" : "Chép"}</span>
            </button>
          </div>
          <small className="orderDateText">
            {new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short"
            }).format(new Date(order.createdAt))}
          </small>
        </div>

        <div className="orderTrackerBadges">
          <span className={`paymentPill ${paymentBadge.style}`}>
            {order.payment === "qr" ? <QrCode size={13} /> : <CreditCard size={13} />}
            {paymentBadge.text}
          </span>
          <span className={`statusPill status-${order.status}`}>
            {order.status === "processing" && "Đang xử lý"}
            {order.status === "confirmed" && "Đã xác nhận"}
            {order.status === "shipping" && "Đang giao"}
            {order.status === "completed" && "Hoàn tất"}
            {order.status === "cancelled" && "Đã hủy"}
          </span>
        </div>
      </div>

      {/* Progress Stepper */}
      {isCancelled ? (
        <div className="trackerCancelledBanner">
          <AlertCircle size={20} />
          <div>
            <strong>Đơn hàng đã được hủy</strong>
            <p>Nếu bạn đã thanh toán, nhân viên CSKH của LSOUL sẽ liên hệ hoàn tiền trong vòng 24h.</p>
          </div>
        </div>
      ) : (
        <div className="trackerTimeline">
          <div className="trackerProgressTrack">
            <div
              className="trackerProgressFill"
              style={{
                width: `${Math.max(0, Math.min(100, (currentIndex / (steps.length - 1)) * 100))}%`
              }}
            />
          </div>

          <div className="trackerSteps">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isFuture = idx > currentIndex;

              let stateClass = "future";
              if (isPast) stateClass = "past";
              if (isCurrent) stateClass = "current";

              return (
                <div key={step.key} className={`trackerStep ${stateClass}`}>
                  <div className="trackerStepMarker">
                    <StepIcon size={16} />
                  </div>
                  <div className="trackerStepInfo">
                    <div className="trackerStepLabel">{step.label}</div>
                    <div className="trackerStepDesc">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shipping & Delivery Details */}
      <div className="trackerDetailsGrid">
        <div className="trackerDetailCol">
          <div className="trackerDetailHead">
            <MapPin size={15} />
            <span>Địa chỉ nhận hàng</span>
          </div>
          <div className="trackerDetailBody">
            <strong>{order.customer.name} · {order.customer.phone}</strong>
            <p>{order.customer.address}, {order.customer.city}</p>
          </div>
        </div>

        <div className="trackerDetailCol">
          <div className="trackerDetailHead">
            <Truck size={15} />
            <span>Thông tin giao vận</span>
          </div>
          <div className="trackerDetailBody">
            {order.trackingCode ? (
              <>
                <p>
                  Đơn vị: <strong>{order.shippingCarrier ?? "Giao hàng nhanh"}</strong>
                </p>
                <div className="trackingCodeRow">
                  <span>Mã vận đơn: <strong>{order.trackingCode}</strong></span>
                  <button
                    type="button"
                    className="copyMiniBtn"
                    onClick={() => copyText(order.trackingCode!, "tracking")}
                  >
                    {copied === "tracking" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </>
            ) : (
              <p className="trackerMuted">Đơn hàng đang chuẩn bị kiện hàng, mã vận đơn sẽ được cập nhật sớm.</p>
            )}
          </div>
        </div>
      </div>

      {/* Items List (Collapsible/Optional) */}
      {showItems && order.items?.length ? (
        <div className="trackerItemsSection">
          <div className="trackerItemsHead">
            <span>Sản phẩm trong đơn ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
          <div className="trackerItemsList">
            {order.items.map((line) => (
              <div key={`${order.id}-${line.product.id}-${line.size}`} className="trackerItemRow">
                <div className="trackerItemThumb">
                  <Image src={line.product.image} alt={line.product.name} fill sizes="52px" />
                </div>
                <div className="trackerItemInfo">
                  <Link href={`/product/${line.product.id}`} className="trackerItemName">
                    {line.product.name}
                  </Link>
                  <small className="trackerItemMeta">
                    {line.product.color} · Cỡ {line.size ?? "-"} · SL {line.quantity}
                  </small>
                </div>
                <span className="trackerItemPrice">{formatPrice(line.product.price * line.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="trackerPriceSummary">
            <div className="trackerPriceRow">
              <span>Tạm tính</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 ? (
              <div className="trackerPriceRow discount">
                <span>Ưu đãi {order.couponCode ? `(${order.couponCode})` : ""}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            ) : null}
            <div className="trackerPriceRow">
              <span>Phí vận chuyển</span>
              <span>{order.shipping === 0 ? "Miễn phí" : formatPrice(order.shipping)}</span>
            </div>
            <div className="trackerPriceRow total">
              <strong>Tổng thanh toán</strong>
              <strong>{formatPrice(order.total)}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
