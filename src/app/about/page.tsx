import Image from "next/image";

export default function AboutPage() {
  return (
    <section className="aboutPage">
      <div className="aboutHeader"><p className="eyebrow">ABOUT LSOUL</p><h1>Feminine.<br />With an edge.</h1></div>
      <div className="aboutHeroGrid">
        <div className="aboutHeroImage"><Image src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=88" alt="LSOUL studio" fill sizes="(max-width:760px) 100vw, 50vw" /></div>
        <div className="aboutStory"><p className="eyebrow">OUR POINT OF VIEW</p><h2>Designed to be remembered.</h2><p>LSOUL phát triển những thiết kế nữ tính nhưng cá tính, nhấn vào đường cong, tỷ lệ cơ thể và những silhouette có khả năng tạo dấu ấn ngay từ ánh nhìn đầu tiên.</p><p>Website kết nối trải nghiệm mua sắm với social commerce: khách hàng có thể khám phá look từ campaign, creators và cộng đồng rồi mua trực tiếp những sản phẩm được tag trong từng nội dung.</p></div>
      </div>
    </section>
  );
}
