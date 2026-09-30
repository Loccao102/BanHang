"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useStore } from "@/components/store-provider";

export function ProductDetailClient({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0]);
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const liked = wishlist.includes(product.id);

  return (
    <section className="productDetail">
      <div className="productGallery">
        {product.images.map((image, index) => <div className="galleryImage" key={image}><Image src={image} alt={`${product.name} ${index + 1}`} fill priority={index === 0} sizes="(max-width: 760px) 100vw, 50vw" /></div>)}
      </div>
      <div className="productInfo">
        <p className="eyebrow">{product.isNew ? "NEW ARRIVAL" : "ÉLANE ESSENTIAL"}</p>
        <h1>{product.name}</h1>
        <p className="subtitle">{product.subtitle}</p>
        <div className="detailPrice">{formatPrice(product.price)} {product.oldPrice ? <del>{formatPrice(product.oldPrice)}</del> : null}</div>
        <div className="optionLabel"><span>Màu</span><span>{product.color}</span></div>
        <div className="optionLabel"><span>Chọn size</span><span>Còn {product.stock}</span></div>
        <div className="sizeGrid">{product.sizes.map((value) => <button className={`sizeButton ${size === value ? "active" : ""}`} key={value} onClick={() => setSize(value)}>{value}</button>)}</div>
        <div className="detailActions">
          <button className="btn" onClick={() => addToCart(product, size)}><ShoppingBag size={17} /> Thêm vào giỏ</button>
          <button className="btn secondary" aria-label="Yêu thích" onClick={() => toggleWishlist(product.id)}><Heart size={18} fill={liked ? "currentColor" : "none"} /></button>
        </div>
        <div className="heroActions">
          <Link className="btn ghost small" href={`/outfit?product=${product.id}`}><Sparkles size={15} /> Phối với món này</Link>
          {product.category !== "shoes" && product.category !== "accessory" ? <Link className="btn ghost small" href={`/try-on?product=${product.id}`}><WandSparkles size={15} /> Thử đồ AI</Link> : null}
        </div>
        <div className="infoList">
          <div><span>Chất liệu</span><strong>{product.material}</strong></div>
          <div><span>Phom dáng</span><strong>{product.fit}</strong></div>
          <div><span>Phong cách</span><strong>{product.style.join(" · ")}</strong></div>
          <div><span>Phù hợp</span><strong>{product.occasion.join(" · ")}</strong></div>
        </div>
      </div>
    </section>
  );
}
