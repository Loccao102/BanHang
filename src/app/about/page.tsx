import Image from "next/image";

export default function AboutPage() {
  return (
    <section className="aboutPage">
      <div className="aboutHeader"><p className="eyebrow">ABOUT ÉLANE</p><h1>Less noise.<br />More form.</h1></div>
      <div className="aboutHeroGrid">
        <div className="aboutHeroImage"><Image src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=88" alt="ÉLANE studio" fill sizes="(max-width:760px) 100vw, 50vw" /></div>
        <div className="aboutStory"><p className="eyebrow">OUR POINT OF VIEW</p><h2>Designed for repeat wear.</h2><p>ÉLANE theo đuổi thời trang hiện đại với những thiết kế tối giản, bảng màu dễ phối và phom dáng có thể mặc lặp lại trong nhiều hoàn cảnh.</p><p>Mỗi bộ sưu tập được xây dựng quanh tính ứng dụng: dễ chọn, dễ phối và đủ linh hoạt để đi cùng bạn từ ngày làm việc đến những cuộc hẹn sau giờ tan ca.</p></div>
      </div>
    </section>
  );
}
