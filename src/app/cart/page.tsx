"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useStore } from "@/components/store-provider";
import { calculateCouponDiscount } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, coupon, applyCoupon, clearCoupon } = useStore();
  const [couponInput, setCouponInput] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const discount = calculateCouponDiscount(coupon, subtotal);
  const shipping = subtotal >= 699000 ? 0 : 30000;
  const total = Math.max(0, subtotal - discount + shipping);
  const remaining = Math.max(0, 699000 - subtotal);
  const progress = Math.min(100, (subtotal / 699000) * 100);

  async function submitCoupon(event: FormEvent) {
    event.preventDefault();
    setCouponLoading(true);
    const valid = await applyCoupon(couponInput);
    setCouponMessage(valid ? "Mã ưu đãi đã được áp dụng." : "Mã ưu đãi chưa hợp lệ hoặc chưa đủ điều kiện.");
    if (valid) setCouponInput("");
    setCouponLoading(false);
  }

  if (!cart.length) return (
    <div className="emptyState"><div><ShoppingBag size={36} /><h2>Giỏ hàng đang trống</h2><p>Chọn những thiết kế bạn yêu thích trước khi thanh toán.</p><Link className="btn" href="/shop">Khám phá LSOUL</Link></div></div>
  );

  return (
    <section className="cartPage">
      <div className="pageHero" style={{padding: 0, border: 0, marginBottom: 30}}><p className="eyebrow">YOUR BAG</p><h1>Giỏ hàng</h1></div>
      <div className="shippingProgress">
        <div className="shippingProgressHead"><strong>{remaining === 0 ? "Bạn đã được miễn phí vận chuyển." : `Thêm ${formatPrice(remaining)} để được freeship.`}</strong><span>{Math.round(progress)}%</span></div>
        <div className="progressTrack"><div className="progressFill" style={{width: `${progress}%`}} /></div>
      </div>
      <div className="twoCol">
        <div className="panel">
          {cart.map((line) => (
            <div className="cartLine" key={`${line.product.id}-${line.size}`}>
              <div className="cartLineImage"><Image src={line.product.image} alt={line.product.name} fill sizes="92px" /></div>
              <div><Link href={`/product/${line.product.id}`}><h3>{line.product.name}</h3></Link><p>{line.product.color} · Size {line.size ?? "-"}</p><strong>{formatPrice(line.product.price)}</strong><div className="qty"><button onClick={() => updateQuantity(line.product.id, line.size, line.quantity - 1)} aria-label="Giảm số lượng"><Minus size={14} /></button><span>{line.quantity}</span><button onClick={() => updateQuantity(line.product.id, line.size, line.quantity + 1)} aria-label="Tăng số lượng"><Plus size={14} /></button></div></div>
              <button className="iconButton" onClick={() => removeFromCart(line.product.id, line.size)} aria-label="Xóa"><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
        <aside className="panel">
          <h2>Tóm tắt đơn hàng</h2>
          <div className="summaryLine"><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div>
          {discount > 0 ? <div className="summaryLine"><span>Ưu đãi ({coupon?.code})</span><strong>-{formatPrice(discount)}</strong></div> : null}
          <div className="summaryLine"><span>Vận chuyển</span><strong>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</strong></div>
          <div className="summaryLine total"><span>Tổng cộng</span><strong>{formatPrice(total)}</strong></div>

          <div className="couponBox">
            {coupon ? <div className="couponActive"><span><strong>{coupon.code}</strong> · {coupon.type === "percentage" ? `giảm ${coupon.value}%` : `giảm ${formatPrice(coupon.value)}`}</span><button onClick={clearCoupon}>Bỏ mã</button></div> : <form className="couponForm" onSubmit={submitCoupon}><input value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Mã ưu đãi" /><button type="submit" disabled={couponLoading}>{couponLoading ? "..." : "Áp dụng"}</button></form>}
            {couponMessage ? <p className="couponMessage">{couponMessage}</p> : null}
          </div>

          <p style={{color: "var(--muted)", fontSize: 12, lineHeight: 1.6}}>Thanh toán khi nhận hàng hoặc chuyển khoản nhanh bằng QR.</p>
          <Link className="btn block" href="/checkout">Tiến hành thanh toán</Link>
          <Link className="btn ghost block" href="/shop" style={{marginTop: 8}}>Tiếp tục mua sắm</Link>
        </aside>
      </div>
    </section>
  );
}
