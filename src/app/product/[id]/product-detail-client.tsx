"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, Package, Ruler, ShoppingBag, Star, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/products";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";

export function ProductDetailClient({ productId }: { productId: string }) {
  const { addToCart, toggleWishlist, wishlist, catalog } = useStore();
  const product = catalog.find((item) => item.id === productId && item.active !== false);
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (product && (!size || !product.sizes.includes(size))) setSize(product.sizes[0] ?? "");
  }, [product, size]);

  const related = useMemo(() => product ? catalog
    .filter((item) => item.active !== false && item.id !== product.id && (item.category === product.category || item.style.some((style) => product.style.includes(style))))
    .slice(0, 4) : [], [catalog, product]);

  if (!product) return <div className="emptyState"><div><h2>Sản phẩm không còn hiển thị</h2><p>Sản phẩm có thể đã được ẩn hoặc xóa trong trang quản trị.</p><Link className="btn" href="/shop">Quay lại shop</Link></div></div>;

  const liked = wishlist.includes(product.id);
  function add() {
    if (!product) return;
    addToCart(product, size);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <>
      <section className="productDetail">
        <div className="productGallery">{product.images.map((image, index) => <div className="galleryImage" key={image}><Image src={image} alt={`${product.name} ${index + 1}`} fill priority={index === 0} sizes="(max-width: 760px) 100vw, 50vw" /></div>)}</div>
        <div className="productInfo">
          <p className="eyebrow">{product.isNew ? "NEW ARRIVAL" : "ÉLANE ESSENTIAL"}</p>
          <h1>{product.name}</h1><p className="subtitle">{product.subtitle}</p>
          <div className="ratingLine"><span><Star size={13} fill="currentColor" /> 4.8</span><span>·</span><a href="#reviews">24 đánh giá</a></div>
          <div className="detailPrice">{formatPrice(product.price)} {product.oldPrice ? <><del>{formatPrice(product.oldPrice)}</del><span className="salePercent">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span></> : null}</div>
          <div className="optionLabel"><span>Màu</span><span>{product.color}</span></div>
          <div className="colorSwatchRow"><span className={`swatch swatch-${product.colorFamily}`} /><small>{product.color}</small></div>
          <div className="optionLabel"><span>Chọn size</span><Link href="/size-guide"><Ruler size={13} /> Size guide</Link></div>
          <div className="sizeGrid">{product.sizes.map((value) => <button className={`sizeButton ${size === value ? "active" : ""}`} key={value} onClick={() => setSize(value)}>{value}</button>)}</div>
          <div className="stockNote"><span className="statusDot" /> Còn {product.stock} sản phẩm · {product.stock > 0 ? "sẵn sàng giao" : "tạm hết hàng"}</div>
          <div className="detailActions"><button className="btn" disabled={product.stock <= 0} onClick={add}>{added ? <><Check size={17} /> Đã thêm vào giỏ</> : <><ShoppingBag size={17} /> Thêm vào giỏ</>}</button><button className="btn secondary" aria-label="Yêu thích" onClick={() => toggleWishlist(product.id)}><Heart size={18} fill={liked ? "currentColor" : "none"} /></button></div>
          <button className="buyNow" disabled={product.stock <= 0} onClick={add}>Mua ngay · {formatPrice(product.price)}</button>
          <div className="deliveryHighlights"><div><Truck size={17} /><span><strong>Freeship từ 699K</strong><small>Giao tiêu chuẩn 2–5 ngày</small></span></div><div><Package size={17} /><span><strong>Đổi size trong 7 ngày</strong><small>Áp dụng sản phẩm nguyên tag</small></span></div></div>
          <div className="productAccordions"><details open><summary>Chi tiết sản phẩm</summary><p>SKU: {product.sku ?? product.id}. Chất liệu: {product.material}. Phom: {product.fit}. Thiết kế theo hướng {product.style.join(", ")}.</p></details><details><summary>Chăm sóc sản phẩm</summary><p>Giặt nhẹ với màu tương đồng, tránh sấy nhiệt cao. Ủi mặt trái ở nhiệt độ thấp.</p></details><details><summary>Giao hàng & đổi trả</summary><p>Đơn demo hỗ trợ COD hoặc QR. Có thể đổi size trong 7 ngày nếu sản phẩm còn nguyên trạng và còn tag.</p></details></div>
        </div>
      </section>
      <section className="section relatedSection"><div className="sectionHead"><div><p className="eyebrow">YOU MAY ALSO LIKE</p><h2>Complete the wardrobe</h2></div></div><div className="productGrid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section>
      <section className="reviewsSection" id="reviews"><div><p className="eyebrow">CUSTOMER NOTES</p><h2>4.8 / 5</h2><p>24 đánh giá · 92% khách hàng khuyên mua</p></div><div className="reviewCards"><article><div>★★★★★</div><strong>Form đẹp, dễ phối</strong><p>Chất vải ổn và lên dáng đúng như ảnh. Size khá chuẩn.</p><small>Minh · Đã mua hàng</small></article><article><div>★★★★★</div><strong>Mặc đi làm rất hợp</strong><p>Thiết kế tối giản nên phối với nhiều quần và giày khác nhau.</p><small>An · Đã mua hàng</small></article></div></section>
    </>
  );
}
