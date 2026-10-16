"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Copy, CreditCard, ChevronRight, Eye, QrCode } from "lucide-react";
import { useState } from "react";
import type { OrderRecord } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export interface OrderCardProps {
  order: OrderRecord;
  onViewDetail: (order: OrderRecord) => void;
  onPay: (order: OrderRecord) => void;
}

export function OrderCard({ order, onViewDetail, onPay }: OrderCardProps) {
  const [copied, setCopied] = useState(false);

  function copyText(e: React.MouseEvent, text: string) {
    e.stopPropagation();
    if (typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isUnpaid = order.paymentStatus !== "paid" && order.status !== "cancelled";

  const paymentBadge = order.payment === "qr"
    ? order.paymentStatus === "paid"
      ? { text: "VietQR · Đã thanh toán", style: "paid" }
      : { text: "VietQR · Chờ thanh toán", style: "pending" }
    : order.paymentStatus === "paid"
      ? { text: "COD · Đã thanh toán", style: "paid" }
      : { text: "COD · Thu khi nhận hàng", style: "cod" };

  const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <article
      className="orderCompactCard"
      onClick={() => onViewDetail(order)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetail(order);
        }
      }}
    >
      {/* Header */}
      <div className="orderCompactHead">
        <div className="orderCompactMeta">
          <div className="orderIdRow">
            <span className="orderBadge">Đơn hàng</span>
            <strong className="orderIdText">#{order.id}</strong>
            <button
              type="button"
              className="copyMiniBtn"
              onClick={(e) => copyText(e, order.id)}
              title="Sao chép mã đơn"
              aria-label="Sao chép mã đơn"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? "Đã chép" : "Chép"}</span>
            </button>
          </div>
          <span className="orderDateText">
            {new Intl.DateTimeFormat("vi-VN", {
              dateStyle: "medium",
              timeStyle: "short"
            }).format(new Date(order.createdAt))}
          </span>
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

      {/* Products list - Product centric as requested */}
      <div className="orderCompactItems">
        {order.items.map((line) => (
          <div key={`${order.id}-${line.product.id}-${line.size}`} className="orderCompactItemRow">
            <div className="orderCompactThumb">
              <Image
                src={line.product.image}
                alt={line.product.name}
                fill
                sizes="64px"
              />
            </div>
            <div className="orderCompactInfo">
              <span className="orderCompactName">{line.product.name}</span>
              <span className="orderCompactVariant">
                {line.product.color} · Cỡ {line.size ?? "-"} · SL: {line.quantity}
              </span>
            </div>
            <div className="orderCompactPrice">
              {formatPrice(line.product.price * line.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="orderCompactFooter">
        <div className="orderCompactTotal">
          <span className="orderTotalLabel">Tổng thanh toán ({totalQuantity} sản phẩm):</span>
          <strong className="orderTotalValue">{formatPrice(order.total)}</strong>
        </div>

        <div className="orderCompactActions" onClick={(e) => e.stopPropagation()}>
          {isUnpaid && (
            <button
              type="button"
              className="orderPayBtn"
              onClick={() => onPay(order)}
            >
              <CreditCard size={14} />
              <span>Thanh toán ngay</span>
            </button>
          )}

          <button
            type="button"
            className="orderDetailBtn"
            onClick={() => onViewDetail(order)}
          >
            <Eye size={14} />
            <span>Xem chi tiết</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
