"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/products";
import { useStore } from "./store-provider";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { catalog } = useStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = catalog.filter((item) => item.active !== false);
    if (!q) return available.filter((item) => item.featured || item.isNew).slice(0, 6);
    return available.filter((item) => `${item.name} ${item.subtitle} ${item.color} ${item.material} ${item.sku ?? ""}`.toLowerCase().includes(q)).slice(0, 8);
  }, [catalog, query]);

  if (!open) return null;

  return (
    <div className="searchOverlay">
      <div className="searchOverlayTop"><Link className="brand" href="/" onClick={onClose}>ÉLANE<span>®</span></Link><button className="iconButton" onClick={onClose} aria-label="Đóng tìm kiếm"><X size={22} /></button></div>
      <div className="searchOverlayInner">
        <div className="searchBigInput"><Search size={22} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm áo, quần, màu, chất liệu..." /><span>ESC</span></div>
        <div className="searchOverlayMeta"><span>{query ? `${results.length} kết quả cho “${query}”` : "Đề xuất cho bạn"}</span>{query ? <Link href={`/shop?q=${encodeURIComponent(query)}`} onClick={onClose}>Xem tất cả <ArrowRight size={13} /></Link> : null}</div>
        {results.length ? <div className="searchResultGrid">{results.map((product) => <Link className="searchResultCard" key={product.id} href={`/product/${product.id}`} onClick={onClose}><div className="searchResultImage"><Image src={product.image} alt={product.name} fill sizes="180px" /></div><div><strong>{product.name}</strong><span>{product.color} · {product.fit}</span><b>{formatPrice(product.price)}</b></div></Link>)}</div> : <div className="searchNoResult"><h3>Không tìm thấy món phù hợp.</h3><p>Thử tên sản phẩm, màu sắc hoặc danh mục khác.</p><Link className="btn secondary" href="/shop" onClick={onClose}>Xem toàn bộ collection</Link></div>}
      </div>
    </div>
  );
}
