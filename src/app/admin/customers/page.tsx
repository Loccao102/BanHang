"use client";

import Link from "next/link";
import { Search, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

type CustomerRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  orderCount: number;
  wishlistCount: number;
  addressCount: number;
  lifetimeValue: number;
  lastOrderAt?: string | null;
};

export default function AdminCustomersPage() {
  const { user, accountLoading } = useStore();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") return;
    void fetch("/api/admin/customers", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { customers: [] })
      .then((data: { customers: CustomerRow[] }) => setCustomers(data.customers));
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((customer) => !q || `${customer.name} ${customer.email} ${customer.phone ?? ""}`.toLowerCase().includes(q));
  }, [customers, query]);

  if (accountLoading) return <div className="accountLoading"><div className="skeletonLine title" /><div className="skeletonBlock detailSkeleton" /></div>;
  if (!user || user.role !== "admin") return <section className="adminAccessDenied"><div><h1>Khu vực quản trị</h1><Link className="btn" href="/login?next=/admin/customers">Đăng nhập quản trị</Link></div></section>;

  return <section className="adminPage adminConsole">
    <div className="adminHero"><div><p className="eyebrow">CUSTOMER CRM</p><h1>Khách hàng.</h1></div><div className="adminHeroActions"><Link className="btn ghost small" href="/admin">← Tổng quan</Link><Link className="btn small" href="/admin/marketing">Social & ưu đãi</Link></div></div>
    <div className="statsGrid">
      <div className="statCard"><UserRound size={18} /><small>Khách hàng</small><strong>{customers.length}</strong><span>Tài khoản đã đăng ký</span></div>
      <div className="statCard"><ShoppingBag size={18} /><small>Tổng đơn</small><strong>{customers.reduce((sum,item)=>sum+item.orderCount,0)}</strong><span>Đơn gắn tài khoản</span></div>
      <div className="statCard"><small>Customer value</small><strong className="moneyStat">{formatPrice(customers.reduce((sum,item)=>sum+item.lifetimeValue,0))}</strong><span>Doanh thu từ khách đăng nhập</span></div>
      <div className="statCard"><small>Wishlist</small><strong>{customers.reduce((sum,item)=>sum+item.wishlistCount,0)}</strong><span>Sản phẩm được khách lưu</span></div>
    </div>
    <div className="adminPanel">
      <div className="adminPanelHead adminPanelToolbar"><div><p className="eyebrow">CUSTOMERS</p><h2>{filtered.length} khách hàng</h2></div><div className="adminSearch"><Search size={14} /><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Tên, email, số điện thoại..." /></div></div>
      <div className="tableWrap"><table className="adminTable customerTable"><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Đơn hàng</th><th>Wishlist</th><th>Lifetime value</th><th>Đơn gần nhất</th></tr></thead><tbody>{filtered.map((customer)=><tr key={customer.id}><td><strong><Link href={`/admin/customers/${customer.id}`}>{customer.name}</Link></strong><small>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium"}).format(new Date(customer.createdAt))}</small></td><td>{customer.email}<small>{customer.phone || "Chưa có SĐT"}</small></td><td>{customer.orderCount}</td><td>{customer.wishlistCount}</td><td><strong>{formatPrice(customer.lifetimeValue)}</strong></td><td>{customer.lastOrderAt ? new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium"}).format(new Date(customer.lastOrderAt)) : "—"}</td></tr>)}</tbody></table></div>
    </div>
  </section>;
}
