"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
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
import { formatPrice, type Product } from "@/lib/products";
import {
  coordinateSmartOutfit,
  outfitSelectionKey,
  CoordinatedOutfit,
  OutfitSetType
} from "@/lib/stylist-outfit-engine";

export function OutfitClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requiredProductId = searchParams.get("product") ?? undefined;
  const { catalog, addToCart, addBundleToCart, wishlist, toggleWishlist, user } = useStore();

  const [setType, setSetType] = useState<OutfitSetType>("all");
  const [occasion, setOccasion] = useState<string>("all");
  const [style, setStyle] = useState<string>("all");
  const [includeOuterwear, setIncludeOuterwear] = useState(false);
  const [salt, setSalt] = useState<number>(() => Math.floor(Math.random() * 1000));
  const [seenOutfitKeys, setSeenOutfitKeys] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [wishlistSuccess, setWishlistSuccess] = useState(false);

  // Generate current outfit
  const outfit: CoordinatedOutfit = useMemo(() => {
    return coordinateSmartOutfit({
      catalog,
      setType,
      occasion,
      style,
      requiredProductId,
      variantSalt: salt,
      excludeOutfitKeys: seenOutfitKeys,
      includeOuterwear
    });
  }, [catalog, setType, occasion, style, requiredProductId, salt, seenOutfitKeys, includeOuterwear]);

  // Variant selections are keyed by the original item id so changing color never
  // breaks the relationship between the visible card and its cart / try-on action.
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, string>>({});
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  function availableSizes(product: Product) {
    const tracked = product.variants
      ?.filter((variant) => variant.active !== false && variant.stock > 0)
      .map((variant) => variant.size) ?? [];
    if (tracked.length) return Array.from(new Set(tracked));
    return Array.isArray(product.sizes) ? product.sizes : [];
  }

  useEffect(() => {
    const initialProducts: Record<string, string> = {};
    const initialSizes: Record<string, string> = {};
    outfit["items"].forEach((item) => {
      initialProducts[item.product.id] = item.product.id;
      initialSizes[item.product.id] = item.selectedSize;
    });
    setSelectedProductIds(initialProducts);
    setSelectedSizes(initialSizes);
    setAddedSuccess(false);
    setWishlistSuccess(false);
  }, [outfit.id]);

  function handleSizeChange(baseProductId: string, size: string) {
    setSelectedSizes((prev) => ({ ...prev, [baseProductId]: size }));
  }

  function handleColorChange(baseProductId: string, nextProductId: string) {
    const nextProduct = catalog.find((product) => product.id === nextProductId);
    if (!nextProduct) return;

    const nextSizes = availableSizes(nextProduct);
    setSelectedProductIds((prev) => ({ ...prev, [baseProductId]: nextProduct.id }));
    setSelectedSizes((prev) => ({
      ...prev,
      [baseProductId]: prev[baseProductId] && nextSizes.includes(prev[baseProductId])
        ? prev[baseProductId]
        : (nextSizes[0] ?? "")
    }));
  }

  const selectedItems = useMemo(() => outfit["items"].map((item) => {
    const baseProductId = item.product.id;
    const selectedId = selectedProductIds[baseProductId] ?? baseProductId;
    const product = catalog.find((candidate) => candidate.id === selectedId) ?? item.product;
    const sizes = availableSizes(product);
    const requestedSize = selectedSizes[baseProductId] ?? item.selectedSize;
    const selectedSize = sizes.includes(requestedSize) ? requestedSize : (sizes[0] ?? requestedSize);

    return {
      ...item,
      baseProductId,
      product,
      availableSizes: sizes,
      selectedSize
    };
  }), [outfit, catalog, selectedProductIds, selectedSizes]);

  const selectedTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.product.price, 0),
    [selectedItems]
  );
  const selectedOriginalTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + (item.product.oldPrice ?? item.product.price), 0),
    [selectedItems]
  );
  const hasSelectedDiscount = selectedOriginalTotal > selectedTotal;

  // Check if all items in current set are already favorited
  const allInWishlist = useMemo(() => {
    return (
      selectedItems.length > 0 &&
      selectedItems.every((it) => wishlist.includes(it.product.id))
    );
  }, [selectedItems, wishlist]);

  // Toggle favorite for all items in the set
  function handleToggleWishlistAll() {
    if (!user) {
      toggleWishlist(selectedItems[0]?.product.id);
      return;
    }

    if (allInWishlist) {
      selectedItems.forEach((it) => {
        if (wishlist.includes(it.product.id)) {
          toggleWishlist(it.product.id);
        }
      });
      setWishlistSuccess(false);
    } else {
      selectedItems.forEach((it) => {
        if (!wishlist.includes(it.product.id)) {
          toggleWishlist(it.product.id);
        }
      });
      setWishlistSuccess(true);
      setTimeout(() => setWishlistSuccess(false), 2500);
    }
  }

  // The fitting room only accepts wishlist items, so save the chosen pieces first,
  // then open the fitting room with them preselected.
  function tryOnLinkProps(productIds: string[]) {
    const ids = productIds.filter(Boolean);
    return {
      href: `/try-on?products=${encodeURIComponent(ids.join(","))}`,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        if (!user) {
          // toggleWishlist redirects guests to the login page.
          toggleWishlist(ids[0]);
          return;
        }
        ids.forEach((id) => {
          if (!wishlist.includes(id)) toggleWishlist(id);
        });
        router.push(`/try-on?products=${encodeURIComponent(ids.join(","))}`);
      }
    };
  }

  const setProductIds = selectedItems.map((it) => it.product.id);

  // Generate next coordinated set on click
  function handleGenerateNext(chosenType?: OutfitSetType) {
    const currentKey = outfitSelectionKey(outfit.items);
    if (currentKey) {
      setSeenOutfitKeys((previous) =>
        [...previous.filter((key) => key !== currentKey), currentKey].slice(-150)
      );
    }
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
    const bundle = selectedItems.map((item) => ({
      product: item.product,
      size: item.selectedSize,
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
            className={`archTabBtn ${setType === "top_pants" ? "active" : ""}`}
            onClick={() => handleGenerateNext("top_pants")}
            disabled={requiredProduct?.category === "bottoms" && requiredProduct.type === "skirt"}
            title={requiredProduct?.category === "bottoms" && requiredProduct.type === "skirt" ? "Bỏ khóa chân váy để phối với quần" : undefined}
          >
            <Layers size={16} />
            <span>Áo + Quần</span>
          </button>
          <button
            type="button"
            className={`archTabBtn ${setType === "top_skirt" ? "active" : ""}`}
            onClick={() => handleGenerateNext("top_skirt")}
            disabled={requiredProduct?.category === "bottoms" && requiredProduct.type !== "skirt"}
            title={requiredProduct?.category === "bottoms" && requiredProduct.type !== "skirt" ? "Bỏ khóa quần để phối với chân váy" : undefined}
          >
            <Layers size={16} />
            <span>Áo + Chân váy</span>
          </button>
          <button
            type="button"
            className={`archTabBtn ${setType === "dress_layer" ? "active" : ""}`}
            onClick={() => handleGenerateNext("dress_layer")}
          >
            <Tag size={16} />
            <span>Đầm liền</span>
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

          <div className="outfitFilterGroup">
            <span className="filterLabel">Áo khoác ngoài:</span>
            <label className="outfitCheckbox" title="Mặc định chỉ phối áo + quần hoặc áo + chân váy theo tab bạn chọn. Bật nếu muốn thêm lớp khoác ngoài.">
              <input
                type="checkbox"
                checked={includeOuterwear}
                onChange={(e) => {
                  setIncludeOuterwear(e.target.checked);
                  setSalt((s) => s + 1);
                }}
              />
              <span>Kèm áo khoác</span>
            </label>
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
              <div className="outfitCanvasMeta">
                <div className="outfitTypeTag">
                  <span className="dot" />
                  <span>{outfit.setTypeName}</span>
                </div>
                <div className="outfitMatchBadge">
                  <Sparkles size={14} />
                  <span>{outfit.matchBadge} ({outfit.score}/100)</span>
                </div>
              </div>

              <div className="outfitCanvasQuickActions">
                <button
                  type="button"
                  className={`outfitQuickWishlistBtn ${allInWishlist ? "active" : ""}`}
                  onClick={handleToggleWishlistAll}
                  title={allInWishlist ? "Bỏ yêu thích trọn set" : "Yêu thích cả set"}
                >
                  <Heart
                    size={14}
                    fill={allInWishlist ? "#e11d48" : "none"}
                    color={allInWishlist ? "#e11d48" : "currentColor"}
                  />
                  <span>{allInWishlist ? "Đã thích cả set" : "Yêu thích cả set"}</span>
                </button>
                <Link
                  {...tryOnLinkProps(setProductIds)}
                  className="outfitQuickTryOnBtn"
                  title="Cho trọn bộ này vào phòng thử đồ AI"
                >
                  <Sparkles size={14} />
                  <span>Phòng thử đồ</span>
                </Link>
              </div>
            </div>

            <div className={`outfitItemCardsGrid count-${selectedItems.length}`}>
              {selectedItems.map((item, idx) => {
                const inWishlist = wishlist.includes(item.product.id);
                const currentSize = item.selectedSize;
                const colorVariants = item.product.groupCode
                  ? catalog.filter((product) => product.active !== false && product.groupCode === item.product.groupCode)
                  : [item.product];

                return (
                  <div key={item.baseProductId} className="outfitCardItem">
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

                      {/* Color Selector for this specific item in the set */}
                      <div className="outfitColorSelector">
                        <span className="sizeLabel">Chọn màu:</span>
                        <div className="outfitColorOptions">
                          {colorVariants.map((variant) => (
                            <button
                              key={variant.id}
                              type="button"
                              className={"outfitColorOption " + (item.product.id === variant.id ? "active" : "")}
                              onClick={() => handleColorChange(item.baseProductId, variant.id)}
                              aria-label={"Chọn màu " + variant.color}
                              title={variant.color}
                            >
                              <i style={variant.colorHex ? { backgroundColor: variant.colorHex } : undefined} />
                              <span>{variant.color}</span>
                            </button>
                          ))}
                        </div>
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
                              onClick={() => handleSizeChange(item.baseProductId, s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action buttons for this piece */}
                      <div className="outfitCardActions">
                        <button
                          type="button"
                          className="singleAddBtn"
                          onClick={() => addToCart(item.product, currentSize, 1)}
                        >
                          <ShoppingBag size={14} /> Thêm lẻ món này
                        </button>
                        <Link
                          {...tryOnLinkProps([item.product.id])}
                          className="singleTryOnBtn"
                          title="Cho riêng món này vào phòng thử đồ"
                        >
                          <Sparkles size={14} /> Thử đồ
                        </Link>
                      </div>
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
                <strong>{selectedItems.length} món trong set</strong>
              </div>
              {hasSelectedDiscount && (
                <div className="priceRow strikethrough">
                  <span>Giá gốc tổng cộng:</span>
                  <span className="oldPriceVal">{formatPrice(selectedOriginalTotal)}</span>
                </div>
              )}
              <div className="priceRow total">
                <span>Tổng giá trọn set:</span>
                <strong className="finalPrice">{formatPrice(selectedTotal)}</strong>
              </div>
            </div>

            {/* Actions for Set */}
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
                    <ShoppingBag size={18} /> Thêm cả set vào giỏ ({selectedItems.length} món)
                  </>
                )}
              </button>

              <Link
                {...tryOnLinkProps(setProductIds)}
                className="tryOnFullSetBtn"
                title="Cho cả set đồ này vào phòng thử đồ AI"
              >
                <Sparkles size={18} />
                <span>Cho vào phòng thử đồ ({selectedItems.length} món)</span>
              </Link>

              <button
                type="button"
                className={`wishlistFullSetBtn ${allInWishlist ? "active" : ""}`}
                onClick={handleToggleWishlistAll}
                title={allInWishlist ? "Bỏ yêu thích trọn set" : "Lưu trọn bộ vào danh sách yêu thích"}
              >
                <Heart
                  size={18}
                  fill={allInWishlist ? "#e11d48" : "none"}
                  color={allInWishlist ? "#e11d48" : "currentColor"}
                />
                <span>
                  {wishlistSuccess
                    ? "Đã lưu trọn set vào yêu thích!"
                    : allInWishlist
                    ? "Đã lưu trọn set vào yêu thích"
                    : `Yêu thích cả set (${selectedItems.length} món)`}
                </span>
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
              <Link {...tryOnLinkProps(setProductIds)}>
                Thử cả set AI ngay <ChevronRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
