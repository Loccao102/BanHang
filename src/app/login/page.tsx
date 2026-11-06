"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-provider";

export default function LoginPage() {
  const router = useRouter();
  const { refreshAccount } = useStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextParam, setNextParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setNextParam(new URLSearchParams(window.location.search).get("next"));
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), password: data.get("password") })
      });

      // Handle empty/non-JSON error responses without leaving the form stuck.
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : "Không thể đăng nhập. Vui lòng thử lại."
        );
      }

      await refreshAccount(true);
      const next = nextParam || new URLSearchParams(window.location.search).get("next");
      router.push(next || "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.");
    } finally {
      // Restore the button for HTTP errors, network errors, and refresh errors.
      setLoading(false);
    }
  }

  return (
    <section className="authPage">
      <div className="authVisual">
        <div><p className="eyebrow">TÀI KHOẢN LSOUL</p><h1>Chào mừng bạn trở lại.</h1><p>Lưu giỏ hàng, sản phẩm yêu thích, địa chỉ giao nhận và theo dõi đơn hàng trong cùng một tài khoản.</p></div>
      </div>
      <div className="authPanel">
        <form className="authForm" onSubmit={submit}>
          <div className="authIcon"><LockKeyhole size={19} /></div>
          <p className="eyebrow">ĐĂNG NHẬP</p>
          <h2>Tài khoản của bạn</h2>
          <label><span>Email</span><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
          <label><span>Mật khẩu</span><input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></label>
          <div className="authForgot"><Link href="/forgot-password">Quên mật khẩu?</Link></div>
          {error ? <div className="authError" role="alert">{error}</div> : null}
          <button className="btn block" type="submit" disabled={loading}>{loading ? "Đang đăng nhập..." : <>Đăng nhập <ArrowRight size={15} /></>}</button>
          <p className="authSwitch">Chưa có tài khoản? <Link href={nextParam ? `/register?next=${encodeURIComponent(nextParam)}` : "/register"}>Tạo tài khoản</Link></p>
        </form>
      </div>
    </section>
  );
}
