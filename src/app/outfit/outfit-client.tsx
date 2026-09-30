"use client";

import Image from "next/image";
import Link from "next/link";
import { RefreshCw, ShoppingBag, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { generateOutfit, Outfit } from "@/lib/outfit";
import { formatPrice, products } from "@/lib/products";
import { useStore } from "@/components/store-provider";

export function OutfitClient() {
  const searchParams = useSearchParams();
  const requiredProductId = searchParams.get("product") ?? undefined;
  const [style, setStyle] = useState("minimal");
  const [occasion, setOccasion] = useState("date");
  const [budget, setBudget] = useState(1500000);
  const [variant, setVariant] = useState(0);
  const [look, setLook] = useState<Outfit>(() => generateOutfit({ style: "minimal", occasion: "date", budget: 1500000, requiredProductId, variant: 0 }));
  const { addToCart } = useStore();

  const requiredName = useMemo(() => requiredProductId ? products.find((item) => item.id === requiredProductId)?.name : undefined, [requiredProductId]);
  const total = look.items.reduce((sum, item) => sum + item.price, 0);

  function regenerate() {
    const nextVariant = variant + 1;
    setVariant(nextVariant);
    setLook((current) => generateOutfit({
      style,
      occasion,
      budget,
      requiredProductId,
      excludeIds: current.items.filter((item) => item.id !== requiredProductId).map((item) => item.id),
      variant: nextVariant
    }));
  }

  function buyLook() {
    look.items.forEach((item) => addToCart(item, item.sizes[0]));
  }

  return (
    <section className="builderPage">
      <div className="builderHero">
        <div><p className="eyebrow">AI OUTFIT LAB</p><h1>Build a look.</h1></div>
        <p style={{maxWidth: 500, color: 'var(--muted)', lineHeight: 1.7}}>Hệ thống phối trực tiếp từ tồn kho hiện tại, ưu tiên màu sắc, style, hoàn cảnh và ngân sách. {requiredName ? `Món “${requiredName}” được khóa trong outfit.` : "Bấm liên tục để đổi set mà không lặp ngay các món vừa xem."}</p>
      </div>
      <div className="builderControls">
        <select value={occasion} onChange={(event) => setOccasion(event.target.value)}><option value="date">Hẹn hò</option><option value="work">Đi làm</option><option value="casual">Đi chơi</option><option value="party">Sự kiện</option></select>
        <select value={style} onChange={(event) => setStyle(event.target.value)}><option value="minimal">Minimal</option><option value="smart-casual">Smart casual</option><option value="classic">Classic</option><option value="street">Street</option></select>
        <input type="number" min={500000} step={100000} value={budget} onChange={(event) => setBudget(Number(event.target.value))} aria-label="Ngân sách" />
        <button className="btn" onClick={regenerate}><Sparkles size={17} /> Phối cho tôi</button>
      </div>

      <div className="lookStage">
        <div className="lookCanvas">
          {look.items.map((item) => <Link className="lookTile" key={item.id} href={`/product/${item.id}`}><Image src={item.image} alt={item.name} fill sizes="(max-width: 760px) 45vw, 28vw" /></Link>)}
        </div>
        <aside className="lookInfo">
          <div className="scoreCircle"><strong>{look.score}</strong><small>/ 100</small></div>
          <h2>ÉLANE match</h2>
          <p>{look.reason}</p>
          <div className="lookList">{look.items.map((item) => <Link href={`/product/${item.id}`} key={item.id}><span>{item.name}<br /><small style={{color:'#aaa'}}>{item.color}</small></span><strong>{formatPrice(item.price)}</strong></Link>)}</div>
          <div className="lookTotal">Tổng: <strong>{formatPrice(total)}</strong></div>
          <div style={{display:'grid', gap: 8}}>
            <button className="btn block" onClick={buyLook}><ShoppingBag size={17} /> Thêm cả outfit vào giỏ</button>
            <button className="btn ghost block" onClick={regenerate}><RefreshCw size={16} /> Phối bộ khác</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
