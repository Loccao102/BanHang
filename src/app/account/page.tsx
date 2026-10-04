"use client";

import Image from "next/image";
import Link from "next/link";
import { Home, ArrowRight, LogOut, MapPin, Package, Pencil, Plus, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-provider";
import type { CustomerAddress } from "@/lib/account";
import { formatPrice } from "@/lib/products";
import { OrderTracker } from "@/components/order-tracker";

type Tab = "overview" | "profile" | "addresses" | "orders";

export default function AccountPage() {
  const router = useRouter();
  const { user, addresses, orders, wishlist, cartCount, accountLoading, refreshAccount, logout } = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [addressForm, setAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

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

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Mật khẩu nhập lại chưa khớp.");
      return;
    }
    const response = await fetch("/api/account/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const result = await response.json();
    setPasswordMessage(response.ok ? "Mật khẩu đã được cập nhật." : result.error ?? "Không thể đổi mật khẩu.");
    if (response.ok) form.reset();
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      label: data.get("label"), recipientName: data.get("recipientName"), phone: data.get("phone"),
      address: data.get("address"), city: data.get("city"), isDefault: data.get("isDefault") === "on"
    };
    const response = await fetch(editingAddress ? `/api/account/addresses/${editingAddress.id}` : "/api/account/addresses", {
      method: editingAddress ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      setAddressForm(false);
      setEditingAddress(null);
      await refreshAccount(false);
    }
  }

  function startEditAddress(address: CustomerAddress) {
    setEditingAddress(address);
    setAddressForm(true);
  }

  function closeAddressForm() {
    setAddressForm(false);
    setEditingAddress(null);
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
        <div><p className="eyebrow">TÀI KHOẢN LSOUL</p><h1>Xin chào, {user.name.split(" ").slice(-1)[0]}.</h1><p>{user.email}</p></div>
        <button className="btn ghost small" onClick={signOut}><LogOut size={15} /> Đăng xuất</button>
      </div>

      <div className="accountTabs">
        {([["overview","Tổng quan"],["profile","Hồ sơ"],["addresses","Địa chỉ"],["orders","Đơn hàng"]] as const).map(([value,label]) => <button className={tab === value ? "active" : ""} onClick={() => setTab(value)} key={value}>{label}</button>)}
        {user.role === "admin" ? (
          <a
            href={process.env.NEXT_PUBLIC_ADMIN_URL ? `${process.env.NEXT_PUBLIC_ADMIN_URL}/admin` : "http://localhost:3001/admin"}
            target="_blank"
            rel="noreferrer"
            className="adminPortalLink"
          >
            Quản trị (Port 3001) <ArrowRight size={13} />
          </a>
        ) : null}
      </div>

      {tab === "overview" ? <div className="accountOverview">
        <div className="accountStat"><Package size={20} /><span>Đơn hàng</span><strong>{orders.length}</strong><button onClick={() => setTab("orders")}>Xem lịch sử</button></div>
        <div className="accountStat"><Home size={20} /><span>Địa chỉ đã lưu</span><strong>{addresses.length}</strong><button onClick={() => setTab("addresses")}>Quản lý</button></div>
        <div className="accountStat"><UserRound size={20} /><span>Yêu thích</span><strong>{wishlist.length}</strong><Link href="/wishlist">Xem yêu thích</Link></div>
        <div className="accountStat"><ShieldCheck size={20} /><span>Giỏ hàng</span><strong>{cartCount}</strong><Link href="/cart">Xem giỏ hàng</Link></div>
      </div> : null}

      {tab === "profile" ? <div className="accountPanel narrowPanel">
        <div className="accountPanelHead"><div><p className="eyebrow">HỒ SƠ</p><h2>Thông tin cá nhân</h2></div></div>
        <form className="accountForm" onSubmit={saveProfile}>
          <label><span>Họ tên</span><input name="name" defaultValue={user.name} required /></label>
          <label><span>Email</span><input value={user.email} disabled /></label>
          <label><span>Số điện thoại</span><input name="phone" defaultValue={user.phone ?? ""} /></label>
          {profileMessage ? <p className="formSuccess">{profileMessage}</p> : null}
          <button className="btn" type="submit">Lưu thay đổi</button>
        </form>
        <div className="accountDivider" />
        <form className="accountForm" onSubmit={changePassword}>
          <p className="eyebrow">BẢO MẬT</p>
          <h3>Đổi mật khẩu</h3>
          <label><span>Mật khẩu hiện tại</span><input name="currentPassword" type="password" required autoComplete="current-password" /></label>
          <label><span>Mật khẩu mới</span><input name="newPassword" type="password" minLength={8} required autoComplete="new-password" /></label>
          <label><span>Nhập lại mật khẩu mới</span><input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" /></label>
          {passwordMessage ? <p className="formSuccess">{passwordMessage}</p> : null}
          <button className="btn secondary" type="submit">Đổi mật khẩu</button>
        </form>
      </div> : null}

      {tab === "addresses" ? <div className="accountPanel">
        <div className="accountPanelHead"><div><p className="eyebrow">ĐỊA CHỈ GIAO HÀNG</p><h2>Sổ địa chỉ</h2></div><button className="btn small" onClick={() => { setEditingAddress(null); setAddressForm(true); }}><Plus size={14} /> Thêm địa chỉ</button></div>
        {addressForm ? <form className="addressForm" onSubmit={saveAddress}>
          <div className="addressFormTitle"><strong>{editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</strong><button type="button" onClick={closeAddressForm} aria-label="Đóng"><X size={16} /></button></div>
          <label><span>Nhãn</span><input name="label" defaultValue={editingAddress?.label ?? ""} placeholder="Nhà / Công ty" /></label>
          <label><span>Người nhận</span><input name="recipientName" required defaultValue={editingAddress?.recipientName ?? user.name} /></label>
          <label><span>Số điện thoại</span><input name="phone" required defaultValue={editingAddress?.phone ?? user.phone ?? ""} /></label>
          <label><span>Tỉnh / Thành</span><input name="city" required defaultValue={editingAddress?.city ?? ""} /></label>
          <label className="full"><span>Địa chỉ</span><input name="address" required defaultValue={editingAddress?.address ?? ""} placeholder="Số nhà, đường, phường/xã..." /></label>
          <label className="addressCheck"><input type="checkbox" name="isDefault" defaultChecked={editingAddress?.isDefault ?? false} /> Đặt làm địa chỉ mặc định</label>
          <button className="btn" type="submit">{editingAddress ? "Cập nhật địa chỉ" : "Lưu địa chỉ"}</button>
        </form> : null}
        <div className="addressGrid">{addresses.map((address) => <article className="addressCard" key={address.id}>
          <div className="addressTop"><MapPin size={18} /><strong>{address.label}</strong>{address.isDefault ? <span>Mặc định</span> : null}</div>
          <h3>{address.recipientName}</h3><p>{address.phone}</p><p>{address.address}, {address.city}</p>
          <div className="addressActions"><div>{!address.isDefault ? <button onClick={() => setDefault(address)}>Đặt mặc định</button> : <span />}</div><div><button onClick={() => startEditAddress(address)}><Pencil size={13} /> Sửa</button><button onClick={() => removeAddress(address.id)}><Trash2 size={13} /> Xóa</button></div></div>
        </article>)}</div>
      </div> : null}

      {tab === "orders" ? <div className="accountPanel">
        <div className="accountPanelHead"><div><p className="eyebrow">TIẾN ĐỘ & LỊCH SỬ</p><h2>Đơn hàng của bạn</h2></div></div>
        {orders.length ? <div className="accountOrders" style={{ display: "grid", gap: 16 }}>{orders.map((order) => (
          <OrderTracker key={order.id} order={order} showItems={true} />
        ))}</div> : <div className="accountEmpty"><Package size={28} /><h3>Chưa có đơn hàng</h3><Link className="btn secondary" href="/shop">Khám phá bộ sưu tập</Link></div>}
      </div> : null}
    </section>
  );
}
