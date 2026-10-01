"use client";

import Image from "next/image";
import Link from "next/link";
import { AddressBook, ArrowRight, LogOut, MapPin, Package, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-provider";
import type { CustomerAddress } from "@/lib/account";
import { formatPrice } from "@/lib/products";

type Tab = "overview" | "profile" | "addresses" | "orders";

export default function AccountPage() {
  const router = useRouter();
  const { user, addresses, orders, wishlist, cartCount, accountLoading, refreshAccount, logout } = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [addressForm, setAddressForm] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    if (!accountLoading && !user) router.replace("/login?next=/account");
  }, [accountLoading, user, router]);

  if (accountLoading || !user) {
    return <div className="accountLoading"><div className="skeletonLine title" /><div className="skeletonBlock detailSkeleton" /></div>;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.get("name"), phone: data.get("phone") })
    });
    setProfileMessage(response.ok ? "Thông tin đã được cập nhật." : "Không thể cập nhật thông tin.");
    if (response.ok) await refreshAccount(false);
  }

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: data.get("label"), recipientName: data.get("recipientName"), phone: data.get("phone"),
        address: data.get("address"), city: data.get("city"), isDefault: data.get("isDefault") === "on"
      })
    });
    if (response.ok) {
      setAddressForm(false);
      await refreshAccount(false);
    }
  }

  async function setDefault(address: CustomerAddress) {
    await fetch(`/api/account/addresses/${address.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true })
    });
    await refreshAccount(false);
  }

  async function removeAddress(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    await refreshAccount(false);
  }

  async function signOut() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="accountPage">
      <div className="accountHero">
        <div><p className="eyebrow">MY ÉLANE</p><h1>Xin chào, {user.name.split(" ").slice(-1)[0]}.</h1><p>{user.email}</p></div>
        <button className="btn ghost small" onClick={signOut}><LogOut size={15} /> Đăng xuất</button>
      </div>

      <div className="accountTabs">
        {([["overview","Tổng quan"],["profile","Hồ sơ"],["addresses","Địa chỉ"],["orders","Đơn hàng"]] as const).map(([value,label]) => <button className={tab === value ? "active" : ""} onClick={() => setTab(value)} key={value}>{label}</button>)}
        {user.role === "admin" ? <Link href="/admin">Quản trị <ArrowRight size={13} /></Link> : null}
      </div>

      {tab === "overview" ? <div className="accountOverview">
        <div className="accountStat"><Package size={20} /><span>Đơn hàng</span><strong>{orders.length}</strong><button onClick={() => setTab("orders")}>Xem lịch sử</button></div>
        <div className="accountStat"><AddressBook size={20} /><span>Địa chỉ đã lưu</span><strong>{addresses.length}</strong><button onClick={() => setTab("addresses")}>Quản lý</button></div>
        <div className="accountStat"><UserRound size={20} /><span>Wishlist</span><strong>{wishlist.length}</strong><Link href="/wishlist">Xem wishlist</Link></div>
        <div className="accountStat"><ShieldCheck size={20} /><span>Giỏ hàng</span><strong>{cartCount}</strong><Link href="/cart">Xem giỏ hàng</Link></div>
      </div> : null}

      {tab === "profile" ? <div className="accountPanel narrowPanel">
        <div className="accountPanelHead"><div><p className="eyebrow">PROFILE</p><h2>Thông tin cá nhân</h2></div></div>
        <form className="accountForm" onSubmit={saveProfile}>
          <label><span>Họ tên</span><input name="name" defaultValue={user.name} required /></label>
          <label><span>Email</span><input value={user.email} disabled /></label>
          <label><span>Số điện thoại</span><input name="phone" defaultValue={user.phone ?? ""} /></label>
          {profileMessage ? <p className="formSuccess">{profileMessage}</p> : null}
          <button className="btn" type="submit">Lưu thay đổi</button>
        </form>
      </div> : null}

      {tab === "addresses" ? <div className="accountPanel">
        <div className="accountPanelHead"><div><p className="eyebrow">DELIVERY ADDRESSES</p><h2>Sổ địa chỉ</h2></div><button className="btn small" onClick={() => setAddressForm((value) => !value)}><Plus size={14} /> Thêm địa chỉ</button></div>
        {addressForm ? <form className="addressForm" onSubmit={addAddress}>
          <label><span>Nhãn</span><input name="label" placeholder="Nhà / Công ty" /></label>
          <label><span>Người nhận</span><input name="recipientName" required defaultValue={user.name} /></label>
          <label><span>Số điện thoại</span><input name="phone" required defaultValue={user.phone ?? ""} /></label>
          <label><span>Tỉnh / Thành</span><input name="city" required /></label>
          <label className="full"><span>Địa chỉ</span><input name="address" required placeholder="Số nhà, đường, phường/xã..." /></label>
          <label className="addressCheck"><input type="checkbox" name="isDefault" /> Đặt làm địa chỉ mặc định</label>
          <button className="btn" type="submit">Lưu địa chỉ</button>
        </form> : null}
        <div className="addressGrid">{addresses.map((address) => <article className="addressCard" key={address.id}>
          <div className="addressTop"><MapPin size={18} /><strong>{address.label}</strong>{address.isDefault ? <span>Mặc định</span> : null}</div>
          <h3>{address.recipientName}</h3><p>{address.phone}</p><p>{address.address}, {address.city}</p>
          <div className="addressActions">{!address.isDefault ? <button onClick={() => setDefault(address)}>Đặt mặc định</button> : <span /> }<button onClick={() => removeAddress(address.id)}><Trash2 size={13} /> Xóa</button></div>
        </article>)}</div>
      </div> : null}

      {tab === "orders" ? <div className="accountPanel">
        <div className="accountPanelHead"><div><p className="eyebrow">ORDER HISTORY</p><h2>Đơn hàng của bạn</h2></div></div>
        {orders.length ? <div className="accountOrders">{orders.map((order) => <article key={order.id}>
          <div className="accountOrderHead"><div><strong>#{order.id}</strong><small>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium"}).format(new Date(order.createdAt))}</small></div><span>{order.status === "processing" ? "Đang xử lý" : order.status === "confirmed" ? "Đã xác nhận" : order.status === "shipping" ? "Đang giao" : order.status === "completed" ? "Hoàn tất" : "Đã hủy"}</span></div>
          <div className="accountOrderItems">{order.items.slice(0,4).map((line) => <div key={`${order.id}-${line.product.id}-${line.size}`} className="accountOrderItem"><div><Image src={line.product.image} alt={line.product.name} fill sizes="64px" /></div><span><strong>{line.product.name}</strong><small>Size {line.size ?? "-"} · SL {line.quantity}</small></span></div>)}</div>
          <div className="accountOrderFooter"><span>{order.items.reduce((sum,line)=>sum+line.quantity,0)} sản phẩm</span><strong>{formatPrice(order.total)}</strong></div>
        </article>)}</div> : <div className="accountEmpty"><Package size={28} /><h3>Chưa có đơn hàng</h3><Link className="btn secondary" href="/shop">Khám phá bộ sưu tập</Link></div>}
      </div> : null}
    </section>
  );
}
