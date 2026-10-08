"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
import { formatPrice, storefrontCategory, storefrontCategoryLabels, typeLabels } from "@/lib/products";
import type { ClothingType, ColorFamily, Product } from "@/lib/products";
import { calculateProductSearchScore, getPersonalizedRecommendations } from "@/lib/product-search";

const shopCategoryOptions = Object.entries(storefrontCategoryLabels);

const colorOptions: Array<{ value: ColorFamily; label: string; hex: string }> = [
  { value: "black", label: "Đen", hex: "#111111" },
  { value: "white", label: "Trắng", hex: "#ffffff" },
  { value: "navy", label: "Xanh navy", hex: "#1f2a44" },
  { value: "beige", label: "Be", hex: "#e7dccb" },
  { value: "blue", label: "Xanh", hex: "#4f78a8" },
  { value: "brown", label: "Nâu", hex: "#704214" },
  { value: "red", label: "Đỏ", hex: "#a12b3a" },
  { value: "green", label: "Xanh lá", hex: "#58705d" },
  { value: "gray", label: "Xám", hex: "#8a8a8a" },
  { value: "pink", label: "Hồng", hex: "#d68ca3" }
];

function normalizeCategory(value: string | null) {
  // Old links used ?category=bottoms. The shop now splits this into Quần and Chân váy,
  // so fall back to the full catalog instead of silently choosing one side.
  return value === "bottoms" ? "all" : value ?? "all";
}

function matchesCategory(product: Product, selectedCategory: string) {
  if (selectedCategory === "all") return true;
  return storefrontCategory(product) === selectedCategory;
}

function matchesType(product: Product, selectedType: string) {
  return selectedType === "all" || product.type === selectedType;
}

function groupProducts(items: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of items) {
    const key = product.groupCode?.trim() || product.id;
    const current = groups.get(key);
    if (current) current.push(product);
    else groups.set(key, [product]);
  }
  return Array.from(groups.entries()).map(([key, variants]) => ({ key, variants }));
}

export function ShopClient() {
  const searchParams = useSearchParams();
  const initialCategory = normalizeCategory(searchParams.get("category"));
  const saleOnly = searchParams.get("sale") === "1";
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [productType, setProductType] = useState("all");
  const [color, setColor] = useState("all");
  const [priceCeiling, setPriceCeiling] = useState<number | null>(null);
  const [stockOnly, setStockOnly] = useState(true);
  const [sort, setSort] = useState(searchParams.get("sort") === "new" ? "new" : "featured");
  const [mobileFilters, setMobileFilters] = useState(false);
  const { catalog, wishlist } = useStore();

  const availableFilterProducts = useMemo(
    () => catalog.filter((product) => product.active !== false && product.stock > 0),
    [catalog]
  );

  const catalogMaxPrice = useMemo(
    () => availableFilterProducts.reduce((max, product) => Math.max(max, product.price), 0),
    [availableFilterProducts]
  );
  const effectivePriceCeiling = priceCeiling ?? catalogMaxPrice;

  // Faceted filtering: every facet respects the selections in the other facets.
  // This prevents combinations that can never return a product.
  const availableCategories = useMemo(() => {
    const values = new Set<string>();
    for (const product of availableFilterProducts) {
      if (!matchesType(product, productType)) continue;
      if (color !== "all" && product.colorFamily !== color) continue;
      values.add(storefrontCategory(product));
    }
    return values;
  }, [availableFilterProducts, productType, color]);

  const availableTypes = useMemo(() => {
    const values = new Set<ClothingType>();
    for (const product of availableFilterProducts) {
      if (!matchesCategory(product, category)) continue;
      if (color !== "all" && product.colorFamily !== color) continue;
      values.add(product.type);
    }
    return values;
  }, [availableFilterProducts, category, color]);

  const availableColors = useMemo(() => {
    const values = new Set<ColorFamily>();
    for (const product of availableFilterProducts) {
      if (!matchesCategory(product, category)) continue;
      if (!matchesType(product, productType)) continue;
      values.add(product.colorFamily);
    }
    return values;
  }, [availableFilterProducts, category, productType]);

  useEffect(() => {
    const nextCategory = normalizeCategory(searchParams.get("category"));
    setCategory(nextCategory);

    const nextQuery = searchParams.get("q") ?? "";
    setQuery(nextQuery);

    const nextSort = searchParams.get("sort");
    if (nextSort === "new" || nextSort === "featured" || nextSort === "price-low" || nextSort === "price-high" || nextSort === "foryou") {
      setSort(nextSort);
    }
  }, [searchParams]);

  useEffect(() => {
    if (category !== "all" && !availableCategories.has(category)) setCategory("all");
    if (productType !== "all" && !availableTypes.has(productType as ClothingType)) setProductType("all");
    if (color !== "all" && !availableColors.has(color as ColorFamily)) setColor("all");
  }, [category, productType, color, availableCategories, availableTypes, availableColors]);

  const filtered = useMemo(() => {
    const rawQuery = query.trim();
    const base = catalog.filter((product) => {
      const matchCategory = matchesCategory(product, category);
      const matchType = matchesType(product, productType);
      const matchSale = !saleOnly || Boolean(product.oldPrice);
      const matchStock = !stockOnly || product.stock > 0;
      const matchPrice = !effectivePriceCeiling || product.price <= effectivePriceCeiling;
      return product.active !== false && matchCategory && matchType && matchSale && matchStock && matchPrice;
    });

    let result = groupProducts(base)
      .filter(({ variants }) => !rawQuery || variants.some((product) => calculateProductSearchScore(product, rawQuery) > 0))
      .filter(({ variants }) => color === "all" || variants.some((product) => product.colorFamily === color))
      .map(({ key, variants }) => {
        const preferredVariants = color === "all"
          ? variants
          : variants.filter((product) => product.colorFamily === color);

        let product = preferredVariants[0] ?? variants[0];
        if (rawQuery) {
          product = [...preferredVariants]
            .sort((a, b) => calculateProductSearchScore(b, rawQuery) - calculateProductSearchScore(a, rawQuery))[0] ?? product;
        }

        return { key, product, variants };
      });

    if (rawQuery && sort === "featured") {
      result = result.toSorted((a, b) => {
        const scoreA = Math.max(...a.variants.map((product) => calculateProductSearchScore(product, rawQuery)));
        const scoreB = Math.max(...b.variants.map((product) => calculateProductSearchScore(product, rawQuery)));
        return scoreB - scoreA;
      });
    } else if (sort === "foryou") {
      const personalizedSet = new Set(getPersonalizedRecommendations(catalog, wishlist, 40).map((product) => product.id));
      result = result.toSorted((a, b) => {
        const aFav = a.variants.some((product) => personalizedSet.has(product.id)) ? 1 : 0;
        const bFav = b.variants.some((product) => personalizedSet.has(product.id)) ? 1 : 0;
        return bFav - aFav;
      });
    } else if (sort === "price-low") {
      result = result.toSorted((a, b) => a.product.price - b.product.price);
    } else if (sort === "price-high") {
      result = result.toSorted((a, b) => b.product.price - a.product.price);
    } else if (sort === "new") {
      result = result.toSorted((a, b) => Number(b.variants.some((product) => product.isNew)) - Number(a.variants.some((product) => product.isNew)));
    }

    return result;
  }, [catalog, query, category, productType, color, effectivePriceCeiling, stockOnly, sort, saleOnly, wishlist]);

  const fallbackGroups = useMemo(
    () => groupProducts(catalog.filter((product) => product.active !== false && product.stock > 0)).slice(0, 3),
    [catalog]
  );

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setProductType("all");
    setColor("all");
    setPriceCeiling(null);
  };

  const sliderMax = Math.max(catalogMaxPrice, 100000);
  const sliderValue = Math.min(effectivePriceCeiling || sliderMax, sliderMax);

  const filters = (
    <>
      <div className="filterGroup">
        <strong>Tìm kiếm thông minh</strong>
        <input
          className="searchInput"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tên, SKU, hoặc gu: sexy, đi tiệc, Y2K..."
        />
      </div>

      <div className="filterGroup">
        <strong>Danh mục</strong>
        <label><input type="radio" checked={category === "all"} onChange={() => setCategory("all")} /> Tất cả</label>
        {shopCategoryOptions
          .filter(([key]) => availableCategories.has(key))
          .map(([key, label]) => (
            <label key={key}>
              <input type="radio" checked={category === key} onChange={() => setCategory(key)} />
              {label}
            </label>
          ))}
      </div>

      <div className="filterGroup">
        <strong>Loại sản phẩm</strong>
        <label><input type="radio" checked={productType === "all"} onChange={() => setProductType("all")} /> Tất cả</label>
        {(Object.entries(typeLabels) as Array<[ClothingType, string]>)
          .filter(([key]) => availableTypes.has(key))
          .map(([key, label]) => (
            <label key={key}>
              <input type="radio" checked={productType === key} onChange={() => setProductType(key)} />
              {label}
            </label>
          ))}
      </div>

      <div className="filterGroup">
        <strong>Màu sắc</strong>
        <label><input type="radio" checked={color === "all"} onChange={() => setColor("all")} /> Tất cả</label>
        {colorOptions
          .filter((option) => availableColors.has(option.value))
          .map((option) => (
            <label key={option.value}>
              <input type="radio" checked={color === option.value} onChange={() => setColor(option.value)} />
              <span className="filterColorDot" style={{ backgroundColor: option.hex }} aria-hidden="true" />
              {option.label}
            </label>
          ))}
      </div>

      <div className="filterGroup">
        <div className="priceFilterHeading">
          <strong>Khoảng giá</strong>
          <span>{catalogMaxPrice ? formatPrice(sliderValue) : "—"}</span>
        </div>
        <input
          className="priceRange"
          type="range"
          min={0}
          max={sliderMax}
          step={50000}
          value={sliderValue}
          onChange={(event) => {
            const next = Number(event.target.value);
            setPriceCeiling(next >= catalogMaxPrice ? null : next);
          }}
          aria-label="Giá tối đa"
        />
        <div className="priceRangeLabels">
          <span>0 ₫</span>
          <span>{catalogMaxPrice ? formatPrice(catalogMaxPrice) : "—"}</span>
        </div>
      </div>

      <div className="filterGroup">
        <label className="switchLabel">
          <input type="checkbox" checked={stockOnly} onChange={(event) => setStockOnly(event.target.checked)} /> Chỉ hiện sản phẩm còn hàng
        </label>
      </div>
    </>
  );

  return (
    <>
      <section className="pageHero">
        <p className="eyebrow">{saleOnly ? "BỘ SƯU TẬP GIẢM GIÁ" : "CỬA HÀNG TRỰC TUYẾN"}</p>
        <h1>{saleOnly ? "Sản phẩm giảm giá" : "Bộ sưu tập LSOUL"}</h1>
        <p>Khám phá những silhouette đặc trưng của LSOUL: corset, áo ngắn, bodysuit, blazer chiết eo, đầm ngắn, chân váy, quần loe và các bộ phối sẵn.</p>
      </section>
      <div className="shopShell">
        <aside className="filters desktopFilters">{filters}</aside>
        <section>
          <div className="shopTop">
            <span>{filtered.length} sản phẩm</span>
            <div className="shopTopActions">
              <button className="mobileFilterButton" onClick={() => setMobileFilters(true)}>
                <SlidersHorizontal size={16} /> Bộ lọc
              </button>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Nổi bật</option>
                <option value="foryou">✨ Dành riêng cho bạn (AI)</option>
                <option value="new">Mới nhất</option>
                <option value="price-low">Giá thấp → cao</option>
                <option value="price-high">Giá cao → thấp</option>
              </select>
            </div>
          </div>

          {filtered.length ? (
            <div className="productGrid shopProductGrid">
              {filtered.map(({ key, product, variants }) => (
                <ProductCard key={key} product={product} colorVariants={variants} />
              ))}
            </div>
          ) : (
            <div className="catalogEmpty">
              <h3>Chưa có sản phẩm phù hợp</h3>
              <p>Danh mục hoặc bộ lọc hiện tại chưa có sản phẩm. Bạn có thể xóa bộ lọc để xem toàn bộ bộ sưu tập hoặc xem gợi ý bên dưới.</p>
              <div style={{ marginTop: "16px", marginBottom: "36px" }}>
                <button className="btn secondary" onClick={resetFilters}>
                  Xem tất cả sản phẩm
                </button>
              </div>

              {fallbackGroups.length > 0 && (
                <div style={{ textAlign: "left", width: "100%", borderTop: "1px solid var(--line)", paddingTop: "28px" }}>
                  <h4 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "18px", color: "var(--muted)" }}>
                    Sản phẩm nổi bật đề xuất
                  </h4>
                  <div className="productGrid shopProductGrid">
                    {fallbackGroups.map(({ key, variants }) => (
                      <ProductCard key={key} product={variants[0]} colorVariants={variants} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {mobileFilters ? (
        <div className="filterDrawer">
          <div className="drawerTop">
            <strong>Bộ lọc</strong>
            <button className="iconButton" onClick={() => setMobileFilters(false)}>
              <X size={20} />
            </button>
          </div>
          {filters}
          <button className="btn block" onClick={() => setMobileFilters(false)}>
            Xem {filtered.length} sản phẩm
          </button>
        </div>
      ) : null}
    </>
  );
}
