"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { OrderRecord } from "@/lib/cart";
import { OrderTracker } from "@/components/order-tracker";

interface OrderDetailModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onPay: (order: OrderRecord) => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onPay
}: OrderDetailModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  return (
    <div className="orderDetailModalOverlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="orderDetailModalContainer" onClick={(e) => e.stopPropagation()}>
        <div className="orderDetailModalHeader">
          <div>
            <span className="orderDetailModalEyebrow">THÔNG TIN ĐƠN HÀNG</span>
            <h2 className="orderDetailModalTitle">Chi tiết đơn hàng #{order.id}</h2>
          </div>
          <button
            type="button"
            className="orderDetailModalCloseBtn"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết"
          >
            <X size={20} />
          </button>
        </div>

        <div className="orderDetailModalBody">
          <OrderTracker order={order} showItems={true} onPay={onPay} />
        </div>
      </div>
    </div>
  );
}
