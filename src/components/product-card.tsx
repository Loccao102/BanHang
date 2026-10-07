"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useStore } from "./store-provider";
import { QuickView } from "./quick-view";

type ProductCardProps = {
  product: Product;
  colorVariants?: Product[];
};

export function ProductCard({ product, colorVariants }: ProductCardProps) {
  const { addToCart, toggleWishlist, wishlist } = useStore();

  const variants = useMemo(() => {
    const source = colorVariants?.length ? colorVariants : [product];
    return Array.from(new Map(source.map((item) => [item.id, item])).values());
  }, [colorVariants, product]);

  const [selectedProductId, setSelectedProductId] = useState(product.id);
  const [quickView, setQuickView] = useState(false);

  useEffect(() => {
    setSelectedProductId(product.id);
  }, [product.id]);

  const selectedProduct = variants.find((item) => item.id === selectedProductId) ?? product;
  const liked = wishlist.includes(selectedProduct.id);
  const quickSize =
    selectedProduct.variants?.find((variant) => variant.stock > 0)?.size ??
    (Array.isArray(selectedProduct.sizes) ? selectedProduct.sizes[0] : "S");

  return (
    <>
      <article className="productCard">
        <div className="productMedia">
          <Link href={`/product/${selectedProduct.id}`} aria-label={selectedProduct.name}>
            <Image
              className="productImagePrimary"
              src={selectedProduct.image}
              alt={selectedProduct.name}
              fill
              unoptimized
              sizes="(max-width: 760px) 50vw, 25vw"
            />
          </Link>
          <div className="productBadges">
            {selectedProduct.isNew ? <span>MỚI</span> : null}
            {selectedProduct.oldPrice ? <span>GIẢM GIÁ</span> : null}
            {selectedProduct.stock <= 5 ? <span>SẮP HẾT</span> : null}
          </div>
          <button
            className={`heartButton ${liked ? "active" : ""}`}
            aria-label="Yêu thích"
            onClick={() => toggleWishlist(selectedProduct.id)}
          >
            <Heart size={18} fill={liked ? "currentColor" : "none"} />
          </button>
          <div className="productHoverActions">
            <button onClick={() => setQuickView(true)}><Eye size={16} /> Xem nhanh</button>
            <button onClick={() => addToCart(selectedProduct, quickSize)}><ShoppingBag size={16} /> Thêm nhanh</button>
          </div>
        </div>

        <div className="productMeta">
          <div className="productMetaTop">
            <Link href={`/product/${selectedProduct.id}`}><h3>{selectedProduct.name}</h3></Link>
          </div>
          <p>{selectedProduct.subtitle}</p>

          {variants.length > 1 ? (
            <div className="productColorRow">
              <div className="productColorSwatches" aria-label="Chọn màu">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={`productColorSwatch ${selectedProduct.id === variant.id ? "active" : ""}`}
                    style={{ backgroundColor: variant.colorHex ?? "#d8d3cb" }}
                    aria-label={`Màu ${variant.color}`}
                    aria-pressed={selectedProduct.id === variant.id}
                    title={variant.color}
                    onClick={() => setSelectedProductId(variant.id)}
                  />
                ))}
              </div>
              <span className="productColorName">{selectedProduct.color}</span>
            </div>
          ) : null}

          <div className="priceRow">
            <strong>{formatPrice(selectedProduct.price)}</strong>
            {selectedProduct.oldPrice ? <del>{formatPrice(selectedProduct.oldPrice)}</del> : null}
          </div>
        </div>
      </article>

      {quickView ? <QuickView product={selectedProduct} onClose={() => setQuickView(false)} /> : null}
    </>
  );
}
