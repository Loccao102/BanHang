"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useStore } from "./store-provider";
import { SearchOverlay } from "./search-overlay";

const nav = [
  ["Mới về", "/shop?sort=new"],
  ["Đầm", "/shop?category=dress"],
  ["Áo", "/shop?category=tops"],
  ["Set đồ", "/shop?category=set"],
  ["Áo khoác", "/shop?category=outerwear"],
  ["Sale", "/shop?sale=1"]
];

const megaGroups = [
  {
    title: "Shop",
    links: [["New arrivals", "/shop?sort=new"], ["Dresses", "/shop?category=dress"], ["Corsets & tops", "/shop?category=tops"], ["Matching sets", "/shop?category=set"], ["Outerwear", "/shop?category=outerwear"], ["Sale edit", "/shop?sale=1"]]
  },
  {
    title: "Discover",
    links: [["LSOUL Social", "/social"], ["Most wanted", "/shop?sort=featured"], ["Size guide", "/size-guide"], ["About LSOUL", "/about"]]
  }
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, wishlist, settings, user, openCartDrawer } = useStore();
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <div className="announcement">{settings.promoText}</div>
      <header className={`siteHeader ${megaOpen ? "megaActive" : ""}`}>
        <Link className="brand" href="/" aria-label="LSOUL home" onMouseEnter={() => setMegaOpen(false)}>LSOUL<span>®</span></Link>
        <nav className="desktopNav" aria-label="Điều hướng chính">
          <button className="megaTrigger" onMouseEnter={() => setMegaOpen(true)} onFocus={() => setMegaOpen(true)}>Collections</button>
          {nav.slice(0, 3).map(([label, href]) => <Link key={href} href={href} onMouseEnter={() => setMegaOpen(false)}>{label}</Link>)}
          <Link href="/social" onMouseEnter={() => setMegaOpen(false)}>Social</Link>
          <Link href="/shop?sale=1" onMouseEnter={() => setMegaOpen(false)}>Sale</Link>
        </nav>
        <div className="headerActions" onMouseEnter={() => setMegaOpen(false)}>
          <button className="iconButton" onClick={() => setSearchOpen(true)} aria-label="Tìm kiếm"><Search size={19} /></button>
          <Link className="iconButton countWrap" href="/wishlist" aria-label="Yêu thích"><Heart size={19} />{wishlist.length > 0 ? <span className="countBadge">{wishlist.length}</span> : null}</Link>
          <Link className={`iconButton accountIcon ${user ? "signedIn" : ""}`} href={user ? "/account" : "/login"} aria-label={user ? `Tài khoản ${user.name}` : "Đăng nhập"}>{user ? <span className="userInitial">{user.name.trim().charAt(0).toUpperCase()}</span> : <UserRound size={19} />}</Link>
          <button className="iconButton countWrap" onClick={openCartDrawer} aria-label="Giỏ hàng"><ShoppingBag size={19} />{cartCount > 0 ? <span className="countBadge">{cartCount}</span> : null}</button>
          <button className="iconButton mobileMenu" onClick={() => setOpen(true)} aria-label="Mở menu"><Menu size={21} /></button>
        </div>
      </header>

      <div className={`luxMegaMenu ${megaOpen ? "isOpen" : ""}`} onMouseLeave={() => setMegaOpen(false)}>
        <div className="luxMegaInner">
          <div className="luxMegaLinks">
            {megaGroups.map((group) => (
              <div key={group.title}>
                <span>{group.title}</span>
                {group.links.map(([label, href]) => <Link href={href} key={href} onClick={() => setMegaOpen(false)}>{label}<ChevronRight size={14} /></Link>)}
              </div>
            ))}
          </div>
          <Link className="luxMegaCampaign" href="/shop?sort=new" onClick={() => setMegaOpen(false)}>
            <Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=90" alt="LSOUL new campaign" fill sizes="38vw" />
            <div><span>Campaign 26</span><strong>Feminine.<br />Never quiet.</strong><em>Discover the new collection <ChevronRight size={14} /></em></div>
          </Link>
        </div>
      </div>

      {open ? <div className="mobileDrawer luxMobileDrawer" role="dialog" aria-modal="true"><div className="drawerTop"><span className="brand">LSOUL®</span><button className="iconButton" onClick={() => setOpen(false)} aria-label="Đóng menu"><X /></button></div><div className="drawerLinks">{nav.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}<button className="drawerSearchLink" onClick={() => { setOpen(false); setSearchOpen(true); }}>Tìm kiếm</button><Link href="/social" onClick={() => setOpen(false)}>LSOUL Social</Link><Link href="/wishlist" onClick={() => setOpen(false)}>Wishlist</Link><Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)}>{user ? "Tài khoản của tôi" : "Đăng nhập"}</Link></div><div className="drawerFeature"><div><strong>LSOUL SERVICE</strong><p>Freeship từ 699K · đổi size 7 ngày · thanh toán COD hoặc QR.</p></div></div></div> : null}
      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
