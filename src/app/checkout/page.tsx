"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, CreditCard, QrCode } from "lucide-react";
import { FormEvent, useState } from "react";
import { useStore } from "@/components/store-provider";
import type { OrderRecord } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export default function CheckoutPage() {
  const { cart, coupon, placeOrder } = useStore();
  const [payment, setPayment] = useState<"qr" | "cod">("qr");
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discount = Math.round(subtotal * (coupon?.rate ?? 0));
  const shipping = subtotal >= 699000 ? 0 : 30000;
  const total = subtotal - discount + shipping;
  const bankId = process.env.NEXT_PUBLIC_BANK_ID ?? "MB";
  const account = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "0123456789";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "ELANE FASHION DEMO";
  const provisionalOrderId = "EL" + String(Date.now()).slice(-8);
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${account}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(provisionalOrderId)}&accountName=${encodeURIComponent(accountName)}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const order: OrderRecord = {
      id: provisionalOrderId,
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal,
      shipping,
      discount,
      total,
      payment,
      status: "processing",
      customer: {
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        address: String(data.get("address") ?? ""),
        city: String(data.get("city") ?? "")
      }
    };
    placeOrder(order);
    setCompletedOrder(order);
  }

  if (!cart.length && !completedOrder) return <div className="emptyState"><div><h2>Chưa có sản phẩm để checkout</h2><Link className="btn" href="/shop">Quay lại shop</Link></div></div>;

  if (completedOrder) return (
    <section className="checkoutPage"><div className="panel successBox"><div className="successIcon"><Check size={26} /></div><p className="eyebrow">ORDER RECEIVED</p><h2>Cảm ơn bạn đã đặt hàng</h2><p>Mã đơn: <strong>{completedOrder.id}</strong></p><p style={{color: "var(--muted)"}}>Đơn đã được lưu vào lịch sử trên trình duyệt. Bản demo chưa xác minh giao dịch ngân hàng tự động.</p><div className="heroActions" style={{justifyContent: "center"}}><Link className="btn" href="/orders">Xem đơn hàng</Link><Link className="btn secondary" href="/shop">Tiếp tục mua sắm</Link></div></div></section>
  );

  return (
    <section className="checkoutPage">
      <div className="pageHero" style={{padding: 0, border: 0, marginBottom: 30}}><p className="eyebrow">SECURE CHECKOUT</p><h1>Thanh toán</h1></div>
      <form onSubmit={submit} className="twoCol">
        <div className="panel">
          <h2>Thông tin nhận hàng</h2>
          <div className="formGrid">
            <div className="field"><label>Họ tên</label><input name="name" required placeholder="Nguyễn Văn A" /></div>
            <div className="field"><label>Số điện thoại</label><input name="phone" required placeholder="09xxxxxxxx" /></div>
            <div className="field full"><label>Địa chỉ</label><input name="address" required placeholder="Số nhà, đường, phường/xã..." /></div>
            <div className="field"><label>Tỉnh / Thành</label><input name="city" required placeholder="Hà Nội" /></div>
            <div className="field"><label>Ghi chú</label><input name="note" placeholder="Giao giờ hành chính..." /></div>
          </div>
          <h2>Phương thức thanh toán</h2>
          <div className="paymentChoice">
            <button type="button" className={`paymentCard ${payment === "qr" ? "active" : ""}`} onClick={() => setPayment("qr")}><QrCode size={20} /><div><strong>Chuyển khoản QR</strong><div style={{fontSize: 11, color: "var(--muted)"}}>QR tạo theo đúng số tiền đơn hàng</div></div></button>
            <button type="button" className={`paymentCard ${payment === "cod" ? "active" : ""}`} onClick={() => setPayment("cod")}><CreditCard size={20} /><div><strong>COD</strong><div style={{fontSize: 11, color: "var(--muted)"}}>Thanh toán khi nhận hàng</div></div></button>
          </div>
          {payment === "qr" ? <><div className="qrBox"><Image src={qrUrl} alt="QR thanh toán demo" width={360} height={360} unoptimized /></div><div className="notice">QR phục vụ demo đồ án. Trạng thái thanh toán được người dùng xác nhận thủ công.</div></> : null}
        </div>
        <aside className="panel">
          <h2>Đơn hàng</h2>
          {cart.map((line) => <div className="summaryLine" key={`${line.product.id}-${line.size}`}><span>{line.quantity} × {line.product.name}</span><strong>{formatPrice(line.product.price * line.quantity)}</strong></div>)}
          <div className="summaryLine"><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div>
          {discount > 0 ? <div className="summaryLine"><span>Mã {coupon?.code}</span><strong>-{formatPrice(discount)}</strong></div> : null}
          <div className="summaryLine"><span>Vận chuyển</span><strong>{shipping ? formatPrice(shipping) : "Miễn phí"}</strong></div>
          <div className="summaryLine total"><span>Tổng</span><strong>{formatPrice(total)}</strong></div>
          <button className="btn block" type="submit">{payment === "qr" ? "Tôi đã thanh toán" : "Đặt hàng COD"}</button>
          <p style={{fontSize: 10, color: "var(--muted)", lineHeight: 1.6}}>Bằng việc đặt hàng, bạn đồng ý với chính sách đổi trả và điều khoản mua hàng demo.</p>
        </aside>
      </form>
    </section>
  );
}
