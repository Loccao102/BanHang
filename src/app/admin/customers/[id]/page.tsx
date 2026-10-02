"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

type Data={customer:any};
export default function CustomerDetailPage(){
  const {user,accountLoading}=useStore(); const params=useParams<{id:string}>(); const [data,setData]=useState<Data|null>(null);
  useEffect(()=>{if(user?.role==="admin" && params.id) void fetch(`/api/admin/customers/${params.id}`,{cache:"no-store"}).then(r=>r.ok?r.json():null).then(setData)},[user,params.id]);
  if(accountLoading || (user?.role==="admin"&&!data)) return <div className="accountLoading"><div className="skeletonLine title"/><div className="skeletonBlock detailSkeleton"/></div>;
  if(!user||user.role!=="admin") return <section className="adminAccessDenied"><div><h1>Khu vực quản trị</h1><Link className="btn" href="/login?next=/admin/customers">Đăng nhập quản trị</Link></div></section>;
  if(!data) return <section className="adminPage"><p>Không tìm thấy khách hàng.</p></section>;
  const c=data.customer; const avg=c.assessments?.length?Math.round(c.assessments.reduce((s:number,x:any)=>s+x.overallScore,0)/c.assessments.length):0;
  return <section className="adminPage adminConsole">
    <div className="adminHero"><div><p className="eyebrow">CUSTOMER 360</p><h1>{c.name}</h1><p>{c.email} · {c.phone || "Chưa có SĐT"}</p></div><div className="adminHeroActions"><Link className="btn ghost small" href="/admin/customers">← Khách hàng</Link></div></div>
    <div className="statsGrid"><div className="statCard"><small>Lifetime value</small><strong className="moneyStat">{formatPrice(c.lifetimeValue)}</strong></div><div className="statCard"><small>Đơn hàng</small><strong>{c.orders.length}</strong></div><div className="statCard"><small>Try-On</small><strong>{c.tryOns.length}</strong></div><div className="statCard"><small>Stylist score TB</small><strong>{avg || "—"}</strong></div></div>
    <div className="adminOverviewGrid">
      <div className="adminPanel"><h2>Style profile</h2>{c.styleProfile?<><p>Confidence: {Math.round(c.styleProfile.confidence*100)}% · {c.styleProfile.eventCount} tín hiệu</p><pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify({categories:c.styleProfile.preferredCategories,types:c.styleProfile.preferredTypes,colors:c.styleProfile.preferredColors,styles:c.styleProfile.preferredStyles},null,2)}</pre></>:<p>Chưa đủ dữ liệu học gu.</p>}</div>
      <div className="adminPanel"><h2>Affinity cao nhất</h2><div className="compactList">{c.affinities.map((x:any)=><div key={x.product.id}><span><strong>{x.product.name}</strong><small>{x.product.category} · {x.product.color}</small></span><b>{x.score.toFixed(1)}</b></div>)}</div></div>
    </div>
    <div className="adminOverviewGrid">
      <div className="adminPanel"><h2>Đơn gần đây</h2><div className="compactList">{c.orders.slice(0,8).map((o:any)=><div key={o.id}><span><strong><Link href={`/admin/orders/${o.id}`}>#{o.id}</Link></strong><small>{o.status} · {new Intl.DateTimeFormat("vi-VN").format(new Date(o.createdAt))}</small></span><b>{formatPrice(o.total)}</b></div>)}</div></div>
      <div className="adminPanel"><h2>Wishlist</h2><div className="compactList">{c.wishlist.slice(0,10).map((p:any)=><div key={p.id}><span><strong>{p.name}</strong></span><b>{formatPrice(p.price)}</b></div>)}</div></div>
    </div>
  </section>;
}
