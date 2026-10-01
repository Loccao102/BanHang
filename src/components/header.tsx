"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./store-provider";

const nav = [
  ["Mới về", "/shop?sort=new"],
  ["Nữ", "/shop?gender=women"],
  ["Nam", "/shop?gender=men"],
  ["Phụ kiện", "/shop?category=accessory"],
  ["Sale", "/shop?sale=1"]
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { cartCount, wishlist } = useStore();

  return (
    <>
      <div className="announcement">FALL / WINTER 2026 · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY</div>
      <header className="siteHeader">
        <Link className="brand" href="/" aria-label="ÉLANE home">ÉLANE<span>®</span></Link>
        <nav className="desktopNav" aria-label="Điều hướng chính">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="headerActions">
          <Link className="iconButton" href="/shop" aria-label="Tìm kiếm"><Search size={19} /></Link>
          <Link className="iconButton countWrap" href="/wishlist" aria-label="Yêu thích">
            <Heart size={19} />{wishlist.length > 0 ? <span className="countBadge">{wishlist.length}</span> : null}
          </Link>
          <Link className="iconButton" href="/orders" aria-label="Đơn hàng"><UserRound size={19} /></Link>
          <Link className="iconButton countWrap" href="/cart" aria-label="Giỏ hàng">
            <ShoppingBag size={19} />{cartCount > 0 ? <span className="countBadge">{cartCount}</span> : null}
          </Link>
          <button className="iconButton mobileMenu" onClick={() => setOpen(true)} aria-label="Mở menu"><Menu size={21} /></button>
        </div>
      </header>
      {open ? (
        <div className="mobileDrawer" role="dialog" aria-modal="true">
          <div className="drawerTop"><span className="brand">ÉLANE®</span><button className="iconButton" onClick={() => setOpen(false)} aria-label="Đóng menu"><X /></button></div>
          <div className="drawerLinks">
            {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
            <Link href="/wishlist" onClick={() => setOpen(false)}>Wishlist</Link>
            <Link href="/orders" onClick={() => setOpen(false)}>Đơn hàng</Link>
          </div>
          <div className="drawerFeature"><div><strong>ÉLANE SERVICE</strong><p>Freeship từ 699K · đổi size 7 ngày · checkout không cần tài khoản.</p></div></div>
        </div>
      ) : null}
    </>
  );
}
