"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Sparkles, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
import { categoryLabels, typeLabels } from "@/lib/products";
import { calculateProductSearchScore, getPersonalizedRecommendations } from "@/lib/product-search";

export function ShopClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";
  const saleOnly = searchParams.get("sale") === "1";
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [productType, setProductType] = useState("all");
  const [color, setColor] = useState("all");
  const [price, setPrice] = useState("all");
  const [stockOnly, setStockOnly] = useState(true);
  const [sort, setSort] = useState(searchParams.get("sort") === "new" ? "new" : "featured");
  const [mobileFilters, setMobileFilters] = useState(false);
  const { catalog, wishlist } = useStore();

  // Only expose filter values that can actually lead to an in-stock product.
  // This keeps the left sidebar aligned with the live catalog instead of the
  // static enum lists in products.ts.
  const availableFilterProducts = useMemo(
    () => catalog.filter((product) => product.active !== false && product.stock > 0),
    [catalog]
  );
  const availableCategories = useMemo(
    () => new Set(availableFilterProducts.map((product) => product.category)),
    [availableFilterProducts]
  );
  const availableTypes = useMemo(
    () => new Set(availableFilterProducts.map((product) => product.type)),
    [availableFilterProducts]
  );
  const availableColors = useMemo(
    () => new Set(availableFilterProducts.map((product) => product.colorFamily)),
    [availableFilterProducts]
  );
  const availablePrices = useMemo(() => {
    const values = new Set<string>();
    for (const product of availableFilterProducts) {
      if (product.price < 500000) values.add("under500");
      else if (product.price <= 700000) values.add("500to700");
      else values.add("over700");
    }
    return values;
  }, [availableFilterProducts]);

  useEffect(() => {
    const nextCategory = searchParams.get("category") ?? "all";
    setCategory(nextCategory);

    const nextQuery = searchParams.get("q") ?? "";
    setQuery(nextQuery);

    const nextSort = searchParams.get("sort");
    if (nextSort === "new" || nextSort === "featured" || nextSort === "price-low" || nextSort === "price-high" || nextSort === "foryou") {
      setSort(nextSort);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const rawQuery = query.trim();
    let result = catalog.filter((product) => {
      const searchScore = !rawQuery ? 1 : calculateProductSearchScore(product, rawQuery);
      const matchText = searchScore > 0;
      const matchCategory = category === "all" || product.category === category;
      const matchType = productType === "all" || product.type === productType;
      const matchColor = color === "all" || product.colorFamily === color;
      const matchSale = !saleOnly || Boolean(product.oldPrice);
      const matchStock = !stockOnly || product.stock > 0;
      const matchPrice = price === "all" || (price === "under500" && product.price < 500000) || (price === "500to700" && product.price >= 500000 && product.price <= 700000) || (price === "over700" && product.price > 700000);
      return product.active !== false && matchText && matchCategory && matchType && matchColor && matchSale && matchStock && matchPrice;
    });

    if (rawQuery && sort === "featured") {
      result = result.toSorted((a, b) => calculateProductSearchScore(b, rawQuery) - calculateProductSearchScore(a, rawQuery));
    } else if (sort === "foryou") {
      const personalizedSet = new Set(getPersonalizedRecommendations(catalog, wishlist, 20).map((p) => p.id));
      result = result.toSorted((a, b) => {
        const aFav = personalizedSet.has(a.id) ? 1 : 0;
        const bFav = personalizedSet.has(b.id) ? 1 : 0;
        return bFav - aFav;
      });
    } else if (sort === "price-low") {
      result = result.toSorted((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      result = result.toSorted((a, b) => b.price - a.price);
    } else if (sort === "new") {
      result = result.toSorted((a, b) => Number(b.isNew) - Number(a.isNew));
    }

    return result;
  }, [catalog, query, category, productType, color, price, stockOnly, sort, saleOnly, wishlist]);

  useEffect(() => {
    if (category !== "all" && !availableCategories.has(category as never)) setCategory("all");
    if (productType !== "all" && !availableTypes.has(productType as never)) setProductType("all");
    if (color !== "all" && !availableColors.has(color as never)) setColor("all");
    if (price !== "all" && !availablePrices.has(price)) setPrice("all");
  }, [category, productType, color, price, availableCategories, availableTypes, availableColors, availablePrices]);

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setProductType("all");
    setColor("all");
    setPrice("all");
  };

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
        {Object.entries(categoryLabels)
          .filter(([key]) => availableCategories.has(key as never))
          .map(([key, label]) => (
            <label key={key}><input type="radio" checked={category === key} onChange={() => setCategory(key)} /> {label}</label>
          ))}
      </div>
      <div className="filterGroup">
        <strong>Loại sản phẩm</strong>
        <label><input type="radio" checked={productType === "all"} onChange={() => setProductType("all")} /> Tất cả</label>
        {Object.entries(typeLabels)
          .filter(([key]) => availableTypes.has(key as never))
          .map(([key, label]) => (
            <label key={key}><input type="radio" checked={productType === key} onChange={() => setProductType(key)} /> {label}</label>
          ))}
      </div>
      <div className="filterGroup">
        <strong>Màu sắc</strong>
        {["all","black","white","navy","beige","blue","brown","red","green","gray","pink"]
          .filter((value) => value === "all" || availableColors.has(value as never))
          .map((value) => (
            <label key={value}><input type="radio" checked={color === value} onChange={() => setColor(value)} /> {value === "all" ? "Tất cả" : value}</label>
          ))}
      </div>
      <div className="filterGroup">
        <strong>Giá</strong>
        {[["all","Tất cả"],["under500","Dưới 500K"],["500to700","500K – 700K"],["over700","Trên 700K"]]
          .filter(([value]) => value === "all" || availablePrices.has(value))
          .map(([value,label]) => (
            <label key={value}><input type="radio" checked={price === value} onChange={() => setPrice(value)} /> {label}</label>
          ))}
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
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
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

              {catalog.length > 0 && (
                <div style={{ textAlign: "left", width: "100%", borderTop: "1px solid var(--line)", paddingTop: "28px" }}>
                  <h4 style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "18px", color: "var(--muted)" }}>
                    Sản phẩm nổi bật đề xuất
                  </h4>
                  <div className="productGrid shopProductGrid">
                    {catalog.slice(0, 3).map((item) => (
                      <ProductCard key={item.id} product={item} />
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
