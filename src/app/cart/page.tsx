"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart } = useStore();
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const shipping = subtotal >= 699000 ? 0 : 30000;

  if (!cart.length) return (
    <div className="emptyState"><div><ShoppingBag size={36} /><h2>Giỏ hàng đang trống</h2><p>Chọn vài món trước khi checkout nhé.</p><Link className="btn" href="/shop">Đi mua sắm</Link></div></div>
  );

  return (
    <section className="cartPage">
      <div className="pageHero" style={{padding: 0, border: 0, marginBottom: 30}}><p className="eyebrow">YOUR BAG</p><h1>Giỏ hàng</h1></div>
      <div className="twoCol">
        <div className="panel">
          {cart.map((line) => (
            <div className="cartLine" key={`${line.product.id}-${line.size}`}>
              <div className="cartLineImage"><Image src={line.product.image} alt={line.product.name} fill sizes="92px" /></div>
              <div><h3>{line.product.name}</h3><p>{line.product.color} · Size {line.size ?? "-"}</p><strong>{formatPrice(line.product.price)}</strong><div className="qty"><button onClick={() => updateQuantity(line.product.id, line.size, line.quantity - 1)}><Minus size={14} /></button><span>{line.quantity}</span><button onClick={() => updateQuantity(line.product.id, line.size, line.quantity + 1)}><Plus size={14} /></button></div></div>
              <button className="iconButton" onClick={() => removeFromCart(line.product.id, line.size)} aria-label="Xóa"><Trash2 size={17} /></button>
            </div>
          ))}
        </div>
        <aside className="panel">
          <h2>Tóm tắt đơn hàng</h2>
          <div className="summaryLine"><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div>
          <div className="summaryLine"><span>Vận chuyển</span><strong>{shipping === 0 ? "Miễn phí" : formatPrice(shipping)}</strong></div>
          <div className="summaryLine total"><span>Tổng cộng</span><strong>{formatPrice(subtotal + shipping)}</strong></div>
          <p style={{color: 'var(--muted)', fontSize: 12, lineHeight: 1.6}}>Miễn phí vận chuyển cho đơn từ 699.000đ. Đây là luồng demo, không cần đăng nhập.</p>
          <Link className="btn block" href="/checkout">Tiến hành thanh toán</Link>
        </aside>
      </div>
    </section>
  );
}
