"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-provider";

export default function LoginPage() {
  const router = useRouter();
  const { refreshAccount } = useStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") })
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Không thể đăng nhập.");
      setLoading(false);
      return;
    }

    await refreshAccount(true);
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next || "/account");
    router.refresh();
  }

  return (
    <section className="authPage">
      <div className="authVisual">
        <div><p className="eyebrow">ÉLANE ACCOUNT</p><h1>Welcome back.</h1><p>Lưu giỏ hàng, wishlist, địa chỉ giao nhận và theo dõi toàn bộ đơn hàng ở một nơi.</p></div>
      </div>
      <div className="authPanel">
        <form className="authForm" onSubmit={submit}>
          <div className="authIcon"><LockKeyhole size={19} /></div>
          <p className="eyebrow">ĐĂNG NHẬP</p>
          <h2>Tài khoản của bạn</h2>
          <label><span>Email</span><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label><span>Mật khẩu</span><input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></label>
          {error ? <div className="authError">{error}</div> : null}
          <button className="btn block" type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : <>Đăng nhập <ArrowRight size={15} /></>}</button>
          <p className="authSwitch">Chưa có tài khoản? <Link href="/register">Tạo tài khoản</Link></p>
        </form>
      </div>
    </section>
  );
}
