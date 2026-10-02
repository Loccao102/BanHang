"use client";

import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
import {
  normalizeOutfitSelection,
  outfitLabel,
  wardrobeGroup,
  wardrobeGroupDescriptions,
  wardrobeGroupLabels,
  type WardrobeGroup
} from "@/lib/wardrobe";

const groupOrder: WardrobeGroup[] = ["tops", "bottoms", "dresses", "outerwear", "sets"];

export default function WishlistPage() {
  const { wishlist, catalog } = useStore();
  const items = catalog.filter((product) => product.active !== false && wishlist.includes(product.id));
  const [selected, setSelected] = useState<string[]>([]);

  const selectedProducts = selected.flatMap((id) => {
    const product = catalog.find((item) => item.id === id);
    return product ? [product] : [];
  });

  const tryOnHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("products", selected.join(","));
    return `/try-on?${params.toString()}`;
  }, [selected]);

  function toggle(productId: string) {
    const product = catalog.find((item) => item.id === productId);
    if (!product) return;
    setSelected((current) => normalizeOutfitSelection(current, product, catalog));
  }

  if (!items.length) {
    return <div className="emptyState"><div><Heart size={36} /><h2>Wishlist đang trống</h2><p>Lưu những món bạn thích để quay lại nhanh hơn.</p><Link className="btn" href="/shop">Khám phá sản phẩm</Link></div></div>;
  }

  return (
    <section className="wishlistPage wardrobeWishlistPage">
      <div className="wishlistHeader wardrobeWishlistHeader">
        <div>
          <p className="eyebrow">YOUR SAVED WARDROBE</p>
          <h1>Wishlist</h1>
          <p>{items.length} sản phẩm đã lưu · chọn theo nhóm để phối thành một look hợp lệ.</p>
        </div>
        <div className="wardrobeSelectionSummary">
          <span>LOOK ĐANG CHỌN</span>
          <strong>{outfitLabel(selectedProducts)}</strong>
          <small>{selectedProducts.length ? selectedProducts.map((product) => product.name).join(" · ") : "Chọn áo + quần/chân váy (+ áo khoác), hoặc chọn một váy/set riêng."}</small>
          <Link className={`btn ${selected.length ? "" : "disabled"}`} href={selected.length ? tryOnHref : "#"}>
            <Sparkles size={15} /> Thử look này
          </Link>
        </div>
      </div>

      <div className="wardrobeGroups">
        {groupOrder.map((group) => {
          const groupItems = items.filter((product) => wardrobeGroup(product) === group);
          if (!groupItems.length) return null;

          return (
            <section className="wardrobeGroupSection" key={group}>
              <div className="wardrobeGroupHead">
                <div><span>{String(groupOrder.indexOf(group) + 1).padStart(2, "0")}</span><h2>{wardrobeGroupLabels[group]}</h2></div>
                <p>{wardrobeGroupDescriptions[group]}</p>
              </div>
              <div className="wishlistSelectableGrid">
                {groupItems.map((product) => (
                  <div className={`wishlistSelectableItem ${selected.includes(product.id) ? "selected" : ""}`} key={product.id}>
                    <button className="wishlistSelectToggle" onClick={() => toggle(product.id)} aria-label={`Chọn ${product.name} để thử đồ`}>
                      <span>{selected.includes(product.id) ? "✓" : "+"}</span>
                      {selected.includes(product.id) ? "Đang trong look" : "Phối món này"}
                    </button>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
