import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Box, Sparkles, WandSparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { products } from "@/lib/products";

export default function HomePage() {
  const featured = products.filter((item) => item.featured).slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">ÉLANE / FALL 2026</p>
          <h1>Quiet form.<br />Bold presence.</h1>
          <p className="heroLead">Một cửa hàng thời trang tối giản được thiết kế quanh trải nghiệm chọn đồ nhanh hơn — từ tìm sản phẩm, phối outfit đến thử đồ bằng AI.</p>
          <div className="heroActions">
            <Link className="btn" href="/shop">Khám phá bộ sưu tập <ArrowRight size={17} /></Link>
            <Link className="btn secondary" href="/outfit"><Sparkles size={17} /> Phối đồ AI</Link>
          </div>
        </div>
        <div className="heroImage">
          <Image src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=90" alt="ÉLANE editorial fashion" fill priority sizes="(max-width: 760px) 100vw, 45vw" />
          <div className="heroTag"><div><strong>THE NEW UNIFORM</strong><span>Minimal essentials / 2026</span></div><ArrowRight size={18} /></div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHead">
          <div><p className="eyebrow">CURATED FOR NOW</p><h2>New essentials</h2></div>
          <div><p>Những phom dáng dễ mặc, bảng màu trung tính và chi tiết đủ khác biệt để dùng cả đi làm lẫn đi chơi.</p><Link className="textLink" href="/shop">Xem tất cả <ArrowRight size={14} /></Link></div>
        </div>
        <div className="productGrid">{featured.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <section className="aiStrip">
        <div className="aiCopy">
          <p className="eyebrow">ÉLANE INTELLIGENCE</p>
          <h2>Your wardrobe,<br />less guesswork.</h2>
          <p>Chọn dịp, phong cách và ngân sách. Hệ thống chỉ phối từ sản phẩm đang còn hàng, chấm điểm độ tương thích và cho phép đổi outfit liên tục.</p>
          <div className="heroActions">
            <Link className="btn ghost" href="/outfit"><WandSparkles size={17} /> Tạo outfit</Link>
            <Link className="btn ghost" href="/try-on">Thử đồ online <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="aiVisual">
          <div className="outfitMini">
            {products.slice(0, 4).map((product) => <div key={product.id}><Image src={product.image} alt={product.name} fill sizes="160px" /></div>)}
          </div>
        </div>
      </section>

      <section className="section" style={{paddingTop: 0}}>
        <div className="sectionHead"><div><p className="eyebrow">SHOP SMARTER</p><h2>Built for the full flow</h2></div></div>
        <div className="valueGrid">
          <div className="valueCard"><Box size={24} /><h3>Kho hàng thật</h3><p>Phối đồ và chatbot chỉ trả về sản phẩm có trong catalog, có tồn kho và có link mua trực tiếp.</p></div>
          <div className="valueCard"><Sparkles size={24} /><h3>AI Stylist</h3><p>Tìm áo, quần, màu sắc, ngân sách bằng hội thoại tự nhiên và lưu lịch sử trò chuyện ngay trên trình duyệt.</p></div>
          <div className="valueCard"><WandSparkles size={24} /><h3>Virtual Try-On</h3><p>Trang thử đồ đã sẵn integration FASHN Cloud API; không có API key vẫn chạy được chế độ demo.</p></div>
        </div>
      </section>
    </>
  );
}
