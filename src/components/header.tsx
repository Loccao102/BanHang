"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "./store-provider";

const nav = [
  ["Mới về", "/shop?sort=new"],
  ["Nam", "/shop?gender=men"],
  ["Nữ", "/shop?gender=women"],
  ["Phối đồ AI", "/outfit"],
  ["Thử đồ AI", "/try-on"]
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { cartCount, wishlist } = useStore();

  return (
    <>
      <div className="announcement">FALL / WINTER — FREESHIP ĐƠN TỪ 699K</div>
      <header className="siteHeader">
        <Link className="brand" href="/" aria-label="ÉLANE home">ÉLANE<span>®</span></Link>
        <nav className="desktopNav" aria-label="Điều hướng chính">
          {nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className="headerActions">
          <Link className="iconButton" href="/shop" aria-label="Tìm kiếm"><Search size={19} /></Link>
          <Link className="iconButton countWrap" href="/shop?wishlist=1" aria-label="Yêu thích">
            <Heart size={19} />{wishlist.length > 0 ? <span className="countBadge">{wishlist.length}</span> : null}
          </Link>
          <Link className="iconButton countWrap" href="/cart" aria-label="Giỏ hàng">
            <ShoppingBag size={19} />{cartCount > 0 ? <span className="countBadge">{cartCount}</span> : null}
          </Link>
          <button className="iconButton mobileMenu" onClick={() => setOpen(true)} aria-label="Mở menu"><Menu size={21} /></button>
        </div>
      </header>
      {open ? (
        <div className="mobileDrawer" role="dialog" aria-modal="true">
          <div className="drawerTop"><span className="brand">ÉLANE®</span><button className="iconButton" onClick={() => setOpen(false)}><X /></button></div>
          <div className="drawerLinks">
            {nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
            <Link href="/admin" onClick={() => setOpen(false)}>Admin demo</Link>
          </div>
          <div className="drawerFeature"><Sparkles size={18} /><div><strong>Stylist AI</strong><p>Tìm sản phẩm, phối outfit và thử đồ ngay trên web.</p></div></div>
        </div>
      ) : null}
    </>
  );
}
