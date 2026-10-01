"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
import { products } from "@/lib/products";

export default function WishlistPage() {
  const { wishlist } = useStore();
  const items = products.filter((product) => wishlist.includes(product.id));

  if (!items.length) return <div className="emptyState"><div><Heart size={36} /><h2>Wishlist đang trống</h2><p>Lưu những món bạn thích để quay lại nhanh hơn.</p><Link className="btn" href="/shop">Khám phá sản phẩm</Link></div></div>;

  return (
    <section className="wishlistPage">
      <div className="wishlistHeader"><p className="eyebrow">SAVED FOR LATER</p><h1>Wishlist</h1><p style={{color:"var(--muted)"}}>{items.length} sản phẩm đã lưu.</p></div>
      <div className="productGrid">{items.map((product) => <ProductCard product={product} key={product.id} />)}</div>
    </section>
  );
}
