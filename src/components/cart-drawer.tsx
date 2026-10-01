"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useEffect } from "react";
import { formatPrice } from "@/lib/products";
import { useStore } from "./store-provider";

export function CartDrawer() {
  const { cart, cartDrawerOpen, closeCartDrawer, updateQuantity, removeFromCart } = useStore();
  const subtotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const remaining = Math.max(0, 699000 - subtotal);
  const progress = Math.min(100, (subtotal / 699000) * 100);

  useEffect(() => {
    if (!cartDrawerOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeCartDrawer(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [cartDrawerOpen, closeCartDrawer]);

  if (!cartDrawerOpen) return null;

  return (
    <div className="commerceBackdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) closeCartDrawer(); }}>
      <aside className="cartDrawer" aria-label="Giỏ hàng">
        <div className="drawerCommerceHead"><div><p className="eyebrow">YOUR BAG</p><h2>Giỏ hàng <span>{cart.reduce((sum, line) => sum + line.quantity, 0)}</span></h2></div><button className="iconButton" onClick={closeCartDrawer} aria-label="Đóng giỏ"><X size={19} /></button></div>
        <div className="drawerShipping">
          <span>{remaining === 0 ? "Bạn đã được freeship." : `Thêm ${formatPrice(remaining)} để được freeship.`}</span>
          <div className="progressTrack"><div className="progressFill" style={{width: `${progress}%`}} /></div>
        </div>

        <div className="drawerCartBody">
          {cart.length ? cart.map((line) => (
            <div className="drawerCartLine" key={`${line.product.id}-${line.size}`}>
              <Link className="drawerCartImage" href={`/product/${line.product.id}`} onClick={closeCartDrawer}><Image src={line.product.image} alt={line.product.name} fill sizes="84px" /></Link>
              <div className="drawerCartMeta">
                <Link href={`/product/${line.product.id}`} onClick={closeCartDrawer}><strong>{line.product.name}</strong></Link>
                <span>{line.product.color} · Size {line.size ?? "-"}</span>
                <b>{formatPrice(line.product.price)}</b>
                <div className="drawerQty"><button onClick={() => updateQuantity(line.product.id, line.size, line.quantity - 1)}><Minus size={12} /></button><span>{line.quantity}</span><button onClick={() => updateQuantity(line.product.id, line.size, line.quantity + 1)}><Plus size={12} /></button></div>
              </div>
              <button className="drawerRemove" onClick={() => removeFromCart(line.product.id, line.size)} aria-label="Xóa sản phẩm"><Trash2 size={15} /></button>
            </div>
          )) : <div className="drawerEmpty"><ShoppingBag size={28} /><h3>Giỏ hàng đang trống</h3><p>Khám phá collection và thêm những món bạn thích.</p><Link className="btn" href="/shop" onClick={closeCartDrawer}>Đi mua sắm</Link></div>}
        </div>

        {cart.length ? <div className="drawerCartFooter">
          <div className="drawerSubtotal"><span>Tạm tính</span><strong>{formatPrice(subtotal)}</strong></div>
          <p>Phí vận chuyển và ưu đãi được tính ở bước checkout.</p>
          <Link className="btn block" href="/checkout" onClick={closeCartDrawer}>Thanh toán</Link>
          <Link className="drawerTextLink" href="/cart" onClick={closeCartDrawer}>Xem & chỉnh sửa giỏ hàng</Link>
        </div> : null}
      </aside>
    </div>
  );
}
