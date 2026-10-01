"use client";

import { Check, X } from "lucide-react";
import { useStore } from "./store-provider";

export function StoreToast() {
  const { notice, dismissNotice } = useStore();
  if (!notice) return null;

  return (
    <div className="storeToast" role="status" aria-live="polite">
      <div className="toastIcon"><Check size={15} /></div>
      <div><strong>{notice.message}</strong>{notice.detail ? <span>{notice.detail}</span> : null}</div>
      <button onClick={dismissNotice} aria-label="Đóng thông báo"><X size={14} /></button>
    </div>
  );
}
