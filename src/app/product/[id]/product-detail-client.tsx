"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Heart, Package, Ruler, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/products";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";
import { coordinateSmartOutfit } from "@/lib/stylist-outfit-engine";

export function ProductDetailClient({ productId }: { productId: string }) {
  const { addToCart, addBundleToCart, toggleWishlist, wishlist, catalog, closeCartDrawer, user } = useStore();
  const router = useRouter();
  const product = catalog.find((item) => item.id === productId && item.active !== false);
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const pairedOutfit = useMemo(
    () => (product ? coordinateSmartOutfit({ catalog, requiredProductId: product.id }) : null),
    [catalog, product?.id]
  );

  const sizeOptions = useMemo(() => {
    if (!product) return [];
    const safeSizes = Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : ["S", "M", "L", "XL"];
    return safeSizes.map((value) => ({
      size: value,
      stock: product.variants?.find((variant) => variant.size === value)?.stock ?? product.stock ?? 12
    }));
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const available = sizeOptions.find((item) => item.stock > 0)?.size ?? sizeOptions[0]?.size ?? "M";
    if (!size || !sizeOptions.some((item) => item.size === size)) {
      setSize(available);
    }
  }, [product, size, sizeOptions]);

  // Reset active image index on product change
  useEffect(() => {
    setActiveImageIndex(0);
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "product_view", productId: product.id, source: "product-detail" })
    }).catch(() => undefined);
  }, [product?.id]);

  const related = useMemo(() => {
    if (!product) return [];
    return catalog
      .filter((item) => item.active !== false && item.id !== product.id && (item.category === product.category || item.style.some((style) => product.style.includes(style))))
      .slice(0, 4);
  }, [catalog, product]);

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

  if (!product) {
    return (
      <div className="emptyState">
        <div>
          <h2>Sản phẩm không còn hiển thị</h2>
          <p>Thiết kế này có thể đã hết mùa hoặc tạm ngừng bán.</p>
          <Link className="btn" href="/shop">Quay lại cửa hàng</Link>
        </div>
      </div>
    );
  }

  const currentProduct = product;
  const galleryImages = Array.from(new Set([
    currentProduct.image,
    ...((currentProduct.images ?? []).filter((value) => typeof value === "string" && value.trim().length > 0))
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0)));

  const liked = wishlist.includes(currentProduct.id);
  const selectedStock = sizeOptions.find((item) => item.size === size)?.stock ?? 0;
  const currentImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? currentProduct.image;
  const discountPercent = currentProduct.oldPrice
    ? Math.round((1 - currentProduct.price / currentProduct.oldPrice) * 100)
    : 0;

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
        {/* Left Side: Product Gallery */}
        <div className="productGallery immersiveGallery">
          <div className="galleryMainView">
            {currentImage ? (
              <div className="galleryImage immersiveGalleryImage">
                <Image
                  src={currentImage}
                  alt={`${product.name} - ${activeImageIndex + 1}`}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 760px) 100vw, 55vw"
                />
                <span className="immersiveGalleryIndex">
                  {String(activeImageIndex + 1).padStart(2, "0")} / {String(galleryImages.length || 1).padStart(2, "0")}
                </span>
              </div>
            ) : (
              <div className="galleryImage immersiveGalleryImage productImageFallback">
                <div>
                  <strong>{product.name}</strong>
                  <span>Ảnh sản phẩm đang được cập nhật.</span>
                </div>
              </div>
            )}
          </div>

          {/* Thumbnail list when multiple images exist */}
          {galleryImages.length > 1 ? (
            <div className="galleryThumbnailRow" aria-label="Danh sách hình ảnh sản phẩm">
              {galleryImages.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  className={`galleryThumbBtn ${idx === activeImageIndex ? "active" : ""}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                >
                  <Image src={img} alt={`Ảnh nhỏ ${idx + 1}`} fill unoptimized sizes="80px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Right Side: Product Info */}
        <div className="productInfo immersiveProductInfo">
          <div className="detailHeaderGroup">
            <div className="detailEyebrowRow">
              <span className="detailEyebrow">{product.isNew ? "MỚI VỀ · THIẾT KẾ LSOUL" : "THIẾT KẾ CHÍNH HÃNG LSOUL"}</span>
              <span className="detailSku">{product.sku ?? product.id}</span>
            </div>
            <h1 className="detailTitle">{product.name}</h1>
            <p className="detailSubtitle">{product.subtitle}</p>
          </div>

          <div className="detailPriceRow">
            <span className="mainPrice">{formatPrice(product.price)}</span>
            {product.oldPrice ? (
              <>
                <del className="oldPrice">{formatPrice(product.oldPrice)}</del>
                {discountPercent > 0 ? (
                  <span className="salePercentBadge">-{discountPercent}%</span>
                ) : null}
              </>
            ) : null}
          </div>

          {/* Color Selection: Clean, non-redundant UI */}
          <div className="detailSectionBlock">
            <div className="detailOptionLabel">
              <span>Màu sắc</span>
              <strong>{product.color}</strong>
            </div>

            {colorVariants.length > 1 ? (
              <div className="detailColorPillGroup" aria-label="Chọn màu sắc thiết kế">
                {colorVariants.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    className={`detailColorPill ${item.id === product.id ? "active" : ""}`}
                    title={item.color}
                  >
                    <span
                      className={`miniSwatch swatch-${item.colorFamily}`}
                      style={item.colorHex ? { backgroundColor: item.colorHex } : undefined}
                    />
                    <span>{item.color}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="detailSingleColor">
                <span
                  className={`miniSwatch swatch-${product.colorFamily}`}
                  style={product.colorHex ? { backgroundColor: product.colorHex } : undefined}
                />
                <span>{product.color}</span>
              </div>
            )}
          </div>

          {/* Size Selection */}
          <div className="detailSectionBlock">
            <div className="detailOptionLabel">
              <span>Chọn cỡ</span>
              <Link href="/size-guide" className="detailSizeGuideLink">
                <Ruler size={13} />
                <span>Hướng dẫn chọn cỡ</span>
              </Link>
            </div>
            <div className="sizeGrid">
              {sizeOptions.map((item) => (
                <button
                  key={item.size}
                  type="button"
                  disabled={item.stock <= 0}
                  className={`sizeButton ${size === item.size ? "active" : ""} ${item.stock <= 0 ? "soldOut" : ""}`}
                  onClick={() => setSize(item.size)}
                >
                  {item.size}
                  {item.stock <= 0 ? <small>Hết</small> : null}
                </button>
              ))}
            </div>
            <div className="detailStockNote">
              {selectedStock > 0 ? (
                selectedStock <= 5 ? (
                  <span className="stockLow">Chỉ còn {selectedStock} sản phẩm - Sắp hết!</span>
                ) : (
                  <span className="stockOk">Còn {selectedStock} sản phẩm sẵn sàng giao</span>
                )
              ) : (
                <span className="stockOut">Tạm hết cỡ này</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="detailActionRow">
            <button
              type="button"
              className="btn block detailAddBtn"
              disabled={selectedStock <= 0}
              onClick={add}
            >
              {added ? (
                <>
                  <Check size={18} /> Đã thêm vào giỏ hàng
                </>
              ) : (
                <>
                  <ShoppingBag size={18} /> {selectedStock <= 0 ? "Tạm hết hàng" : "Thêm vào giỏ"}
                </>
              )}
            </button>
            <button
              type="button"
              className={`btn secondary heartActionBtn ${liked ? "active" : ""}`}
              aria-label={liked ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              onClick={() => toggleWishlist(product.id)}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              <span>{liked ? "Đã thích" : "Yêu thích"}</span>
            </button>
          </div>

          <button
            type="button"
            className="detailBuyNowBtn"
            disabled={selectedStock <= 0}
            onClick={buyNow}
          >
            Mua ngay · {formatPrice(product.price)}
          </button>

          {/* Service Trust Badges */}
          <div className="detailTrustBadges">
            <div className="trustItem">
              <Truck size={17} />
              <div>
                <strong>Freeship từ 699.000đ</strong>
                <p>Giao hàng toàn quốc 2–5 ngày</p>
              </div>
            </div>
            <div className="trustItem">
              <Package size={17} />
              <div>
                <strong>Đổi cỡ trong 7 ngày</strong>
                <p>Hỗ trợ đổi tận nơi nguyên tem tag</p>
              </div>
            </div>
            <div className="trustItem">
              <ShieldCheck size={17} />
              <div>
                <strong>Chính hãng LSOUL</strong>
                <p>Đồng kiểm tra hàng trước khi nhận</p>
              </div>
            </div>
          </div>

          {/* Product Accordions */}
          <div className="detailAccordions">
            <details open>
              <summary>Chi tiết sản phẩm</summary>
              <div className="accordionContent">
                <p>
                  <strong>Mã sản phẩm:</strong> {product.sku ?? product.id}
                </p>
                <p>
                  <strong>Chất liệu:</strong> {product.material}
                </p>
                <p>
                  <strong>Kiểu dáng / Phom:</strong> {product.fit}
                </p>
                <p>
                  <strong>Phong cách:</strong> {product.style.join(", ")}
                </p>
                {product.sourceUpdatedAt ? (
                  <small className="productSourceNote">
                    Dữ liệu sản phẩm đối chiếu ngày {new Intl.DateTimeFormat("vi-VN").format(new Date(product.sourceUpdatedAt))}.
                    {product.sourceUrl ? (
                      <> <a href={product.sourceUrl} target="_blank" rel="noreferrer">Xem nguồn</a></>
                    ) : null}
                  </small>
                ) : null}
              </div>
            </details>
            <details>
              <summary>Hướng dẫn bảo quản</summary>
              <div className="accordionContent">
                <p>Giặt nhẹ nhàng bằng tay hoặc máy ở chế độ giặt đồ len/tơ tằm, nhiệt độ nước dưới 30°C.</p>
                <p>Tránh sấy nhiệt cao hoặc phơi dưới ánh nắng gắt. Ủi ở mặt trái với nhiệt độ thấp.</p>
              </div>
            </details>
            <details>
              <summary>Chính sách giao hàng & đổi trả</summary>
              <div className="accordionContent">
                <p>Hỗ trợ thanh toán khi nhận hàng (COD) hoặc chuyển khoản QR tự động.</p>
                <p>Khách hàng được quyền kiểm tra hàng khi nhận và đổi size miễn phí trong 7 ngày đối với sản phẩm còn nguyên tem mác.</p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* AI Stylist Coordinated Set Section */}
      {pairedOutfit && pairedOutfit.items.length > 1 ? (
        <section className="section pairedOutfitSection">
          <div className="sectionHead">
            <div>
              <p className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#1677ff" }}>
                <Sparkles size={14} />
                AI STYLIST GỢI Ý PHỐI SET
              </p>
              <h2>{pairedOutfit.title}</h2>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 0 0", maxWidth: 680 }}>
                {pairedOutfit.reason}
              </p>
            </div>
            <Link className="viewAllLink" href={`/outfit?product=${product.id}`}>
              Tùy biến set này trong AI Lab →
            </Link>
          </div>

          <div className="pairedOutfitBox">
            <div className="pairedItemsRow">
              {pairedOutfit.items.map((it) => (
                <div key={it.product.id} className="pairedItemCard">
                  <div className="pairedItemImg">
                    <Image src={it.product.image} alt={it.product.name} fill sizes="160px" />
                    <span className="pairedRoleTag">{it.roleName}</span>
                  </div>
                  <div className="pairedItemMeta">
                    <Link href={`/product/${it.product.id}`} className="pairedName">
                      {it.product.name}
                    </Link>
                    <span className="pairedColor">{it.product.color}</span>
                    <strong className="pairedPrice">{formatPrice(it.product.price)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="pairedActionCard">
              <div className="pairedScore">
                <Sparkles size={15} /> {pairedOutfit.matchBadge} ({pairedOutfit.score}/100)
              </div>
              <p className="pairedTip">💡 {pairedOutfit.stylingTip}</p>
              <div className="pairedTotal">
                <span>Tổng cả set:</span>
                <strong className="pairedTotalNum">{formatPrice(pairedOutfit.totalPrice)}</strong>
              </div>
              <button
                type="button"
                className={`btn block ${bundleAdded ? "secondary" : ""}`}
                style={{ height: 46 }}
                onClick={() => {
                  addBundleToCart(
                    pairedOutfit.items.map((i) => ({
                      product: i.product,
                      size: i.selectedSize,
                      quantity: 1
                    }))
                  );
                  setBundleAdded(true);
                  setTimeout(() => setBundleAdded(false), 2500);
                }}
              >
                {bundleAdded ? (
                  <>
                    <Check size={16} /> Đã thêm cả set vào giỏ!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Thêm cả set ({pairedOutfit.items.length} món) vào giỏ
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {/* Related Products */}
      {related.length ? (
        <section className="section relatedSection">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">PHỐI CÙNG THIẾT KẾ</p>
              <h2>Gợi ý kết hợp phong cách</h2>
            </div>
          </div>
          <div className="productGrid">
            {related.map((item) => (
              <ProductCard product={item} key={item.id} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
