"use client";

import Link from "next/link";
import { ArrowRight, UserPlus } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/store-provider";

export default function RegisterPage() {
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

    setError("");
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");

    if (password !== confirm) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email"),
          password
        })
      });

      // Some server failures return an empty/non-JSON body. Do not let JSON
      // parsing throw outside the form's error handling.
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : "Không thể tạo tài khoản. Vui lòng thử lại."
        );
      }

      await refreshAccount(true);
      const next = nextParam || new URLSearchParams(window.location.search).get("next");
      router.push(next || "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo tài khoản. Vui lòng thử lại.");
    } finally {
      // Always restore the submit button, including network, API, JSON parse,
      // and account-refresh failures.
      setLoading(false);
    }
  }

  return (
    <section className="authPage registerLayout">
      <div className="authVisual">
        <div><p className="eyebrow">THAM GIA LSOUL</p><h1>Tủ đồ của bạn,<br />được ghi nhớ.</h1><p>Tạo tài khoản để đồng bộ sản phẩm yêu thích, giỏ hàng, địa chỉ và lịch sử mua sắm.</p></div>
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
          {error ? <div className="authError" role="alert">{error}</div> : null}
          <button className="btn block" type="submit" disabled={loading}>{loading ? "Đang tạo tài khoản..." : <>Tạo tài khoản <ArrowRight size={15} /></>}</button>
          <p className="authSwitch">Đã có tài khoản? <Link href={nextParam ? `/login?next=${encodeURIComponent(nextParam)}` : "/login"}>Đăng nhập</Link></p>
        </form>
      </div>
    </section>
  );
}
