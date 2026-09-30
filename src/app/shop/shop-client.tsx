"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { useStore } from "@/components/store-provider";
import { categoryLabels, products } from "@/lib/products";

export function ShopClient() {
  const searchParams = useSearchParams();
  const initialGender = searchParams.get("gender") ?? "all";
  const wishlistOnly = searchParams.get("wishlist") === "1";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [color, setColor] = useState("all");
  const [gender, setGender] = useState(initialGender);
  const [sort, setSort] = useState(searchParams.get("sort") === "new" ? "new" : "featured");
  const { wishlist } = useStore();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    let result = products.filter((product) => {
      const matchText = !normalized || `${product.name} ${product.subtitle} ${product.color}`.toLowerCase().includes(normalized);
      const matchCategory = category === "all" || product.category === category;
      const matchColor = color === "all" || product.colorFamily === color;
      const matchGender = gender === "all" || product.gender === gender || product.gender === "unisex";
      const matchWishlist = !wishlistOnly || wishlist.includes(product.id);
      return matchText && matchCategory && matchColor && matchGender && matchWishlist;
    });
    if (sort === "price-low") result = result.toSorted((a, b) => a.price - b.price);
    if (sort === "price-high") result = result.toSorted((a, b) => b.price - a.price);
    if (sort === "new") result = result.toSorted((a, b) => Number(b.isNew) - Number(a.isNew));
    return result;
  }, [query, category, color, gender, sort, wishlistOnly, wishlist]);

  return (
    <>
      <section className="pageHero">
        <p className="eyebrow">ONLINE STORE</p>
        <h1>{wishlistOnly ? "Wishlist" : "The collection"}</h1>
        <p>Catalog demo có màu, size, tồn kho và metadata phục vụ chatbot / outfit recommendation. Lọc nhanh để tìm đúng món bạn cần.</p>
      </section>
      <div className="shopShell">
        <aside className="filters">
          <div className="filterGroup">
            <strong>Tìm kiếm</strong>
            <input className="searchInput" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Áo đen, chino..." />
          </div>
          <div className="filterGroup">
            <strong>Danh mục</strong>
            <label><input type="radio" checked={category === "all"} onChange={() => setCategory("all")} /> Tất cả</label>
            {Object.entries(categoryLabels).map(([key, label]) => <label key={key}><input type="radio" checked={category === key} onChange={() => setCategory(key)} /> {label}</label>)}
          </div>
          <div className="filterGroup">
            <strong>Màu sắc</strong>
            {["all", "black", "white", "navy", "beige", "blue", "brown", "green"].map((value) => (
              <label key={value}><input type="radio" checked={color === value} onChange={() => setColor(value)} /> {value === "all" ? "Tất cả" : value}</label>
            ))}
          </div>
          <div className="filterGroup">
            <strong>Đối tượng</strong>
            {[["all", "Tất cả"], ["men", "Nam"], ["women", "Nữ"]].map(([value, label]) => <label key={value}><input type="radio" checked={gender === value} onChange={() => setGender(value)} /> {label}</label>)}
          </div>
        </aside>
        <section>
          <div className="shopTop"><span>{filtered.length} sản phẩm</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Nổi bật</option><option value="new">Mới nhất</option><option value="price-low">Giá thấp → cao</option><option value="price-high">Giá cao → thấp</option></select></div>
          <div className="productGrid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div>
        </section>
      </div>
    </>
  );
}
