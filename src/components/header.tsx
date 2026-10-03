"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { useStore } from "./store-provider";
import { SearchOverlay } from "./search-overlay";

const nav = [
  ["Mới về", "/shop?sort=new"],
  ["Đầm", "/shop?category=dress"],
  ["Áo & Corset", "/shop?category=tops"],
  ["Set đồ", "/shop?category=set"],
  ["Áo khoác", "/shop?category=outerwear"],
  ["Phối đồ AI", "/outfit"],
  ["Thử đồ AI", "/try-on"],
  ["Cộng đồng", "/social"],
  ["Giảm giá", "/shop?sale=1"]
];

const megaGroups = [
  {
    title: "Mua sắm",
    links: [["Mới về", "/shop?sort=new"], ["Đầm", "/shop?category=dress"], ["Áo / corset", "/shop?category=tops"], ["Quần & chân váy", "/shop?category=bottoms"], ["Áo khoác", "/shop?category=outerwear"], ["Đang giảm giá", "/shop?sale=1"]]
  },
  {
    title: "Khám phá",
    links: [["Cộng đồng LSOUL", "/social"], ["Phòng thử đồ AI", "/try-on"], ["Được yêu thích", "/shop?sort=featured"], ["Hướng dẫn chọn cỡ", "/size-guide"], ["Về LSOUL", "/about"]]
  }
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, wishlist, settings, user, openCartDrawer } = useStore();
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <div className="announcement">{settings.promoText}</div>
      <header className="siteHeader">
        <Link className="brand" href="/" aria-label="LSOUL home">
          LSOUL<span>®</span>
        </Link>

        <nav className="desktopNav" aria-label="Điều hướng chính">
          {nav.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={href.includes("sale=1") ? "saleNavHighlight" : ""}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="headerActions">
          <button className="iconButton" onClick={() => setSearchOpen(true)} aria-label="Tìm kiếm">
            <Search size={19} />
          </button>
          <Link className="iconButton countWrap" href="/wishlist" aria-label="Yêu thích">
            <Heart size={19} />
            {wishlist.length > 0 ? <span className="countBadge">{wishlist.length}</span> : null}
          </Link>
          <Link
            className={`iconButton accountIcon ${user ? "signedIn" : ""}`}
            href={user ? "/account" : "/login"}
            aria-label={user ? `Tài khoản ${user.name}` : "Đăng nhập"}
          >
            {user ? (
              <span className="userInitial">{user.name.trim().charAt(0).toUpperCase()}</span>
            ) : (
              <UserRound size={19} />
            )}
          </Link>
          <button className="iconButton countWrap" onClick={openCartDrawer} aria-label="Giỏ hàng">
            <ShoppingBag size={19} />
            {cartCount > 0 ? <span className="countBadge">{cartCount}</span> : null}
          </button>
          <button className="iconButton mobileMenu" onClick={() => setOpen(true)} aria-label="Mở menu">
            <Menu size={21} />
          </button>
        </div>
      </header>

      {open ? (
        <div className="mobileDrawer luxMobileDrawer" role="dialog" aria-modal="true">
          <div className="drawerTop">
            <span className="brand">LSOUL®</span>
            <button className="iconButton" onClick={() => setOpen(false)} aria-label="Đóng menu">
              <X />
            </button>
          </div>
          <div className="drawerLinks">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <button
              className="drawerSearchLink"
              onClick={() => {
                setOpen(false);
                setSearchOpen(true);
              }}
            >
              Tìm kiếm
            </button>
            <Link href="/wishlist" onClick={() => setOpen(false)}>
              Yêu thích
            </Link>
            <Link href={user ? "/account" : "/login"} onClick={() => setOpen(false)}>
              {user ? "Tài khoản của tôi" : "Đăng nhập"}
            </Link>
          </div>
          <div className="drawerFeature">
            <div>
              <strong>DỊCH VỤ LSOUL</strong>
              <p>Miễn phí giao hàng từ 699K · đổi cỡ trong 7 ngày · thanh toán COD hoặc QR.</p>
            </div>
          </div>
        </div>
      ) : null}

      <SearchOverlay open={searchOpen} onClose={closeSearch} />
    </>
  );
}
