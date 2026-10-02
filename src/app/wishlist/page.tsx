"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store-provider";

export default function WishlistPage() {
  const { wishlist, catalog } = useStore();
  const items = catalog.filter((product) => product.active !== false && wishlist.includes(product.id));
  const [selected, setSelected] = useState<string[]>([]);

  const tryOnHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("products", selected.join(","));
    return `/try-on?${params.toString()}`;
  }, [selected]);

  function toggle(productId: string) {
    setSelected((current) => {
      if (current.includes(productId)) return current.filter((id) => id !== productId);
      if (current.length >= 3) return current;
      return [...current, productId];
    });
  }

  if (!items.length) return <div className="emptyState"><div><Heart size={36} /><h2>Wishlist đang trống</h2><p>Lưu những món bạn thích để quay lại nhanh hơn.</p><Link className="btn" href="/shop">Khám phá sản phẩm</Link></div></div>;

  return (
    <section className="wishlistPage wishlistTryonPage">
      <div className="wishlistHeader wishlistTryonHeader">
        <div><p className="eyebrow">SAVED FOR LATER</p><h1>Wishlist</h1><p>{items.length} sản phẩm đã lưu. Chọn tối đa 3 món để thử cùng nhau.</p></div>
        <div className="wishlistTryonAction">
          <span>{selected.length}/3 món đã chọn</span>
          <Link className={`btn ${selected.length ? "" : "disabled"}`} href={selected.length ? tryOnHref : "#"}>
            <Sparkles size={15} /> Thử đồ từ wishlist
          </Link>
        </div>
      </div>

      <div className="wishlistSelectableGrid">
        {items.map((product) => (
          <div className={`wishlistSelectableItem ${selected.includes(product.id) ? "selected" : ""}`} key={product.id}>
            <button className="wishlistSelectToggle" onClick={() => toggle(product.id)} aria-label={`Chọn ${product.name} để thử đồ`}>
              <span>{selected.includes(product.id) ? "✓" : "+"}</span>
              {selected.includes(product.id) ? "Đã chọn thử" : "Chọn để thử"}
            </button>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
