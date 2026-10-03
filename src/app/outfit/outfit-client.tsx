"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Heart,
  Layers,
  Palette,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Tag,
  Wand2
} from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";
import {
  coordinateSmartOutfit,
  CoordinatedOutfit,
  OutfitSetType
} from "@/lib/stylist-outfit-engine";

export function OutfitClient() {
  const searchParams = useSearchParams();
  const requiredProductId = searchParams.get("product") ?? undefined;
  const { catalog, addToCart, addBundleToCart, wishlist, toggleWishlist } = useStore();

  const [setType, setSetType] = useState<OutfitSetType>("all");
  const [occasion, setOccasion] = useState<string>("all");
  const [style, setStyle] = useState<string>("all");
  const [salt, setSalt] = useState<number>(() => Math.floor(Math.random() * 1000));
  const [isGenerating, setIsGenerating] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Generate current outfit
  const outfit: CoordinatedOutfit = useMemo(() => {
    return coordinateSmartOutfit({
      catalog,
      setType,
      occasion,
      style,
      requiredProductId,
      variantSalt: salt
    });
  }, [catalog, setType, occasion, style, requiredProductId, salt]);

  // Size selections for each item in the current outfit
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialSizes: Record<string, string> = {};
    outfit.items.forEach((item) => {
      initialSizes[item.product.id] = item.selectedSize;
    });
    setSelectedSizes(initialSizes);
    setAddedSuccess(false);
  }, [outfit.id]);

  function handleSizeChange(productId: string, size: string) {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  }

  // Generate next coordinated set on click
  function handleGenerateNext(chosenType?: OutfitSetType) {
    setIsGenerating(true);
    if (chosenType && chosenType !== setType) {
      setSetType(chosenType);
    }
    setSalt((prev) => prev + 1 + Math.floor(Math.random() * 7));
    setTimeout(() => {
      setIsGenerating(false);
    }, 280);
  }

  // Add the entire coordinated set to cart in one click
  function handleAddFullSetToCart() {
    const bundle = outfit.items.map((item) => ({
      product: item.product,
      size: selectedSizes[item.product.id] || item.selectedSize,
      quantity: 1
    }));
    addBundleToCart(bundle);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  }

  const requiredProduct = useMemo(
    () => (requiredProductId ? catalog.find((p) => p.id === requiredProductId) : null),
    [requiredProductId, catalog]
  );

  return (
    <div className="outfitStudioPage">
      {/* Flagship Header */}
      <section className="outfitHeroBanner">
        <div className="outfitHeroContent">
          <div className="outfitBadge">
            <Sparkles size={14} className="sparkleIcon" />
            <span>LSOUL AI STYLIST ENGINE</span>
          </div>
          <h1 className="outfitHeroTitle">Phòng Phối Đồ Chuẩn Set</h1>
          <p className="outfitHeroDesc">
            AI Stylist tự động phối đồ dựa trên quy chuẩn tỷ lệ hình thể, hài hòa màu sắc và phom dáng thiết kế LSOUL. Mỗi lần bấm là một set phối ăn ý hoàn hảo, sẵn sàng thêm vào giỏ hàng.
          </p>

          {requiredProduct && (
            <div className="outfitLockedProduct">
              <span className="lockTag">ĐANG KHÓA SẢN PHẨM:</span>
              <strong>{requiredProduct.name}</strong> ({requiredProduct.color})
              <Link href="/outfit" className="clearLockBtn">
                Bỏ khóa
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Interactive Controls & Filters */}
      <div className="outfitStudioContainer">
        {/* Set Architecture Selector */}
        <div className="outfitArchitectureTabs">
          <button
            type="button"
            className={`archTabBtn ${setType === "all" ? "active" : ""}`}
            onClick={() => handleGenerateNext("all")}
          >
            <Sparkles size={16} />
            <span>Tất cả kiểu set</span>
          </button>
          <button
            type="button"
            className={`archTabBtn ${setType === "top_bottom" ? "active" : ""}`}
            onClick={() => handleGenerateNext("top_bottom")}
          >
            <Layers size={16} />
            <span>Quần / Chân váy + Áo</span>
          </button>
          <button
            type="button"
            className={`archTabBtn ${setType === "dress_layer" ? "active" : ""}`}
            onClick={() => handleGenerateNext("dress_layer")}
          >
            <Tag size={16} />
            <span>Đầm liền & Áo khoác</span>
          </button>
          <button
            type="button"
            className={`archTabBtn ${setType === "coord_set" ? "active" : ""}`}
            onClick={() => handleGenerateNext("coord_set")}
          >
            <Palette size={16} />
            <span>Set đồ đồng bộ (Co-ord)</span>
          </button>
        </div>

        {/* Occasion & Style Filters */}
        <div className="outfitFilterBar">
          <div className="outfitFilterGroup">
            <span className="filterLabel">Hoàn cảnh:</span>
            <select
              value={occasion}
              onChange={(e) => {
                setOccasion(e.target.value);
                setSalt((s) => s + 1);
              }}
              className="outfitSelect"
            >
              <option value="all">Mọi hoàn cảnh</option>
              <option value="date">Hẹn hò lãng mạn</option>
              <option value="party">Tiệc tối & Sự kiện</option>
              <option value="casual">Dạo phố & Cafe</option>
              <option value="work">Đi làm thanh lịch</option>
            </select>
          </div>

          <div className="outfitFilterGroup">
            <span className="filterLabel">Gu thời trang:</span>
            <select
              value={style}
              onChange={(e) => {
                setStyle(e.target.value);
                setSalt((s) => s + 1);
              }}
              className="outfitSelect"
            >
              <option value="all">Đa phong cách</option>
              <option value="minimal">Minimal Sang chảnh</option>
              <option value="bold">Bold Cá tính</option>
              <option value="y2k">Y2K Quyến rũ</option>
              <option value="feminine">Feminine Nữ tính</option>
              <option value="glam">Glam Quyền lực</option>
            </select>
          </div>

          <button
            type="button"
            className={`outfitShuffleBtn ${isGenerating ? "spinning" : ""}`}
            onClick={() => handleGenerateNext()}
            title="Đổi phối set khác"
          >
            <RefreshCw size={16} />
            <span>Phối Set Khác (Click để đổi)</span>
          </button>
        </div>

        {/* Coordinated Outfit Presentation Stage */}
        <div className="outfitMainStage">
          {/* Left Canvas: Coordinated Items Showcase */}
          <div className="outfitCanvasArea">
            <div className="outfitCanvasHeader">
              <div className="outfitTypeTag">
                <span className="dot" />
                <span>{outfit.setTypeName}</span>
              </div>
              <div className="outfitMatchBadge">
                <Sparkles size={14} />
                <span>{outfit.matchBadge} ({outfit.score}/100)</span>
              </div>
            </div>

            <div className={`outfitItemCardsGrid count-${outfit.items.length}`}>
              {outfit.items.map((item, idx) => {
                const inWishlist = wishlist.includes(item.product.id);
                const currentSize = selectedSizes[item.product.id] || item.selectedSize;

                return (
                  <div key={item.product.id} className="outfitCardItem">
                    <div className="outfitCardRoleBadge">
                      <span>{item.roleName}</span>
                    </div>

                    <div className="outfitCardImageWrap">
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        priority={idx === 0}
                      />
                      <button
                        type="button"
                        className={`outfitWishlistBtn ${inWishlist ? "active" : ""}`}
                        onClick={() => toggleWishlist(item.product.id)}
                        aria-label="Lưu vào danh sách yêu thích"
                      >
                        <Heart size={16} fill={inWishlist ? "#e11d48" : "none"} color={inWishlist ? "#e11d48" : "#fff"} />
                      </button>
                    </div>

                    <div className="outfitCardDetails">
                      <Link href={`/product/${item.product.id}`} className="outfitCardName">
                        {item.product.name}
                      </Link>
                      <div className="outfitCardMeta">
                        <span className="colorTag">{item.product.color}</span>
                        <span className="fitTag">{item.product.fit}</span>
                      </div>
                      <div className="outfitCardPrice">
                        <strong>{formatPrice(item.product.price)}</strong>
                        {item.product.oldPrice && (
                          <small className="oldPrice">{formatPrice(item.product.oldPrice)}</small>
                        )}
                      </div>

                      {/* Size Selector for this specific item in the set */}
                      <div className="outfitSizeSelector">
                        <span className="sizeLabel">Chọn size:</span>
                        <div className="sizeOptions">
                          {item.availableSizes.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className={`sizeOptionBtn ${currentSize === s ? "active" : ""}`}
                              onClick={() => handleSizeChange(item.product.id, s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Single Add to Cart Button for this piece */}
                      <button
                        type="button"
                        className="singleAddBtn"
                        onClick={() => addToCart(item.product, currentSize, 1)}
                      >
                        <ShoppingBag size={14} /> Thêm lẻ món này
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Stylist AI Analysis & Bundle Action */}
          <aside className="outfitStylistPanel">
            <div className="stylistHeader">
              <div className="stylistAvatar">
                <Wand2 size={20} />
              </div>
              <div>
                <h3 className="stylistTitle">Gợi ý từ Stylist AI</h3>
                <span className="stylistSubtitle">Phối hợp thời trang LSOUL</span>
              </div>
            </div>

            <div className="stylistOutfitTitle">
              <h4>{outfit.title}</h4>
            </div>

            {/* AI Review Explanation */}
            <div className="stylistExplanationCard">
              <div className="cardSubtitle">VÌ SAO SET ĐỒ NÀY HỢP NHAU:</div>
              <p className="explanationText">{outfit.reason}</p>
            </div>

            {/* Styling Accessories Tip */}
            <div className="stylistTipCard">
              <div className="cardSubtitle">MẸO PHỐI PHỤ KIỆN & GIÀY:</div>
              <p className="tipText">{outfit.stylingTip}</p>
            </div>

            {/* Outfit Pricing Summary */}
            <div className="outfitPricingSummary">
              <div className="priceRow">
                <span>Số lượng món:</span>
                <strong>{outfit.items.length} món trong set</strong>
              </div>
              {outfit.originalPrice && (
                <div className="priceRow strikethrough">
                  <span>Giá gốc tổng cộng:</span>
                  <span className="oldPriceVal">{formatPrice(outfit.originalPrice)}</span>
                </div>
              )}
              <div className="priceRow total">
                <span>Tổng giá trọn set:</span>
                <strong className="finalPrice">{formatPrice(outfit.totalPrice)}</strong>
              </div>
            </div>

            {/* Primary Action: Add Full Set to Cart */}
            <div className="outfitActionGroup">
              <button
                type="button"
                className={`addFullSetBtn ${addedSuccess ? "success" : ""}`}
                onClick={handleAddFullSetToCart}
              >
                {addedSuccess ? (
                  <>
                    <Check size={18} /> Đã thêm trọn bộ vào giỏ hàng!
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Thêm cả set vào giỏ ({outfit.items.length} món)
                  </>
                )}
              </button>

              <button
                type="button"
                className="nextOutfitBtn"
                onClick={() => handleGenerateNext()}
              >
                <RefreshCw size={16} /> Gợi ý set khác ngẫu nhiên
              </button>
            </div>

            {/* Virtual Try-On Direct Shortcut */}
            <div className="outfitTryOnShortcut">
              <Sparkles size={16} className="sparkle" />
              <span>Muốn xem thử đồ lên dáng người?</span>
              <Link href={`/try-on?product=${outfit.items[0]?.product.id}`}>
                Thử đồ AI ngay <ChevronRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
