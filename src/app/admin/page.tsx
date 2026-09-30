import { Boxes, MessageSquareText, PackageCheck, Sparkles } from "lucide-react";
import { categoryLabels, formatPrice, products } from "@/lib/products";

export default function AdminPage() {
  const stock = products.reduce((sum, item) => sum + item.stock, 0);
  const inventoryValue = products.reduce((sum, item) => sum + item.price * item.stock, 0);

  return (
    <section className="adminPage">
      <div className="adminHero">
        <div><p className="eyebrow">ADMIN / DEMO</p><h1>Store overview.</h1></div>
        <span style={{color:'var(--muted)', maxWidth: 430, lineHeight: 1.6}}>Dashboard demo không auth để phục vụ đồ án. Các số liệu được suy ra từ catalog seed hiện tại.</span>
      </div>
      <div className="statsGrid">
        <div className="statCard"><Boxes size={18} /><small>Sản phẩm</small><strong>{products.length}</strong></div>
        <div className="statCard"><PackageCheck size={18} /><small>Tồn kho</small><strong>{stock}</strong></div>
        <div className="statCard"><Sparkles size={18} /><small>AI modules</small><strong>3</strong></div>
        <div className="statCard"><MessageSquareText size={18} /><small>Giá trị kho</small><strong style={{fontSize: 23}}>{formatPrice(inventoryValue)}</strong></div>
      </div>
      <div className="tableWrap">
        <table className="adminTable">
          <thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Màu</th><th>Giá</th><th>Kho</th><th>Trạng thái</th></tr></thead>
          <tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{categoryLabels[product.category]}</td><td>{product.color}</td><td>{formatPrice(product.price)}</td><td>{product.stock}</td><td><span className="statusPill">Đang bán</span></td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
