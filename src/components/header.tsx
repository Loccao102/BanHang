"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useStore } from "./store-provider";
import { SearchOverlay } from "./search-overlay";

const nav = [
  ["Mới về", "/shop?sort=new"],
  ["Nữ", "/shop?gender=women"],
  ["Nam", "/shop?gender=men"],
  ["Áo khoác", "/shop?category=outerwear"],
  ["Sale", "/shop?sale=1"]
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, wishlist, settings, user, openCartDrawer } = useStore();
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <div className="announcement">{settings.promoText}</div>
      <header className="siteHeader">
        <Link className="brand" href="/" aria-label="ÉLANE home">ÉLANE<span>®</span></Link>
        <nav className="desktopNav" aria-label="Điều hướng chính">{nav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
        <div className="headerActions">
          <button className="iconButton" onClick={() => setSearchOpen(true)} aria-label="Tìm kiếm"><Search size={19} /></button>
          <Link className="iconButton countWrap" href="/wishlist" aria-label="Yêu thích"><Heart size={19} />{wishlist.length > 0 ? <span className="countBadge">{wishlist.length}</span> : null}</Link>
          <Link className={`iconButton accountIcon ${user ? "signedIn" : ""}`} href={user ? "/account" : "/login"} aria-label={user ? `Tài khoản ${user.name}` : "Đăng nhập"}>{user ? <span className="userInitial">{user.name.trim().charAt(0).toUpperCase()}</span> : <UserRound size={19} />}</Link>
          <button className="iconButton countWrap" onClick={openCartDrawer} aria-label="Giỏ hàng"><ShoppingBag size={19} />{cartCount > 0 ? <span className="countBadge">{cartCount}</span> : null}</button>
          <button className="iconButton mobileMenu" onClick={() => setOpen(true)} aria-label="Mở menu"><Menu size={21} /></button>
        </div>
      </header>
      {open ? <div className="mobileDrawer" role="dialog" aria-modal="true"><div className="drawerTop"><span className="brand">ÉLANE®</span><button className="iconButton" onClick={() => setOpen(false)} aria-label="Đóng menu"><X /></button></div><div className="drawerLinks">{nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<button className="drawerSearchLink" onClick={() => { setOpen(false); setSearchOpen(true); }}>Tìm kiếm</button><Link href="/wishlist" onClick={() => setOpen(false)}>Wishlist</Link><Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)}>{user ? "Tài khoản của tôi" : "Đăng nhập"}</Link></div><div className="drawerFeature"><div><strong>ÉLANE SERVICE</strong><p>Freeship từ 699K · đổi size 7 ngày · thanh toán COD hoặc QR.</p></div></div></div> : null}
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
