import Image from "next/image";

export default function AboutPage() {
  return (
    <section className="aboutPage">
      <div className="aboutHeader"><p className="eyebrow">ABOUT ÉLANE</p><h1>Less noise.<br />More form.</h1></div>
      <div className="aboutHeroGrid">
        <div className="aboutHeroImage"><Image src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=88" alt="ÉLANE studio" fill sizes="(max-width:760px) 100vw, 50vw" /></div>
        <div className="aboutStory"><p className="eyebrow">OUR POINT OF VIEW</p><h2>Designed for repeat wear.</h2><p>ÉLANE là concept thương hiệu thời trang hiện đại phục vụ đồ án ecommerce: thiết kế tối giản, bảng màu dễ phối và trải nghiệm mua sắm sạch, nhanh, rõ ràng.</p><p>Ở giai đoạn đầu, hệ thống ưu tiên hoàn thiện đầy đủ luồng bán hàng — catalog, wishlist, cart, voucher, checkout, QR demo, lịch sử đơn — trước khi mở rộng sang chatbot và virtual try-on.</p></div>
      </div>
    </section>
  );
}
