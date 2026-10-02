"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useStore } from "./store-provider";

export function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const firstAvailable = product.variants?.find((variant) => variant.stock > 0)?.size ?? product.sizes[0] ?? "";
  const [size, setSize] = useState(firstAvailable);
  const selectedStock = product.variants?.find((variant) => variant.size === size)?.stock ?? product.stock;
  const liked = wishlist.includes(product.id);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="quickViewBackdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div className="quickView">
        <button className="quickViewClose" onClick={onClose} aria-label="Đóng quick view"><X size={19} /></button>
        <div className="quickViewImage"><Image src={product.image} alt={product.name} fill sizes="(max-width:760px) 100vw, 45vw" /></div>
        <div className="quickViewInfo">
          <p className="eyebrow">{product.isNew ? "NEW ARRIVAL" : "QUICK VIEW"}</p>
          <h2>{product.name}</h2><p>{product.subtitle}</p>
          <div className="quickViewPrice">{formatPrice(product.price)} {product.oldPrice ? <del>{formatPrice(product.oldPrice)}</del> : null}</div>
          <div className="optionLabel"><span>Màu</span><span>{product.color}</span></div>
          <div className="colorSwatchRow"><span className={`swatch swatch-${product.colorFamily}`} /><small>{product.color}</small></div>
          <div className="optionLabel"><span>Chọn size</span><span>Còn {selectedStock}</span></div>
          <div className="sizeGrid">{product.sizes.map((value) => { const stock = product.variants?.find((variant) => variant.size === value)?.stock ?? product.stock; return <button disabled={stock <= 0} className={`sizeButton ${size === value ? "active" : ""} ${stock <= 0 ? "soldOut" : ""}`} key={value} onClick={() => setSize(value)}>{value}</button>; })}</div>
          <div className="quickViewActions">
            <button className="btn block" disabled={selectedStock <= 0} onClick={() => { addToCart(product, size); onClose(); }}><ShoppingBag size={16} /> Thêm vào giỏ</button>
            <button className={`btn secondary ${liked ? "active" : ""}`} onClick={() => toggleWishlist(product.id)} aria-label="Yêu thích"><Heart size={16} fill={liked ? "currentColor" : "none"} /> <span>{liked ? "Đã thích" : "Thích"}</span></button>
          </div>
          <Link className="quickViewDetail" href={`/product/${product.id}`} onClick={onClose}>Xem chi tiết sản phẩm <ArrowRight size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
