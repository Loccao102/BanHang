"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, CreditCard, QrCode, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useStore } from "@/components/store-provider";
import { calculateCouponDiscount, type OrderRecord } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

type Shipping = { name: string; phone: string; address: string; city: string; note: string };

export default function CheckoutPage() {
  const { cart, coupon, placeOrder, user, addresses } = useStore();
  const [payment, setPayment] = useState<"qr" | "cod">("qr");
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);
  const [shippingInfo, setShippingInfo] = useState<Shipping>({ name: "", phone: "", address: "", city: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [paymentIssue, setPaymentIssue] = useState("");

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
  const shipping = subtotal >= 699000 ? 0 : 30000;
  const total = Math.max(0, subtotal - discount + shipping);
  const bankId = process.env.NEXT_PUBLIC_BANK_ID ?? "MB";
  const account = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "0123456789";
  const accountName = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "LSOUL";
  const qrUrl = "https://img.vietqr.io/image/" + bankId + "-" + account + "-compact2.png?amount=" + total + "&addInfo=" + encodeURIComponent("LSOUL ORDER") + "&accountName=" + encodeURIComponent(accountName);

  function change(field: keyof Shipping, value: string) {
    setShippingInfo((current) => ({ ...current, [field]: value }));
  }

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
      setCompletedOrder(order);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể tạo đơn hàng.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart.length && !completedOrder) return <div className="emptyState"><div><h2>Chưa có sản phẩm để thanh toán</h2><Link className="btn" href="/shop">Quay lại cửa hàng</Link></div></div>;

  if (completedOrder) return (
    <section className="checkoutPage"><div className="panel successBox"><div className="successIcon"><Check size={26} /></div><p className="eyebrow">ORDER RECEIVED</p><h2>Cảm ơn bạn đã đặt hàng</h2><p>Mã đơn: <strong>{completedOrder.id}</strong></p><p style={{color: "var(--muted)"}}>Đơn hàng đã được ghi nhận. Trạng thái thanh toán, đóng gói và vận chuyển sẽ được cập nhật trong tài khoản của bạn.</p><div className="heroActions" style={{justifyContent: "center"}}>{user ? <Link className="btn" href="/account">Theo dõi đơn hàng</Link> : <Link className="btn" href="/login?next=/account">Đăng nhập để quản lý đơn</Link>}<Link className="btn secondary" href="/shop">Tiếp tục mua sắm</Link></div></div></section>
  );

  return (
    <section className="checkoutPage">
      <div className="pageHero" style={{padding: 0, border: 0, marginBottom: 30}}><p className="eyebrow">SECURE CHECKOUT</p><h1>Thanh toán</h1></div>
      {!user ? <div className="checkoutAccountPrompt"><UserRound size={18} /><div><strong>Đã có tài khoản?</strong><span>Đăng nhập để dùng địa chỉ đã lưu và theo dõi đơn hàng.</span></div><Link href="/login?next=/checkout">Đăng nhập</Link></div> : null}
      <form onSubmit={submit} className="twoCol">
        <div className="panel">
          <div className="checkoutSectionHead"><h2>Thông tin nhận hàng</h2>{user && addresses.length ? <span>Đang dùng địa chỉ đã lưu</span> : null}</div>
          <div className="formGrid">
            <div className="field"><label>Họ tên</label><input required value={shippingInfo.name} onChange={(e)=>change("name",e.target.value)} placeholder="Nguyễn Văn A" /></div>
            <div className="field"><label>Số điện thoại</label><input required value={shippingInfo.phone} onChange={(e)=>change("phone",e.target.value)} placeholder="09xxxxxxxx" /></div>
            <div className="field full"><label>Địa chỉ</label><input required value={shippingInfo.address} onChange={(e)=>change("address",e.target.value)} placeholder="Số nhà, đường, phường/xã..." /></div>
            <div className="field"><label>Tỉnh / Thành</label><input required value={shippingInfo.city} onChange={(e)=>change("city",e.target.value)} placeholder="Hà Nội" /></div>
            <div className="field"><label>Ghi chú</label><input value={shippingInfo.note} onChange={(e)=>change("note",e.target.value)} placeholder="Giao giờ hành chính..." /></div>
          </div>
          <h2>Phương thức thanh toán</h2>
          <div className="paymentChoice">
            <button type="button" className={"paymentCard " + (payment === "qr" ? "active" : "")} onClick={() => setPayment("qr")}><QrCode size={20} /><div><strong>Chuyển khoản QR</strong><div style={{fontSize: 11, color: "var(--muted)"}}>QR tạo theo đúng giá trị đơn hàng</div></div></button>
            <button type="button" className={"paymentCard " + (payment === "cod" ? "active" : "")} onClick={() => setPayment("cod")}><CreditCard size={20} /><div><strong>COD</strong><div style={{fontSize: 11, color: "var(--muted)"}}>Thanh toán khi nhận hàng</div></div></button>
          </div>
          {payment === "qr" ? <><div className="qrBox"><Image src={qrUrl} alt="QR thanh toán" width={360} height={360} unoptimized /></div><div className="notice">Vui lòng chuyển đúng số tiền hiển thị và giữ nguyên nội dung chuyển khoản để đơn hàng được đối soát nhanh hơn.</div></> : null}
        </div>
        <aside className="panel">
          <h2>Đơn hàng</h2>
          {cart.map((line) => <div className="summaryLine" key={line.product.id + "-" + (line.size ?? "")}><span>{line.quantity} × {line.product.name}</span><strong>{formatPrice(line.product.price * line.quantity)}</strong></div>)}
          <div className="summaryLine"><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div>
          {discount > 0 ? <div className="summaryLine"><span>Mã {coupon?.code}</span><strong>-{formatPrice(discount)}</strong></div> : null}
          <div className="summaryLine"><span>Vận chuyển</span><strong>{shipping ? formatPrice(shipping) : "Miễn phí"}</strong></div>
          <div className="summaryLine total"><span>Tổng</span><strong>{formatPrice(total)}</strong></div>
          {submitError ? <div className="authError">{submitError}</div> : null}
          <button className="btn block" type="submit" disabled={submitting}>{submitting ? "Đang tạo đơn..." : payment === "qr" ? "Xác nhận đặt hàng" : "Đặt hàng COD"}</button>
          <p style={{fontSize: 10, color: "var(--muted)", lineHeight: 1.6}}>Bằng việc đặt hàng, bạn đồng ý với chính sách đổi trả và điều khoản mua hàng của LSOUL.</p>
        </aside>
      </form>
    </section>
  );
}
