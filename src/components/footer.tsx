import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <div className="brand footerBrand">ÉLANE®</div>
        <p>Modern essentials for everyday form.</p>
        <span>Hà Nội · Việt Nam</span>
      </div>
      <div><strong>Mua sắm</strong><Link href="/shop?sort=new">Mới về</Link><Link href="/shop?gender=women">Nữ</Link><Link href="/shop?gender=men">Nam</Link><Link href="/shop?sale=1">Sale</Link></div>
      <div><strong>Dịch vụ</strong><Link href="/size-guide">Hướng dẫn chọn size</Link><Link href="/orders">Tra cứu đơn hàng</Link><span>Đổi trả trong 7 ngày</span><span>Freeship từ 699K</span></div>
      <div><strong>Về ÉLANE</strong><Link href="/about">Câu chuyện thương hiệu</Link><Link href="/admin">Quản trị cửa hàng</Link><span>Instagram · TikTok</span><span>Hỗ trợ khách hàng 09:00–21:00</span></div>
    </footer>
  );
}
