"use client";

import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshAccount } = useStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");

    if (password !== confirm) {
      setError("Mật khẩu nhập lại chưa khớp.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.get("name"), phone: data.get("phone"), email: data.get("email"), password })
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Không thể tạo tài khoản.");
      setLoading(false);
      return;
    }

    await refreshAccount(true);
    router.push("/account");
    router.refresh();
  }

  return (
    <section className="authPage registerLayout">
      <div className="authVisual">
        <div><p className="eyebrow">JOIN LSOUL</p><h1>Your wardrobe,<br />remembered.</h1><p>Tạo tài khoản để đồng bộ wishlist, giỏ hàng, địa chỉ và lịch sử mua sắm.</p></div>
      </div>
      <div className="authPanel">
        <form className="authForm" onSubmit={submit}>
          <div className="authIcon"><UserPlus size={19} /></div>
          <p className="eyebrow">TẠO TÀI KHOẢN</p>
          <h2>Bắt đầu với LSOUL</h2>
          <div className="authGrid">
            <label><span>Họ tên</span><input name="name" required autoComplete="name" placeholder="Nguyễn Văn A" /></label>
            <label><span>Số điện thoại</span><input name="phone" autoComplete="tel" placeholder="09xxxxxxxx" /></label>
          </div>
          <label><span>Email</span><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label><span>Mật khẩu</span><input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Ít nhất 8 ký tự" /></label>
          <label><span>Nhập lại mật khẩu</span><input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} placeholder="Nhập lại mật khẩu" /></label>
          {error ? <div className="authError">{error}</div> : null}
          <button className="btn block" type="submit" disabled={loading}>{loading ? "Đang tạo tài khoản..." : <>Tạo tài khoản <ArrowRight size={15} /></>}</button>
          <p className="authSwitch">Đã có tài khoản? <Link href="/login">Đăng nhập</Link></p>
        </form>
      </div>
    </section>
  );
}
