"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BadgePercent, Check, EyeOff, Instagram, Pencil, Plus, Trash2, X } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

type CouponRow = {
  code: string; type: "percentage" | "fixed"; value: number; minOrder: number;
  maxDiscount?: number | null; usageLimit?: number | null; usedCount: number; active: boolean;
  startsAt?: string | null; endsAt?: string | null;
};
type SocialRow = {
  id: string; authorName: string; authorHandle: string; platform: string; caption: string; image: string;
  status: "pending" | "approved" | "rejected"; likes: number; createdAt: string; products: { id: string; name: string }[];
};

export default function AdminMarketingPage() {
  const { user, accountLoading } = useStore();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [posts, setPosts] = useState<SocialRow[]>([]);
  const [editing, setEditing] = useState<CouponRow | null>(null);
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

  async function saveCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const code = String(data.get("code") ?? "").toUpperCase();
    const payload = {
      code, type: data.get("type"), value: Number(data.get("value")),
      minOrder: Number(data.get("minOrder")), maxDiscount: Number(data.get("maxDiscount")) || null,
      usageLimit: Number(data.get("usageLimit")) || null,
      startsAt: data.get("startsAt") || null, endsAt: data.get("endsAt") || null, active: true
    };
    const response = await fetch(editing ? `/api/admin/coupons/${editing.code}` : "/api/admin/coupons", {
      method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const result = await response.json();
    setMessage(response.ok ? "Coupon đã được lưu." : result.error ?? "Không thể lưu coupon.");
    if (response.ok) { setEditing(null); (event.currentTarget as HTMLFormElement).reset(); await load(); }
  }

  async function toggleCoupon(coupon: CouponRow) {
    await fetch(`/api/admin/coupons/${coupon.code}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !coupon.active }) });
    await load();
  }
  async function removeCoupon(coupon: CouponRow) {
    if (!window.confirm(`Xóa/tắt mã ${coupon.code}?`)) return;
    await fetch(`/api/admin/coupons/${coupon.code}`, { method: "DELETE" });
    if (editing?.code === coupon.code) setEditing(null);
    await load();
  }
  async function moderate(id: string, status: SocialRow["status"]) {
    await fetch("/api/admin/social", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    await load();
  }

  if (accountLoading) return <div className="accountLoading"><div className="skeletonLine title" /><div className="skeletonBlock detailSkeleton" /></div>;
  if (!user || user.role !== "admin") return <section className="adminAccessDenied"><div><h1>Khu vực quản trị</h1><Link className="btn" href="/login?next=/admin/marketing">Đăng nhập quản trị</Link></div></section>;

  const d = (value?: string | null) => value ? value.slice(0, 10) : "";

  return <section className="adminPage adminConsole">
    <div className="adminHero"><div><p className="eyebrow">MARKETING</p><h1>Social & ưu đãi.</h1></div><div className="adminHeroActions"><Link className="btn ghost small" href="/admin">← Tổng quan</Link><Link className="btn small" href="/social">Xem LSOUL Social</Link></div></div>
    {message ? <p className="socialMessage">{message}</p> : null}
    <div className="adminMarketingGrid">
      <div className="adminPanel">
        <div className="adminPanelHead"><div><p className="eyebrow">COUPONS</p><h2>{editing ? `Sửa ${editing.code}` : "Mã ưu đãi"}</h2></div><BadgePercent size={19} /></div>
        <form className="couponAdminForm" onSubmit={saveCoupon} key={editing?.code ?? "new"}>
          <input name="code" required placeholder="SOCIAL20" defaultValue={editing?.code ?? ""} disabled={Boolean(editing)} />
          <select name="type" defaultValue={editing?.type ?? "percentage"}><option value="percentage">%</option><option value="fixed">VND</option></select>
          <input name="value" type="number" min="1" required placeholder="20" defaultValue={editing?.value ?? ""} />
          <input name="minOrder" type="number" min="0" placeholder="Đơn tối thiểu" defaultValue={editing?.minOrder ?? ""} />
          <input name="maxDiscount" type="number" min="0" placeholder="Giảm tối đa" defaultValue={editing?.maxDiscount ?? ""} />
          <input name="usageLimit" type="number" min="0" placeholder="Lượt dùng" defaultValue={editing?.usageLimit ?? ""} />
          <input name="startsAt" type="date" defaultValue={d(editing?.startsAt)} title="Ngày bắt đầu" />
          <input name="endsAt" type="date" defaultValue={d(editing?.endsAt)} title="Ngày kết thúc" />
          <button className="btn small" type="submit"><Plus size={14} /> {editing ? "Cập nhật" : "Lưu coupon"}</button>
          {editing ? <button className="btn ghost small" type="button" onClick={()=>setEditing(null)}>Hủy sửa</button> : null}
        </form>
        <div className="couponAdminList">{coupons.map((coupon)=><div key={coupon.code}><span><strong>{coupon.code}</strong><small>{coupon.type === "percentage" ? `${coupon.value}%` : formatPrice(coupon.value)} · min {formatPrice(coupon.minOrder)} · đã dùng {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}{coupon.startsAt || coupon.endsAt ? ` · ${d(coupon.startsAt) || "…"} → ${d(coupon.endsAt) || "…"}` : ""}</small></span><div className="rowActions"><button aria-label="Sửa" onClick={()=>setEditing(coupon)}><Pencil size={14}/></button><button className={coupon.active ? "active" : ""} onClick={()=>toggleCoupon(coupon)}>{coupon.active ? "Đang chạy" : "Đã tắt"}</button><button aria-label="Xóa" onClick={()=>removeCoupon(coupon)}><Trash2 size={14}/></button></div></div>)}</div>
      </div>

      <div className="adminPanel">
        <div className="adminPanelHead"><div><p className="eyebrow">UGC MODERATION</p><h2>Bài social</h2></div><Instagram size={19} /></div>
        <div className="socialModerationList">{posts.map((post)=><article key={post.id}><div className="socialModerationImage"><Image src={post.image} alt={post.caption} fill sizes="72px" /></div><div><strong>{post.authorName} <small>{post.authorHandle}</small></strong><p>{post.caption}</p><small>{post.platform} · {post.products.map((product)=>product.name).join(", ") || "Chưa tag sản phẩm"}</small></div><div className="socialModerationActions"><span className={`moderation-${post.status}`}>{post.status}</span>{post.status !== "approved" ? <button onClick={()=>moderate(post.id,"approved")}><Check size={14}/></button> : null}{post.status !== "rejected" ? <button onClick={()=>moderate(post.id,"rejected")}><X size={14}/></button> : null}{post.status !== "pending" ? <button onClick={()=>moderate(post.id,"pending")}><EyeOff size={14}/></button> : null}</div></article>)}</div>
      </div>
    </div>
  </section>;
}
