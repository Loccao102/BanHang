"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, PackageCheck, RefreshCcw, ShieldCheck, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SocialCommerceStrip } from "@/components/social-commerce-strip";
import { useStore } from "@/components/store-provider";

const categories = [
  { title: "Đầm", subtitle: "Các mẫu đầm LSOUL đã đối chiếu", href: "/shop?category=dress", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nne8nuelvcba" },
  { title: "Đi tiệc", subtitle: "Phom corset và dáng nổi bật", href: "/shop?category=dress", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1f1r7brp00o0c" },
  { title: "Quần & chân váy", subtitle: "Denim, chân váy và các phom bottom dễ phối", href: "/shop?category=bottoms", image: "https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mcfweda66dlvc6" }
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
          <Image src="https://images.unsplash.com/photo-1776697453034-17d1942cd02a?auto=format&fit=crop&w=2400&q=92" alt="Editorial Thu Đông 2026 của LSOUL với đầm đen tối giản" fill priority sizes="100vw" />
        </div>
        <div className="luxHeroShade" />
        <div className="luxHeroSeason">THU / ĐÔNG · 2026</div>
        <div className="luxHeroWord" aria-hidden="true">LSOUL</div>
        <div className="luxHeroCopy">
          <p className="eyebrow">BỘ ẢNH MỚI / 26</p>
          <h1>Nữ tính.<br />Không mờ nhạt.</h1>
          <p>Đường nét cơ thể được tôn lên bằng corset, đầm ngắn, phom chiết eo và những bộ phối đủ nổi bật để bước ra phố.</p>
          <div className="luxHeroActions">
            <Link href="/shop?sort=new">Khám phá bộ sưu tập <ArrowRight size={16} /></Link>
            <Link href="/social">Xem cộng đồng LSOUL</Link>
          </div>
        </div>
        <a className="luxScrollCue" href="#collections"><span>Kéo xuống khám phá</span><ArrowDown size={15} /></a>
      </section>

      <section className="luxIntro" data-reveal>
        <p>LSOUL / 2026</p>
        <h2>Trang phục<br />tạo ấn tượng trước lời nói.</h2>
        <span>Thiết kế bằng phom dáng, tỷ lệ và cá tính.</span>
      </section>

      <section className="categoryEditorial luxCategoryEditorial" id="collections">
        {categories.map((category, index) => (
          <Link className="categoryEditorialCard luxCategoryCard" href={category.href} key={category.title} data-reveal>
            <Image src={category.image} alt={category.title} fill sizes="(max-width: 760px) 100vw, 33vw" />
            <div className="luxCategoryIndex">0{index + 1}</div>
            <div className="categoryEditorialOverlay">
              <span>{category.subtitle}</span>
              <h2>{category.title}</h2>
              <strong>Khám phá <ArrowRight size={14} /></strong>
            </div>
          </Link>
        ))}
      </section>

      <section className="section luxProductSection" data-reveal>
        <div className="sectionHead luxSectionHead">
          <div><p className="eyebrow">ĐƯỢC YÊU THÍCH</p><h2>Thiết kế<br />đáng chú ý.</h2></div>
          <div><p>Những thiết kế chủ lực của mùa — sắc nét trên hình ảnh, dễ tạo dấu ấn khi mặc ngoài đời.</p><Link className="textLink" href="/shop">Xem tất cả sản phẩm <ArrowRight size={14} /></Link></div>
        </div>
        <div className="productGrid luxProductGrid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="luxCampaign" data-reveal>
        <div className="luxCampaignMedia" data-parallax="0.055"><Image src="https://images.unsplash.com/photo-1768610285049-c18b54b81f10?auto=format&fit=crop&w=2400&q=92" alt="Bộ ảnh LSOUL về đêm với đầm đỏ trên rooftop" fill sizes="100vw" /></div>
        <div className="luxCampaignOverlay">
          <p className="eyebrow">BỘ ẢNH 01 / VỀ ĐÊM</p>
          <h2>Khi phố lên đèn,<br />cùng LSOUL.</h2>
          <p>Corset dựng phom, đầm ngắn và denim cạp thấp — một tủ đồ sinh ra để tạo dấu ấn.</p>
          <Link href="/shop">Khám phá lựa chọn này <ArrowRight size={15} /></Link>
        </div>
        <div className="luxCampaignNumber">01</div>
      </section>

      <section className="section luxProductSection luxProductSectionAlt" data-reveal>
        <div className="sectionHead luxSectionHead">
          <div><p className="eyebrow">MỚI LÊN KỆ</p><h2>Sản phẩm<br />mới.</h2></div>
          <Link className="textLink" href="/shop?sort=new">Xem hàng mới nhất <ArrowRight size={14} /></Link>
        </div>
        <div className="productGrid luxProductGrid luxProductGridReverse">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <SocialCommerceStrip />

      <section className="serviceRail luxServiceRail" data-reveal>
        <div><Truck size={19} /><strong>Miễn phí giao hàng từ 699K</strong><span>Toàn quốc cho đơn đủ điều kiện</span></div>
        <div><RefreshCcw size={19} /><strong>Đổi size trong 7 ngày</strong><span>Giữ tag và sản phẩm chưa qua sử dụng</span></div>
        <div><ShieldCheck size={19} /><strong>Thanh toán an toàn</strong><span>COD hoặc VietQR xác minh tự động</span></div>
        <div><PackageCheck size={19} /><strong>Theo dõi đơn hàng</strong><span>Trạng thái thanh toán và vận chuyển</span></div>
      </section>

      <section className="newsletter luxNewsletter" data-reveal>
        <div><p className="eyebrow">TIN MỚI TỪ LSOUL</p><h2>Xem trước.<br />Biết sớm hơn.</h2></div>
        <form onSubmit={(event) => event.preventDefault()}><input type="email" required placeholder="Email của bạn" aria-label="Email" /><button type="submit">Đăng ký nhận tin <ArrowRight size={15} /></button></form>
      </section>
    </>
  );
}
