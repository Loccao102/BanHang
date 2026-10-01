"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageCheck, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SocialCommerceStrip } from "@/components/social-commerce-strip";
import { useStore } from "@/components/store-provider";

const categories = [
  { title: "Dresses", subtitle: "Mini / midi / bodycon", href: "/shop?category=dress", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1100&q=88" },
  { title: "Corsets & Tops", subtitle: "Sculpted / cropped / fitted", href: "/shop?category=tops", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1100&q=88" },
  { title: "Matching Sets", subtitle: "Tailored / denim / knit", href: "/shop?category=set", image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1100&q=88" }
];

export function HomeClient() {
  const { catalog } = useStore();
  const available = catalog.filter((item) => item.active !== false);
  const featured = available.filter((item) => item.featured).slice(0, 4);
  const newArrivals = available.filter((item) => item.isNew).slice(0, 4);

  return (
    <>
      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">LSOUL / FALL 2026</p>
          <h1>Feminine.<br />Never quiet.</h1>
          <p className="heroLead">Những đường cong được tôn lên bằng corset, mini dress, tailoring chiết eo và những set đồ đủ nổi bật để bước thẳng từ feed ra ngoài đời.</p>
          <div className="heroActions"><Link className="btn" href="/shop?sort=new">Shop new arrivals <ArrowRight size={17} /></Link><Link className="btn secondary" href="/shop">Xem toàn bộ</Link></div>
        </div>
        <div className="heroImage">
          <Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=90" alt="LSOUL editorial fashion" fill priority sizes="(max-width: 760px) 100vw, 45vw" />
          <div className="heroTag"><div><strong>THE NEW SILHOUETTE</strong><span>Fall / Winter 2026</span></div><ArrowRight size={18} /></div>
        </div>
      </section>

      <section className="categoryEditorial">{categories.map((category) => <Link className="categoryEditorialCard" href={category.href} key={category.title}><Image src={category.image} alt={category.title} fill sizes="(max-width: 760px) 100vw, 33vw" /><div className="categoryEditorialOverlay"><span>{category.subtitle}</span><h2>{category.title}</h2><strong>Shop collection <ArrowRight size={14} /></strong></div></Link>)}</section>

      <section className="section">
        <div className="sectionHead"><div><p className="eyebrow">MOST WANTED</p><h2>Best sellers</h2></div><div><p>Những món chủ lực dễ phối, giữ phom tốt và có thể đi xuyên nhiều hoàn cảnh trong tuần.</p><Link className="textLink" href="/shop">Xem tất cả <ArrowRight size={14} /></Link></div></div>
        <div className="productGrid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="campaignSplit">
        <div className="campaignImage"><Image src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=88" alt="LSOUL campaign" fill sizes="(max-width: 760px) 100vw, 55vw" /></div>
        <div className="campaignCopy"><p className="eyebrow">EDITORIAL 01</p><h2>After dark, by LSOUL.</h2><p>Từ corset dựng phom đến mini dress và low-rise denim, mỗi look được tạo để lên hình sắc nét nhưng vẫn giữ được cá tính khi mặc ngoài đời.</p><Link className="btn secondary" href="/shop">Khám phá edit <ArrowRight size={16} /></Link></div>
      </section>

      <section className="section">
        <div className="sectionHead"><div><p className="eyebrow">JUST LANDED</p><h2>New arrivals</h2></div><Link className="textLink" href="/shop?sort=new">Xem mới nhất <ArrowRight size={14} /></Link></div>
        <div className="productGrid">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <SocialCommerceStrip />

      <section className="serviceRail">
        <div><Truck size={21} /><strong>Freeship từ 699K</strong><span>Toàn quốc cho đơn đủ điều kiện</span></div>
        <div><RefreshCcw size={21} /><strong>Đổi size trong 7 ngày</strong><span>Giữ tag và sản phẩm chưa qua sử dụng</span></div>
        <div><ShieldCheck size={21} /><strong>Checkout an toàn</strong><span>COD hoặc chuyển khoản nhanh bằng QR</span></div>
        <div><PackageCheck size={21} /><strong>Theo dõi đơn hàng</strong><span>Tra cứu trạng thái và lịch sử đơn hàng</span></div>
      </section>

      <section className="newsletter"><div><p className="eyebrow">LSOUL LETTER</p><h2>New drops, first on your feed.</h2></div><form onSubmit={(event) => event.preventDefault()}><input type="email" required placeholder="Email của bạn" aria-label="Email" /><button type="submit">Đăng ký <ArrowRight size={15} /></button></form></section>
    </>
  );
}
