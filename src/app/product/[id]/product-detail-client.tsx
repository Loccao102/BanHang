"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, Package, Ruler, ShoppingBag, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";


export function ProductDetailClient({ productId }: { productId: string }) {
  const { addToCart, toggleWishlist, wishlist, catalog, closeCartDrawer, user } = useStore();
  const router = useRouter();
  const product = catalog.find((item) => item.id === productId && item.active !== false);
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);

  const sizeOptions = useMemo(() => {
    if (!product) return [];
    return product.sizes.map((value) => ({
      size: value,
      stock: product.variants?.find((variant) => variant.size === value)?.stock ?? product.stock
    }));
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const available = sizeOptions.find((item) => item.stock > 0)?.size ?? product.sizes[0] ?? "";
    if (!size || !product.sizes.includes(size)) setSize(available);
  }, [product, size, sizeOptions]);

  useEffect(() => {
    if (!product) return;
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "product_view", productId: product.id, source: "product-detail" })
    }).catch(() => undefined);
  }, [product?.id]);

  const related = useMemo(() => product ? catalog
    .filter((item) => item.active !== false && item.id !== product.id && (item.category === product.category || item.style.some((style) => product.style.includes(style))))
    .slice(0, 4) : [], [catalog, product]);

  const colorVariants = useMemo(() => {
    if (!product?.groupCode) return product ? [product] : [];
    return catalog
      .filter((item) =>
        item.active !== false &&
        item.groupCode === product.groupCode &&
        item.stock > 0
      )
      .sort((a, b) => a.color.localeCompare(b.color, "vi"));
  }, [catalog, product]);

  if (!product) return <div className="emptyState"><div><h2>Sản phẩm không còn hiển thị</h2><p>Thiết kế này có thể đã hết mùa hoặc tạm ngừng bán.</p><Link className="btn" href="/shop">Quay lại LSOUL</Link></div></div>;

  const currentProduct = product;
  const galleryImages = Array.from(new Set([
    ...((currentProduct.images ?? []).filter((value) => typeof value === "string" && value.trim().length > 0)),
    currentProduct.image
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0)));
  const liked = wishlist.includes(currentProduct.id);
  const selectedStock = sizeOptions.find((item) => item.size === size)?.stock ?? 0;

  function add() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/product/${currentProduct.id}`)}`);
      return;
    }
    if (selectedStock <= 0) return;
    addToCart(currentProduct, size);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function buyNow() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/product/${currentProduct.id}`)}`);
      return;
    }
    if (selectedStock <= 0) return;
    addToCart(currentProduct, size);
    closeCartDrawer();
    router.push("/checkout");
  }

  return (
    <>
      <section className="productDetail immersiveProductDetail">
        <div className="productGallery immersiveGallery">
          {galleryImages.length ? galleryImages.map((image, index) => (
            <div className="galleryImage immersiveGalleryImage" data-reveal key={`${image}-${index}`}>
              <Image src={image} alt={`${product.name} ${index + 1}`} fill priority={index === 0} unoptimized sizes="(max-width: 760px) 100vw, 68vw" />
              <span className="immersiveGalleryIndex">{String(index + 1).padStart(2, "0")} / {String(galleryImages.length).padStart(2, "0")}</span>
              {index === 0 ? <div className="immersiveGalleryCaption"><span>LSOUL / PRODUCT STUDY</span><strong>{product.name}</strong></div> : null}
            </div>
          )) : (
            <div className="galleryImage immersiveGalleryImage productImageFallback">
              <div><strong>{product.name}</strong><span>Ảnh sản phẩm đang được cập nhật.</span></div>
            </div>
          )}
        </div>
        <div className="productInfo immersiveProductInfo"><div className="immersiveProductRail"><span>LSOUL</span><span>{product.sku ?? product.id}</span></div>
          <p className="eyebrow">{product.isNew ? "MỚI VỀ / LSOUL" : "THIẾT KẾ LSOUL"}</p>
          <h1>{product.name}</h1><p className="subtitle">{product.subtitle}</p>
          <div className="detailPrice">{formatPrice(product.price)} {product.oldPrice ? <><del>{formatPrice(product.oldPrice)}</del><span className="salePercent">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span></> : null}</div>
          <div className="optionLabel"><span>Màu</span><span>{product.color}</span></div>
          <div className="colorSwatchRow"><span className={`swatch swatch-${product.colorFamily}`} style={product.colorHex ? { backgroundColor: product.colorHex } : undefined} /><small>{product.color}</small></div>
          {colorVariants.length > 1 ? <div className="variantSwatches" aria-label="Các màu cùng thiết kế">{colorVariants.map((item) => <Link key={item.id} href={`/product/${item.id}`} className={item.id === product.id ? "active" : ""} title={item.color}><span className={`miniSwatch swatch-${item.colorFamily}`} style={item.colorHex ? { backgroundColor: item.colorHex } : undefined} /><small>{item.color}</small></Link>)}</div> : null}
          <div className="optionLabel"><span>Chọn cỡ</span><Link href="/size-guide"><Ruler size={13} /> Hướng dẫn chọn cỡ</Link></div>
          <div className="sizeGrid">{sizeOptions.map((item) => <button disabled={item.stock <= 0} className={`sizeButton ${size === item.size ? "active" : ""} ${item.stock <= 0 ? "soldOut" : ""}`} key={item.size} onClick={() => setSize(item.size)}>{item.size}{item.stock <= 0 ? <small>Hết</small> : null}</button>)}</div>
          <div className="detailActions">
            <button className="btn" disabled={selectedStock <= 0} onClick={add}>
              {added ? <><Check size={17} /> Đã thêm vào giỏ</> : <><ShoppingBag size={17} /> Thêm vào giỏ</>}
            </button>
            <button className={`btn secondary heartActionBtn ${liked ? "active" : ""}`} aria-label={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"} onClick={() => toggleWishlist(product.id)}>
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              <span>{liked ? "Đã thích" : "Yêu thích"}</span>
            </button>
          </div>
          <button className="buyNow" disabled={selectedStock <= 0} onClick={buyNow}>Mua ngay · {formatPrice(product.price)}</button>
          <div className="deliveryHighlights"><div><Truck size={17} /><span><strong>Freeship từ 699K</strong><small>Giao tiêu chuẩn 2–5 ngày</small></span></div><div><Package size={17} /><span><strong>Đổi cỡ trong 7 ngày</strong><small>Áp dụng sản phẩm nguyên tag</small></span></div></div>
          <div className="productAccordions"><details open><summary>Chi tiết sản phẩm</summary><p>SKU: {product.sku ?? product.id}. Chất liệu: {product.material}. Phom: {product.fit}. Thiết kế theo tinh thần {product.style.join(", ")}.</p>{product.sourceUpdatedAt ? <small className="productSourceNote">Dữ liệu sản phẩm được đối chiếu ngày {new Intl.DateTimeFormat("vi-VN").format(new Date(product.sourceUpdatedAt))}.{product.sourceUrl ? <> <a href={product.sourceUrl} target="_blank" rel="noreferrer">Xem nguồn</a></> : null}</small> : null}</details><details><summary>Chăm sóc sản phẩm</summary><p>Giặt nhẹ với màu tương đồng, tránh sấy nhiệt cao. Ủi mặt trái ở nhiệt độ thấp.</p></details><details><summary>Giao hàng & đổi trả</summary><p>Hỗ trợ COD hoặc chuyển khoản QR. Có thể đổi cỡ trong 7 ngày nếu sản phẩm còn nguyên trạng và nguyên tag.</p></details></div>
        </div>
      </section>

      <section className="section relatedSection"><div className="sectionHead"><div><p className="eyebrow">PHỐI CÙNG</p><h2>Hoàn thiện bộ đồ</h2></div></div><div className="productGrid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section>
    </>
  );
}
