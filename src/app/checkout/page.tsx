"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, CreditCard, QrCode } from "lucide-react";
import { FormEvent, useState } from "react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

export default function CheckoutPage() {
  const { cart, clearCart } = useStore();
  const [payment, setPayment] = useState<"qr" | "cod">("qr");
  const [done, setDone] = useState(false);
  const orderId = "EL-DEMO-260930";
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal >= 699000 ? 0 : 30000;
  const total = subtotal + shipping;
  const bankId = process.env.NEXT_PUBLIC_BANK_ID ?? "MB";
  const account = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "0123456789";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "ELANE FASHION DEMO";
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${account}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(orderId)}&accountName=${encodeURIComponent(accountName)}`;

  function submit(event: FormEvent) {
    event.preventDefault();
    setDone(true);
    clearCart();
  }

  if (!cart.length && !done) return <div className="emptyState"><div><h2>Chưa có sản phẩm để checkout</h2><Link className="btn" href="/shop">Quay lại shop</Link></div></div>;

  if (done) return (
    <section className="checkoutPage"><div className="panel successBox"><div className="successIcon"><Check size={26} /></div><h2>Đơn hàng đã được ghi nhận</h2><p>Mã đơn: <strong>{orderId}</strong></p><p style={{color: 'var(--muted)'}}>Trạng thái thanh toán được xác nhận thủ công trong bản demo.</p><Link className="btn" href="/shop">Tiếp tục mua sắm</Link></div></section>
  );

  return (
    <section className="checkoutPage">
      <div className="pageHero" style={{padding: 0, border: 0, marginBottom: 30}}><p className="eyebrow">CHECKOUT</p><h1>Thanh toán</h1></div>
      <form onSubmit={submit} className="twoCol">
        <div className="panel">
          <h2>Thông tin nhận hàng</h2>
          <div className="formGrid">
            <div className="field"><label>Họ tên</label><input required placeholder="Nguyễn Văn A" /></div>
            <div className="field"><label>Số điện thoại</label><input required placeholder="09xxxxxxxx" /></div>
            <div className="field full"><label>Địa chỉ</label><input required placeholder="Số nhà, đường, phường/xã..." /></div>
            <div className="field"><label>Tỉnh / Thành</label><input required placeholder="Hà Nội" /></div>
            <div className="field"><label>Ghi chú</label><input placeholder="Giao giờ hành chính..." /></div>
          </div>
          <h2>Phương thức thanh toán</h2>
          <div className="paymentChoice">
            <div className={`paymentCard ${payment === "qr" ? "active" : ""}`} onClick={() => setPayment("qr")}><QrCode size={20} /><div><strong>Chuyển khoản QR</strong><div style={{fontSize: 11, color: 'var(--muted)'}}>QR demo theo đúng số tiền đơn hàng</div></div></div>
            <div className={`paymentCard ${payment === "cod" ? "active" : ""}`} onClick={() => setPayment("cod")}><CreditCard size={20} /><div><strong>COD</strong><div style={{fontSize: 11, color: 'var(--muted)'}}>Thanh toán khi nhận hàng</div></div></div>
          </div>
          {payment === "qr" ? <><div className="qrBox"><Image src={qrUrl} alt="QR thanh toán demo" width={360} height={360} unoptimized /></div><div className="notice">QR này phục vụ demo đồ án. Hệ thống không xác minh giao dịch ngân hàng tự động; nút xác nhận bên dưới sẽ chuyển đơn sang trạng thái đã ghi nhận.</div></> : null}
        </div>
        <aside className="panel">
          <h2>Đơn #{orderId}</h2>
          {cart.map((line) => <div className="summaryLine" key={`${line.product.id}-${line.size}`}><span>{line.quantity} × {line.product.name}</span><strong>{formatPrice(line.product.price * line.quantity)}</strong></div>)}
          <div className="summaryLine"><span>Vận chuyển</span><strong>{shipping ? formatPrice(shipping) : "Miễn phí"}</strong></div>
          <div className="summaryLine total"><span>Tổng</span><strong>{formatPrice(total)}</strong></div>
          <button className="btn block" type="submit">{payment === "qr" ? "Tôi đã thanh toán" : "Đặt hàng COD"}</button>
        </aside>
      </form>
    </section>
  );
}
