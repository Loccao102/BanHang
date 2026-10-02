"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

type Data = {
  summary: { customers:number; products:number; activeProducts:number; totalStock:number; orders:number; paidOrders:number; paidRevenue:number; grossOrderValue:number; averageOrderValue:number };
  byStatus: Record<string,number>; byPayment: Record<string,number>;
  daily: {date:string;orders:number;revenue:number}[];
  topProducts: {productId:string;name:string;quantity:number;revenue:number}[];
};

export default function AdminAnalyticsPage(){
  const { user, accountLoading } = useStore();
  const [data,setData]=useState<Data|null>(null);
  useEffect(()=>{ if(user?.role==="admin") void fetch("/api/admin/analytics",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(setData); },[user]);
  if(accountLoading || (user?.role==="admin" && !data)) return <div className="accountLoading"><div className="skeletonLine title"/><div className="skeletonBlock detailSkeleton"/></div>;
  if(!user || user.role!=="admin") return <section className="adminAccessDenied"><div><h1>Khu vực quản trị</h1><Link className="btn" href="/login?next=/admin/analytics">Đăng nhập quản trị</Link></div></section>;
  if(!data) return null;
  const maxRevenue=Math.max(1,...data.daily.map(x=>x.revenue));
  return <section className="adminPage adminConsole">
    <div className="adminHero"><div><p className="eyebrow">SALES ANALYTICS</p><h1>Hiệu quả kinh doanh.</h1></div><div className="adminHeroActions"><Link className="btn ghost small" href="/admin">← Tổng quan</Link><Link className="btn small" href="/admin/ai">AI Insights</Link></div></div>
    <div className="statsGrid">
      <div className="statCard"><TrendingUp size={18}/><small>Doanh thu đã thu</small><strong className="moneyStat">{formatPrice(data.summary.paidRevenue)}</strong><span>GMV {formatPrice(data.summary.grossOrderValue)}</span></div>
      <div className="statCard"><ShoppingBag size={18}/><small>Đơn đã thu tiền</small><strong>{data.summary.paidOrders}</strong><span>{data.summary.orders} tổng đơn</span></div>
      <div className="statCard"><BarChart3 size={18}/><small>AOV</small><strong className="moneyStat">{formatPrice(data.summary.averageOrderValue)}</strong><span>Giá trị đơn trung bình</span></div>
      <div className="statCard"><Users size={18}/><small>Khách hàng</small><strong>{data.summary.customers}</strong><span>{data.summary.activeProducts} sản phẩm đang bán</span></div>
    </div>
    <div className="adminOverviewGrid">
      <div className="adminPanel"><div className="adminPanelHead"><div><p className="eyebrow">30 DAYS</p><h2>Doanh thu theo ngày</h2></div></div>
        <div style={{display:"grid",gap:8}}>{data.daily.map((x)=><div key={x.date} style={{display:"grid",gridTemplateColumns:"92px 1fr 110px",gap:10,alignItems:"center"}}><small>{new Intl.DateTimeFormat("vi-VN",{day:"2-digit",month:"2-digit"}).format(new Date(x.date))}</small><div style={{height:8,background:"#eee"}}><div style={{height:"100%",width:`${Math.max(2,x.revenue/maxRevenue*100)}%`,background:"#111"}}/></div><strong>{formatPrice(x.revenue)}</strong></div>)}</div>
      </div>
      <div className="adminPanel"><div className="adminPanelHead"><div><p className="eyebrow">TOP PRODUCTS</p><h2>Bán chạy theo số lượng</h2></div></div>
        <div className="compactList">{data.topProducts.map((x)=><div key={x.productId}><span><strong>{x.name}</strong><small>{formatPrice(x.revenue)}</small></span><b>{x.quantity}</b></div>)}</div>
      </div>
    </div>
    <div className="adminOverviewGrid">
      <div className="adminPanel"><h2>Trạng thái đơn</h2><div className="compactList">{Object.entries(data.byStatus).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></div>
      <div className="adminPanel"><h2>Trạng thái thanh toán</h2><div className="compactList">{Object.entries(data.byPayment).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div></div>
    </div>
  </section>;
}
