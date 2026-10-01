"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BadgePercent, Check, EyeOff, Instagram, Plus, X } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

type CouponRow = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  active: boolean;
};

type SocialRow = {
  id: string;
  authorName: string;
  authorHandle: string;
  platform: string;
  caption: string;
  image: string;
  status: "pending" | "approved" | "rejected";
  likes: number;
  createdAt: string;
  products: { id: string; name: string }[];
};

export default function AdminMarketingPage() {
  const { user, accountLoading } = useStore();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [posts, setPosts] = useState<SocialRow[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const [couponResponse, socialResponse] = await Promise.all([
      fetch("/api/admin/coupons", { cache: "no-store" }),
      fetch("/api/admin/social", { cache: "no-store" })
    ]);
    if (couponResponse.ok) setCoupons((await couponResponse.json()).coupons);
    if (socialResponse.ok) setPosts((await socialResponse.json()).posts);
  }

  useEffect(() => { if (user?.role === "admin") void load(); }, [user]);

  async function createCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/coupons", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: data.get("code"), type: data.get("type"), value: Number(data.get("value")),
        minOrder: Number(data.get("minOrder")), maxDiscount: Number(data.get("maxDiscount")) || null,
        usageLimit: Number(data.get("usageLimit")) || null, active: true
      })
    });
    const result = await response.json();
    setMessage(response.ok ? "Coupon đã được lưu." : result.error ?? "Không thể lưu coupon.");
    if (response.ok) { (event.currentTarget as HTMLFormElement).reset(); await load(); }
  }

  async function toggleCoupon(coupon: CouponRow) {
    await fetch(`/api/admin/coupons/${coupon.code}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active })
    });
    await load();
  }

  async function moderate(id: string, status: SocialRow["status"]) {
    await fetch("/api/admin/social", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status })
    });
    await load();
  }

  if (accountLoading) return <div className="accountLoading"><div className="skeletonLine title" /><div className="skeletonBlock detailSkeleton" /></div>;
  if (!user || user.role !== "admin") return <section className="adminAccessDenied"><div><h1>Khu vực quản trị</h1><Link className="btn" href="/login?next=/admin/marketing">Đăng nhập quản trị</Link></div></section>;

  return <section className="adminPage adminConsole">
    <div className="adminHero"><div><p className="eyebrow">SOCIAL COMMERCE</p><h1>Social & ưu đãi.</h1></div><div className="adminHeroActions"><Link className="btn ghost small" href="/admin">← Tổng quan</Link><Link className="btn small" href="/social">Xem LSOUL Social</Link></div></div>
    {message ? <p className="socialMessage">{message}</p> : null}
    <div className="adminMarketingGrid">
      <div className="adminPanel">
        <div className="adminPanelHead"><div><p className="eyebrow">COUPONS</p><h2>Mã ưu đãi</h2></div><BadgePercent size={19} /></div>
        <form className="couponAdminForm" onSubmit={createCoupon}>
          <input name="code" required placeholder="SOCIAL20" />
          <select name="type"><option value="percentage">%</option><option value="fixed">VND</option></select>
          <input name="value" type="number" min="1" required placeholder="20" />
          <input name="minOrder" type="number" min="0" placeholder="Đơn tối thiểu" />
          <input name="maxDiscount" type="number" min="0" placeholder="Giảm tối đa" />
          <input name="usageLimit" type="number" min="0" placeholder="Lượt dùng" />
          <button className="btn small" type="submit"><Plus size={14} /> Lưu coupon</button>
        </form>
        <div className="couponAdminList">{coupons.map((coupon)=><div key={coupon.code}><span><strong>{coupon.code}</strong><small>{coupon.type === "percentage" ? `${coupon.value}%` : formatPrice(coupon.value)} · min {formatPrice(coupon.minOrder)} · đã dùng {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}</small></span><button className={coupon.active ? "active" : ""} onClick={()=>toggleCoupon(coupon)}>{coupon.active ? "Đang chạy" : "Đã tắt"}</button></div>)}</div>
      </div>

      <div className="adminPanel">
        <div className="adminPanelHead"><div><p className="eyebrow">UGC MODERATION</p><h2>Bài social</h2></div><Instagram size={19} /></div>
        <div className="socialModerationList">{posts.map((post)=><article key={post.id}><div className="socialModerationImage"><Image src={post.image} alt={post.caption} fill sizes="72px" /></div><div><strong>{post.authorName} <small>{post.authorHandle}</small></strong><p>{post.caption}</p><small>{post.platform} · {post.products.map((product)=>product.name).join(", ") || "Chưa tag sản phẩm"}</small></div><div className="socialModerationActions"><span className={`moderation-${post.status}`}>{post.status}</span>{post.status !== "approved" ? <button onClick={()=>moderate(post.id,"approved")} aria-label="Duyệt"><Check size={14}/></button> : null}{post.status !== "rejected" ? <button onClick={()=>moderate(post.id,"rejected")} aria-label="Từ chối"><X size={14}/></button> : null}{post.status !== "pending" ? <button onClick={()=>moderate(post.id,"pending")} aria-label="Chờ duyệt"><EyeOff size={14}/></button> : null}</div></article>)}</div>
      </div>
    </div>
  </section>;
}
