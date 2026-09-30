import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div><div className="brand footerBrand">ÉLANE®</div><p>Quiet confidence. Everyday form.</p></div>
      <div><strong>Khám phá</strong><Link href="/shop">Shop</Link><Link href="/outfit">AI Outfit</Link><Link href="/try-on">Virtual Try-On</Link></div>
      <div><strong>Hỗ trợ</strong><span>Đổi trả trong 7 ngày</span><span>Size guide</span><span>Liên hệ</span></div>
      <div><strong>Demo project</strong><span>QR payment mô phỏng</span><span>AI API tùy chọn</span><Link href="/admin">Admin</Link></div>
    </footer>
  );
}
