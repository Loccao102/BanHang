"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

export default function AdminOrderDetailPage(){
  const {user,accountLoading}=useStore(); const params=useParams<{id:string}>(); const [order,setOrder]=useState<any>(null);
  async function load(){const r=await fetch(`/api/orders/${params.id}`,{cache:"no-store"}); if(r.ok)setOrder((await r.json()).order);}
  useEffect(()=>{if(user?.role==="admin"&&params.id) void load()},[user,params.id]);
  if(accountLoading || (user?.role==="admin"&&!order)) return <div className="accountLoading"><div className="skeletonLine title"/><div className="skeletonBlock detailSkeleton"/></div>;
  if(!user||user.role!=="admin") return <section className="adminAccessDenied"><div><h1>Khu vực quản trị</h1><Link className="btn" href="/login?next=/admin">Đăng nhập quản trị</Link></div></section>;
  if(!order) return null;
  return <section className="adminPage adminConsole">
    <div className="adminHero"><div><p className="eyebrow">ORDER DETAIL</p><h1>#{order.id}</h1><p>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(order.createdAt))}</p></div><div className="adminHeroActions"><Link className="btn ghost small" href="/admin/fulfillment">← Vận hành đơn</Link></div></div>
    <div className="statsGrid"><div className="statCard"><small>Tổng tiền</small><strong className="moneyStat">{formatPrice(order.total)}</strong></div><div className="statCard"><small>Trạng thái</small><strong>{order.status}</strong></div><div className="statCard"><small>Thanh toán</small><strong>{order.paymentStatus}</strong><span>{order.paymentProvider||order.payment}</span></div><div className="statCard"><small>Vận chuyển</small><strong>{order.shippingCarrier||"—"}</strong><span>{order.trackingCode||"Chưa có mã vận đơn"}</span></div></div>
    <div className="adminOverviewGrid">
      <div className="adminPanel"><h2>Khách nhận hàng</h2><p><strong>{order.customerName}</strong></p><p>{order.phone}</p><p>{order.address}, {order.city}</p>{order.note?<p>Ghi chú: {order.note}</p>:null}</div>
      <div className="adminPanel"><h2>Thanh toán</h2><p>Subtotal: {formatPrice(order.subtotal)}</p><p>Shipping: {formatPrice(order.shipping)}</p><p>Discount: -{formatPrice(order.discount)}</p><p><strong>Total: {formatPrice(order.total)}</strong></p><p>Coupon: {order.couponCode||"—"}</p></div>
    </div>
    <div className="adminPanel"><h2>Sản phẩm</h2><div className="tableWrap"><table className="adminTable"><thead><tr><th>Sản phẩm</th><th>Size</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>{order.items.map((x:any)=><tr key={x.id}><td>{x.productName}<small>{x.productColor}</small></td><td>{x.size||"—"}</td><td>{x.quantity}</td><td>{formatPrice(x.productPrice)}</td><td>{formatPrice(x.productPrice*x.quantity)}</td></tr>)}</tbody></table></div></div>
    <div className="adminPanel"><h2>Payment transactions</h2>{order.paymentTransactions.length?<div className="compactList">{order.paymentTransactions.map((x:any)=><div key={x.id}><span><strong>{x.gateway||x.provider} · {x.providerTransactionId}</strong><small>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(x.receivedAt))} · {x.referenceCode||"no reference"}</small></span><span><b>{formatPrice(x.amount)}</b><small>{x.matched?"Matched":x.failureReason||"Unmatched"}</small></span></div>)}</div>:<p>Chưa có giao dịch thanh toán.</p>}</div>
  </section>;
}
