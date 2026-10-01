"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, Package, Ruler, Share2, ShoppingBag, Star, Truck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";

type ReviewView = {
  id: string;
  rating: number;
  title?: string | null;
  content: string;
  verified: boolean;
  createdAt: string;
  author: string;
};

export function ProductDetailClient({ productId }: { productId: string }) {
  const { addToCart, toggleWishlist, wishlist, catalog, closeCartDrawer, user } = useStore();
  const router = useRouter();
  const product = catalog.find((item) => item.id === productId && item.active !== false);
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);
  const [reviews, setReviews] = useState<ReviewView[]>([]);
  const [reviewAverage, setReviewAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

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

  async function loadReviews() {
    const response = await fetch(`/api/products/${productId}/reviews`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json() as { reviews: ReviewView[]; average: number; count: number; canReview: boolean };
    setReviews(data.reviews);
    setReviewAverage(data.average);
    setReviewCount(data.count);
    setCanReview(data.canReview);
  }

  useEffect(() => {
    void loadReviews();
  }, [productId, user]);

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
  const liked = wishlist.includes(currentProduct.id);
  const selectedStock = sizeOptions.find((item) => item.size === size)?.stock ?? 0;
  const shownAverage = reviewCount ? reviewAverage : product.rating ?? 0;
  const shownCount = reviewCount || product.reviewCount || 0;

  function add() {
    if (selectedStock <= 0) return;
    addToCart(currentProduct, size);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function buyNow() {
    if (selectedStock <= 0) return;
    addToCart(currentProduct, size);
    closeCartDrawer();
    router.push("/checkout");
  }

  async function shareProduct() {
    const url = window.location.href;
    void fetch("/api/social/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "share", channel: typeof navigator.share === "function" ? "native" : "copy", productId: currentProduct.id })
    });
    if (typeof navigator.share === "function") {
      await navigator.share({ title: currentProduct.name, text: currentProduct.subtitle, url }).catch(() => undefined);
    } else {
      await navigator.clipboard.writeText(url);
      setReviewMessage("Đã sao chép link sản phẩm.");
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/products/${currentProduct.id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: Number(data.get("rating")),
        title: data.get("title"),
        content: data.get("content")
      })
    });
    const result = await response.json();
    setReviewMessage(response.ok ? "Cảm ơn bạn. Đánh giá đã được đăng." : result.error ?? "Không thể gửi đánh giá.");
    if (response.ok) {
      (event.currentTarget as HTMLFormElement).reset();
      await loadReviews();
    }
  }

  return (
    <>
      <section className="productDetail immersiveProductDetail">
        <div className="productGallery immersiveGallery">{product.images.map((image, index) => <div className="galleryImage immersiveGalleryImage" data-reveal key={image}><Image src={image} alt={`${product.name} ${index + 1}`} fill priority={index === 0} sizes="(max-width: 760px) 100vw, 68vw" /><span className="immersiveGalleryIndex">{String(index + 1).padStart(2, "0")} / {String(product.images.length).padStart(2, "0")}</span>{index === 0 ? <div className="immersiveGalleryCaption"><span>LSOUL / PRODUCT STUDY</span><strong>{product.name}</strong></div> : null}</div>)}</div>
        <div className="productInfo immersiveProductInfo"><div className="immersiveProductRail"><span>LSOUL</span><span>{product.sku ?? product.id}</span></div>
          <p className="eyebrow">{product.isNew ? "NEW IN / LSOUL" : "LSOUL SIGNATURE"}</p>
          <h1>{product.name}</h1><p className="subtitle">{product.subtitle}</p>
          <div className="ratingLine"><span><Star size={13} fill="currentColor" /> {shownCount ? shownAverage.toFixed(1) : "New"}</span>{shownCount ? <><span>·</span><a href="#reviews">{shownCount} đánh giá</a></> : null}</div>
          <div className="detailPrice">{formatPrice(product.price)} {product.oldPrice ? <><del>{formatPrice(product.oldPrice)}</del><span className="salePercent">-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span></> : null}</div>
          <div className="optionLabel"><span>Màu</span><span>{product.color}</span></div>
          <div className="colorSwatchRow"><span className={`swatch swatch-${product.colorFamily}`} style={product.colorHex ? { backgroundColor: product.colorHex } : undefined} /><small>{product.color}</small></div>
          {colorVariants.length > 1 ? <div className="variantSwatches" aria-label="Các màu cùng thiết kế">{colorVariants.map((item) => <Link key={item.id} href={`/product/${item.id}`} className={item.id === product.id ? "active" : ""} title={item.color}><span className={`miniSwatch swatch-${item.colorFamily}`} style={item.colorHex ? { backgroundColor: item.colorHex } : undefined} /><small>{item.color}</small></Link>)}</div> : null}
          <div className="optionLabel"><span>Chọn size</span><Link href="/size-guide"><Ruler size={13} /> Size guide</Link></div>
          <div className="sizeGrid">{sizeOptions.map((item) => <button disabled={item.stock <= 0} className={`sizeButton ${size === item.size ? "active" : ""} ${item.stock <= 0 ? "soldOut" : ""}`} key={item.size} onClick={() => setSize(item.size)}>{item.size}{item.stock <= 0 ? <small>Hết</small> : null}</button>)}</div>
          <div className="stockNote"><span className="statusDot" /> {selectedStock > 0 ? (product.stockTracked === false ? `Size ${size} đang có sẵn` : `Còn ${selectedStock} sản phẩm size ${size}`) : `Size ${size} tạm hết hàng`}</div>
          <div className="detailActions"><button className="btn" disabled={selectedStock <= 0} onClick={add}>{added ? <><Check size={17} /> Đã thêm vào giỏ</> : <><ShoppingBag size={17} /> Thêm vào giỏ</>}</button><button className="btn secondary" aria-label="Yêu thích" onClick={() => toggleWishlist(product.id)}><Heart size={18} fill={liked ? "currentColor" : "none"} /></button><button className="btn secondary" aria-label="Chia sẻ" onClick={shareProduct}><Share2 size={18} /></button></div>
          <button className="buyNow" disabled={selectedStock <= 0} onClick={buyNow}>Mua ngay · {formatPrice(product.price)}</button>
          <div className="deliveryHighlights"><div><Truck size={17} /><span><strong>Freeship từ 699K</strong><small>Giao tiêu chuẩn 2–5 ngày</small></span></div><div><Package size={17} /><span><strong>Đổi size trong 7 ngày</strong><small>Áp dụng sản phẩm nguyên tag</small></span></div></div>
          <div className="productAccordions"><details open><summary>Chi tiết sản phẩm</summary><p>SKU: {product.sku ?? product.id}. Chất liệu: {product.material}. Phom: {product.fit}. Thiết kế theo tinh thần {product.style.join(", ")}.</p>{product.sourceUpdatedAt ? <small className="productSourceNote">Dữ liệu sản phẩm được đối chiếu ngày {new Intl.DateTimeFormat("vi-VN").format(new Date(product.sourceUpdatedAt))}.{product.sourceUrl ? <> <a href={product.sourceUrl} target="_blank" rel="noreferrer">Xem nguồn</a></> : null}</small> : null}</details><details><summary>Chăm sóc sản phẩm</summary><p>Giặt nhẹ với màu tương đồng, tránh sấy nhiệt cao. Ủi mặt trái ở nhiệt độ thấp.</p></details><details><summary>Giao hàng & đổi trả</summary><p>Hỗ trợ COD hoặc chuyển khoản QR. Có thể đổi size trong 7 ngày nếu sản phẩm còn nguyên trạng và nguyên tag.</p></details></div>
        </div>
      </section>

      <section className="section relatedSection"><div className="sectionHead"><div><p className="eyebrow">STYLE WITH</p><h2>Complete the look</h2></div></div><div className="productGrid">{related.map((item) => <ProductCard product={item} key={item.id} />)}</div></section>

      <section className="reviewsSection" id="reviews">
        <div><p className="eyebrow">VERIFIED REVIEWS</p><h2>{shownCount ? `${shownAverage.toFixed(1)} / 5` : "Chưa có đánh giá"}</h2><p>{shownCount ? `${shownCount} đánh giá từ khách hàng` : "Hãy là người đầu tiên chia sẻ trải nghiệm."}</p></div>
        <div className="reviewStack">
          {canReview ? <form className="reviewForm" onSubmit={submitReview}><strong>Đánh giá sản phẩm đã mua</strong><div className="reviewFormGrid"><select name="rating" defaultValue="5"><option value="5">★★★★★ 5 sao</option><option value="4">★★★★☆ 4 sao</option><option value="3">★★★☆☆ 3 sao</option><option value="2">★★☆☆☆ 2 sao</option><option value="1">★☆☆☆☆ 1 sao</option></select><input name="title" placeholder="Tiêu đề đánh giá" /></div><textarea name="content" minLength={10} required rows={4} placeholder="Chia sẻ cảm nhận về phom, chất liệu và size..." /><button className="btn small" type="submit">Gửi đánh giá</button></form> : null}
          {reviewMessage ? <p className="formSuccess">{reviewMessage}</p> : null}
          <div className="reviewCards">{reviews.length ? reviews.slice(0, 6).map((review) => <article key={review.id}><div>{"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}</div><strong>{review.title || "Đánh giá từ khách hàng"}</strong><p>{review.content}</p><small>{review.author}{review.verified ? " · Đã mua hàng" : ""}</small></article>) : <article><strong>Chưa có review</strong><p>Review xác thực sẽ xuất hiện sau khi khách nhận hàng và đánh giá.</p></article>}</div>
        </div>
      </section>
    </>
  );
}
