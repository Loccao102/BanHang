"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useStore } from "./store-provider";
import { QuickView } from "./quick-view";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [quickView, setQuickView] = useState(false);
  const liked = wishlist.includes(product.id);
  const quickSize = product.variants?.find((variant) => variant.stock > 0)?.size ?? product.sizes[0];

  return (
    <>
      <article className="productCard">
        <div className="productMedia">
          <Link href={`/product/${product.id}`}><Image src={product.image} alt={product.name} fill sizes="(max-width: 760px) 50vw, 25vw" /></Link>
          <div className="productBadges">{product.isNew ? <span>NEW</span> : null}{product.oldPrice ? <span>SALE</span> : null}{product.stock <= 5 ? <span>LOW STOCK</span> : null}</div>
          <button className={`heartButton ${liked ? "active" : ""}`} aria-label="Yêu thích" onClick={() => toggleWishlist(product.id)}><Heart size={18} fill={liked ? "currentColor" : "none"} /></button>
          <div className="productHoverActions">
            <button onClick={() => setQuickView(true)}><Eye size={16} /> Quick view</button>
            <button onClick={() => addToCart(product, quickSize)}><ShoppingBag size={16} /> Thêm nhanh</button>
          </div>
        </div>
        <div className="productMeta">
          <div className="productMetaTop"><Link href={`/product/${product.id}`}><h3>{product.name}</h3></Link><span className={`miniSwatch swatch-${product.colorFamily}`} /></div>
          <p>{product.subtitle}</p>
          <div className="priceRow"><strong>{formatPrice(product.price)}</strong>{product.oldPrice ? <del>{formatPrice(product.oldPrice)}</del> : null}</div>
        </div>
      </article>
      {quickView ? <QuickView product={product} onClose={() => setQuickView(false)} /> : null}
    </>
  );
}
