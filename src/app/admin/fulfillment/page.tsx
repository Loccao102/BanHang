"use client";

import Link from "next/link";
import { PackageCheck, Truck } from "lucide-react";
import { useStore } from "@/components/store-provider";
import type { OrderStatus, PaymentStatus } from "@/lib/cart";
import { formatPrice } from "@/lib/products";

const statuses: { value: OrderStatus; label: string }[] = [
  { value:"processing", label:"Đang xử lý" },{ value:"confirmed", label:"Đã xác nhận" },
  { value:"shipping", label:"Đang giao" },{ value:"completed", label:"Hoàn tất" },{ value:"cancelled", label:"Đã hủy" }
];
const payments: { value: PaymentStatus; label: string }[] = [
  { value:"pending", label:"Chờ thanh toán" },{ value:"paid", label:"Đã thanh toán" },
  { value:"cod_pending", label:"COD chờ thu" },{ value:"failed", label:"Thanh toán lỗi" },{ value:"refunded", label:"Đã hoàn tiền" }
];

export default function FulfillmentPage() {
  const { user, accountLoading, orders, updateOrderStatus } = useStore();

  if (accountLoading) return <div className="accountLoading"><div className="skeletonLine title" /><div className="skeletonBlock detailSkeleton" /></div>;
  if (!user || user.role !== "admin") return <section className="adminAccessDenied"><div><h1>Khu vực quản trị</h1><Link className="btn" href="/login?next=/admin/fulfillment">Đăng nhập quản trị</Link></div></section>;

  return <section className="adminPage adminConsole">
    <div className="adminHero"><div><p className="eyebrow">FULFILLMENT</p><h1>Thanh toán & giao hàng.</h1></div><div className="adminHeroActions"><Link className="btn ghost small" href="/admin">← Tổng quan</Link></div></div>
    <div className="adminPanel">
      <div className="adminPanelHead"><div><p className="eyebrow">ORDER OPERATIONS</p><h2>{orders.length} đơn hàng</h2></div><Truck size={19}/></div>
      <div className="fulfillmentList">{orders.map((order)=><article key={order.id}>
        <div><strong><Link href={`/admin/orders/${order.id}`}>#{order.id}</Link></strong><small>{order.customer.name} · {order.customer.phone}</small><small>{formatPrice(order.total)}</small></div>
        <label><span>Trạng thái</span><select value={order.status} onChange={(event)=>updateOrderStatus(order.id,event.target.value as OrderStatus)}>{statuses.map((item)=><option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label><span>Thanh toán</span><select value={order.paymentStatus ?? (order.payment === "cod" ? "cod_pending" : "pending")} onChange={(event)=>updateOrderStatus(order.id,order.status,{paymentStatus:event.target.value as PaymentStatus})}>{payments.map((item)=><option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
        <label><span>Đơn vị VC</span><input defaultValue={order.shippingCarrier ?? ""} placeholder="GHN / GHTK..." onBlur={(event)=>updateOrderStatus(order.id,order.status,{shippingCarrier:event.target.value,trackingCode:order.trackingCode})}/></label>
        <label><span>Mã vận đơn</span><input defaultValue={order.trackingCode ?? ""} placeholder="Tracking code" onBlur={(event)=>updateOrderStatus(order.id,order.status,{shippingCarrier:order.shippingCarrier,trackingCode:event.target.value})}/></label>
        <div className="fulfillmentFlag"><PackageCheck size={15}/><span>{order.items.reduce((sum,line)=>sum+line.quantity,0)} sản phẩm</span></div>
      </article>)}</div>
    </div>
  </section>;
}
