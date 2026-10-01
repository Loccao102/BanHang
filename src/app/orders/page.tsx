"use client";

import Image from "next/image";
import Link from "next/link";
import { PackageSearch, UserRound } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

const statusLabel = { processing: "Đang xử lý", confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã hủy" } as const;

export default function OrdersPage() {
  const { orders, user, accountLoading } = useStore();

  if (accountLoading) return <div className="accountLoading"><div className="skeletonLine title" /><div className="skeletonBlock detailSkeleton" /></div>;
  if (!user) return <div className="emptyState"><div><UserRound size={36} /><h2>Đăng nhập để xem đơn hàng</h2><p>Lịch sử mua sắm và trạng thái giao hàng được lưu theo tài khoản của bạn.</p><Link className="btn" href="/login?next=/orders">Đăng nhập</Link></div></div>;
  if (!orders.length) return <div className="emptyState"><div><PackageSearch size={36} /><h2>Chưa có đơn hàng</h2><p>Đơn hàng của bạn sẽ xuất hiện tại đây sau khi checkout.</p><Link className="btn" href="/shop">Mua sắm ngay</Link></div></div>;

  return <section className="ordersPage"><div className="ordersHeader"><p className="eyebrow">ORDER HISTORY</p><h1>Đơn hàng của bạn</h1><p style={{color:"var(--muted)"}}>Theo dõi trạng thái xử lý, phương thức thanh toán và thông tin từng đơn hàng.</p></div><div className="orderList">{orders.map((order) => <article className="orderCard" key={order.id}><div className="orderHead"><div><strong>#{order.id}</strong><small>{new Intl.DateTimeFormat("vi-VN", {dateStyle:"medium", timeStyle:"short"}).format(new Date(order.createdAt))}</small></div><span className={"orderStatus status-" + order.status}>{statusLabel[order.status]}</span></div><div className="orderBody"><div className="orderItems">{order.items.map((line) => <div className="orderItem" key={line.product.id + "-" + (line.size ?? "")}><div className="orderItemImage"><Image src={line.product.image} alt={line.product.name} fill sizes="48px" /></div><div><strong>{line.product.name}</strong><div style={{color:"var(--muted)"}}>Size {line.size ?? "-"} · SL {line.quantity}</div></div></div>)}</div><div className="orderTotal"><small style={{color:"var(--muted)"}}>Tổng thanh toán</small><strong>{formatPrice(order.total)}</strong><small style={{color:"var(--muted)"}}>{order.payment === "qr" ? "QR chuyển khoản" : "COD"} · {order.paymentStatus === "paid" ? "Đã thanh toán" : order.paymentStatus === "cod_pending" ? "Chờ thu COD" : order.paymentStatus === "refunded" ? "Đã hoàn tiền" : "Chờ xác nhận"}</small>{order.trackingCode ? <small style={{color:"var(--muted)"}}>{order.shippingCarrier ?? "Vận chuyển"} · {order.trackingCode}</small> : null}</div></div></article>)}</div></section>;
}
