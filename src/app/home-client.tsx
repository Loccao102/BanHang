"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, PackageCheck, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SocialCommerceStrip } from "@/components/social-commerce-strip";
import { useStore } from "@/components/store-provider";

const categories = [
  { title: "Dresses", subtitle: "Verified LSOUL dresses", href: "/shop?category=dress", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nuelvcba" },
  { title: "Party Edit", subtitle: "Corset structure / statement silhouettes", href: "/shop?category=dress", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1f1r7brp00o0c" },
  { title: "Sets", subtitle: "Dress & corset combinations", href: "/shop?category=set", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-md43u55pmwf045" }
];

export function HomeClient() {
  const { catalog } = useStore();
  const available = catalog.filter((item) => item.active !== false);
  const featured = available.filter((item) => item.featured).slice(0, 4);
  const newArrivals = available.filter((item) => item.isNew).slice(0, 4);

  return (
    <>
      <section className="luxHero">
        <div className="luxHeroMedia" data-parallax="0.045">
          <Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=94" alt="LSOUL Fall Winter 2026 campaign" fill priority sizes="100vw" />
        </div>
        <div className="luxHeroShade" />
        <div className="luxHeroSeason">FALL / WINTER · 2026</div>
        <div className="luxHeroWord" aria-hidden="true">LSOUL</div>
        <div className="luxHeroCopy">
          <p className="eyebrow">NEW CAMPAIGN / 26</p>
          <h1>Feminine.<br />Never quiet.</h1>
          <p>Những đường cong được tôn lên bằng corset, mini dress, tailoring chiết eo và những set đồ đủ nổi bật để bước thẳng từ feed ra ngoài đời.</p>
          <div className="luxHeroActions">
            <Link href="/shop?sort=new">Explore the collection <ArrowRight size={16} /></Link>
            <Link href="/social">Seen on LSOUL Social</Link>
          </div>
        </div>
        <a className="luxScrollCue" href="#collections"><span>Scroll to discover</span><ArrowDown size={15} /></a>
      </section>

      <section className="luxIntro" data-reveal>
        <p>LSOUL / 2026</p>
        <h2>Clothes that<br />enter before you do.</h2>
        <span>Designed in a language of shape, proportion and attitude.</span>
      </section>

      <section className="categoryEditorial luxCategoryEditorial" id="collections">
        {categories.map((category, index) => (
          <Link className="categoryEditorialCard luxCategoryCard" href={category.href} key={category.title} data-reveal>
            <Image src={category.image} alt={category.title} fill sizes="(max-width: 760px) 100vw, 33vw" />
            <div className="luxCategoryIndex">0{index + 1}</div>
            <div className="categoryEditorialOverlay">
              <span>{category.subtitle}</span>
              <h2>{category.title}</h2>
              <strong>Discover <ArrowRight size={14} /></strong>
            </div>
          </Link>
        ))}
      </section>

      <section className="section luxProductSection" data-reveal>
        <div className="sectionHead luxSectionHead">
          <div><p className="eyebrow">MOST WANTED</p><h2>Objects of<br />desire.</h2></div>
          <div><p>Những thiết kế chủ lực của mùa — sắc nét trên hình ảnh, dễ tạo dấu ấn khi mặc ngoài đời.</p><Link className="textLink" href="/shop">View all pieces <ArrowRight size={14} /></Link></div>
        </div>
        <div className="productGrid luxProductGrid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="luxCampaign" data-reveal>
        <div className="luxCampaignMedia" data-parallax="0.055"><Image src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2100&q=92" alt="LSOUL After dark campaign" fill sizes="100vw" /></div>
        <div className="luxCampaignOverlay">
          <p className="eyebrow">EDITORIAL 01 / AFTER DARK</p>
          <h2>After dark,<br />by LSOUL.</h2>
          <p>Corset dựng phom, mini dress và low-rise denim — một wardrobe sinh ra để được nhìn thấy.</p>
          <Link href="/shop">Enter the edit <ArrowRight size={15} /></Link>
        </div>
        <div className="luxCampaignNumber">01</div>
      </section>

      <section className="section luxProductSection luxProductSectionAlt" data-reveal>
        <div className="sectionHead luxSectionHead">
          <div><p className="eyebrow">JUST LANDED</p><h2>New<br />arrivals.</h2></div>
          <Link className="textLink" href="/shop?sort=new">The latest drop <ArrowRight size={14} /></Link>
        </div>
        <div className="productGrid luxProductGrid luxProductGridReverse">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <SocialCommerceStrip />

      <section className="serviceRail luxServiceRail" data-reveal>
        <div><Truck size={19} /><strong>Freeship từ 699K</strong><span>Toàn quốc cho đơn đủ điều kiện</span></div>
        <div><RefreshCcw size={19} /><strong>Đổi size trong 7 ngày</strong><span>Giữ tag và sản phẩm chưa qua sử dụng</span></div>
        <div><ShieldCheck size={19} /><strong>Checkout an toàn</strong><span>COD hoặc VietQR xác minh tự động</span></div>
        <div><PackageCheck size={19} /><strong>Theo dõi đơn hàng</strong><span>Trạng thái thanh toán và vận chuyển</span></div>
      </section>

      <section className="newsletter luxNewsletter" data-reveal>
        <div><p className="eyebrow">LSOUL LETTER</p><h2>First look.<br />Before everyone else.</h2></div>
        <form onSubmit={(event) => event.preventDefault()}><input type="email" required placeholder="Email của bạn" aria-label="Email" /><button type="submit">Join the list <ArrowRight size={15} /></button></form>
      </section>
    </>
  );
}
