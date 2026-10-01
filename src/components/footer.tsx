import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="brand footerBrand">LSOUL®</div>
        <p>Modern essentials for everyday form.</p>
        <span>Hà Nội · Việt Nam</span>
      </div>
      <div><strong>Mua sắm</strong><Link href="/shop?sort=new">Mới về</Link><Link href="/shop?category=dress">Đầm</Link><Link href="/shop?category=set">Set đồ</Link><Link href="/shop?sale=1">Sale</Link></div>
      <div><strong>Dịch vụ</strong><Link href="/size-guide">Hướng dẫn chọn size</Link><Link href="/orders">Tra cứu đơn hàng</Link><span>Đổi trả trong 7 ngày</span><span>Freeship từ 699K</span></div>
      <div><strong>Về LSOUL</strong><Link href="/about">Câu chuyện thương hiệu</Link><Link href="/social">LSOUL Social</Link><a href="https://www.instagram.com/lsoul.officiel/" target="_blank" rel="noreferrer">Instagram @lsoul.officiel</a><span>Hỗ trợ khách hàng 09:00–21:00</span></div>
    </footer>
  );
}
