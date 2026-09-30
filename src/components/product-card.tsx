"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useStore } from "./store-provider";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const liked = wishlist.includes(product.id);

  return (
    <article className="productCard">
      <div className="productMedia">
        <Link href={`/product/${product.id}`}>
          <Image src={product.image} alt={product.name} fill sizes="(max-width: 760px) 50vw, 25vw" />
        </Link>
        <div className="productBadges">
          {product.isNew ? <span>NEW</span> : null}
          {product.oldPrice ? <span>SALE</span> : null}
        </div>
        <button className={`heartButton ${liked ? "active" : ""}`} aria-label="Yêu thích" onClick={() => toggleWishlist(product.id)}>
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
        </button>
        <button className="quickAdd" onClick={() => addToCart(product, product.sizes[0])}><ShoppingBag size={17} /> Thêm nhanh</button>
      </div>
      <div className="productMeta">
        <Link href={`/product/${product.id}`}><h3>{product.name}</h3></Link>
        <p>{product.subtitle}</p>
        <div className="priceRow"><strong>{formatPrice(product.price)}</strong>{product.oldPrice ? <del>{formatPrice(product.oldPrice)}</del> : null}</div>
      </div>
    </article>
  );
}
