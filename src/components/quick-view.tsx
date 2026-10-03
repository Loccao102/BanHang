"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Heart, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { useStore } from "./store-provider";

export function QuickView({ product: initialProduct, onClose }: { product: Product; onClose: () => void }) {
  const { addToCart, toggleWishlist, wishlist, catalog, user } = useStore();
  const [currentProduct, setCurrentProduct] = useState(initialProduct);
  const [imageError, setImageError] = useState(false);
  const [added, setAdded] = useState(false);

  // Sync state if initialProduct changes
  useEffect(() => {
    setCurrentProduct(initialProduct);
    setImageError(false);
  }, [initialProduct]);

  // Color variants from the same design group
  const colorVariants = useMemo(() => {
    if (!currentProduct?.groupCode) return [currentProduct];
    const siblings = catalog
      .filter((item) => item.active !== false && item.groupCode === currentProduct.groupCode)
      .sort((a, b) => a.color.localeCompare(b.color, "vi"));
    return siblings.length ? siblings : [currentProduct];
  }, [catalog, currentProduct]);

  // Safe sizes & variants
  const safeSizes = useMemo(() => {
    if (Array.isArray(currentProduct?.sizes) && currentProduct.sizes.length > 0) {
      return currentProduct.sizes;
    }
    return ["S", "M", "L", "XL"];
  }, [currentProduct?.sizes]);

  const safeVariants = useMemo(() => {
    return Array.isArray(currentProduct?.variants) ? currentProduct.variants : [];
  }, [currentProduct?.variants]);

  const [size, setSize] = useState(() => {
    const firstWithStock = safeVariants.find((v) => v.stock > 0)?.size;
    return firstWithStock ?? safeSizes[0] ?? "S";
  });

  // Keep size in sync when switching colors
  useEffect(() => {
    const available = safeVariants.find((v) => v.stock > 0)?.size ?? safeSizes[0] ?? "S";
    setSize(available);
  }, [currentProduct.id, safeSizes, safeVariants]);

  const selectedStock = safeVariants.find((v) => v.size === size)?.stock ?? currentProduct.stock ?? 12;
  const liked = wishlist.includes(currentProduct.id);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleAddToCart() {
    if (selectedStock <= 0) return;
    addToCart(currentProduct, size);
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
      onClose();
    }, 900);
  }

  const discountPercent = currentProduct.oldPrice
    ? Math.round((1 - currentProduct.price / currentProduct.oldPrice) * 100)
    : 0;

  return (
    <div
      className="quickViewBackdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="quickView" role="dialog" aria-modal="true" aria-labelledby="quickview-title">
        <button className="quickViewClose" onClick={onClose} aria-label="Đóng quick view">
          <X size={18} />
        </button>

        <div className="quickViewImage">
          {!imageError && currentProduct.image ? (
            <Image
              src={currentProduct.image}
              alt={currentProduct.name}
              fill
              unoptimized
              priority
              sizes="(max-width: 760px) 100vw, 460px"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="quickViewImageFallback">
              <span className="fallbackBrand">LSOUL</span>
              <p>{currentProduct.name}</p>
            </div>
          )}
        </div>

        <div className="quickViewInfo">
          <div className="quickViewHeader">
            <p className="eyebrow">{currentProduct.isNew ? "MỚI VỀ · LSOUL" : "XEM NHANH"}</p>
            <h2 id="quickview-title">{currentProduct.name}</h2>
            <p className="quickViewSubtitle">{currentProduct.subtitle}</p>
            <div className="quickViewPrice">
              <strong>{formatPrice(currentProduct.price)}</strong>
              {currentProduct.oldPrice ? (
                <>
                  <del>{formatPrice(currentProduct.oldPrice)}</del>
                  {discountPercent > 0 ? (
                    <span className="quickViewDiscount">-{discountPercent}%</span>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {/* Color variants selector */}
          <div className="quickViewSection">
            <div className="optionLabel">
              <span>Màu sắc</span>
              <strong>{currentProduct.color}</strong>
            </div>
            {colorVariants.length > 1 ? (
              <div className="quickViewColorList">
                {colorVariants.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`quickColorPill ${item.id === currentProduct.id ? "active" : ""}`}
                    onClick={() => {
                      setCurrentProduct(item);
                      setImageError(false);
                    }}
                    title={item.color}
                  >
                    <span
                      className={`miniSwatch swatch-${item.colorFamily}`}
                      style={item.colorHex ? { backgroundColor: item.colorHex } : undefined}
                    />
                    <span>{item.color}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="quickViewSingleColor">
                <span
                  className={`miniSwatch swatch-${currentProduct.colorFamily}`}
                  style={currentProduct.colorHex ? { backgroundColor: currentProduct.colorHex } : undefined}
                />
                <small>{currentProduct.color}</small>
              </div>
            )}
          </div>

          {/* Size selector */}
          <div className="quickViewSection">
            <div className="optionLabel">
              <span>Chọn cỡ</span>
              <span className="stockIndicator">
                {selectedStock > 0 ? `Còn ${selectedStock} sản phẩm` : "Tạm hết cỡ này"}
              </span>
            </div>
            <div className="sizeGrid">
              {safeSizes.map((val) => {
                const stock = safeVariants.find((v) => v.size === val)?.stock ?? currentProduct.stock ?? 12;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={stock <= 0}
                    className={`sizeButton ${size === val ? "active" : ""} ${stock <= 0 ? "soldOut" : ""}`}
                    onClick={() => setSize(val)}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="quickViewActions">
            <button
              type="button"
              className="btn block"
              disabled={selectedStock <= 0}
              onClick={handleAddToCart}
            >
              {added ? (
                <>
                  <Check size={16} /> Đã thêm vào giỏ
                </>
              ) : (
                <>
                  <ShoppingBag size={16} /> {selectedStock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
                </>
              )}
            </button>
            <button
              type="button"
              className={`btn secondary quickHeartBtn ${liked ? "active" : ""}`}
              onClick={() => toggleWishlist(currentProduct.id)}
              aria-label={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
            </button>
          </div>

          <Link
            className="quickViewDetail"
            href={`/product/${currentProduct.id}`}
            onClick={onClose}
          >
            <span>Xem trang chi tiết đầy đủ</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
