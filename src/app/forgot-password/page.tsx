"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    setSuccess(false);

    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof result?.error === "string" ? result.error : "Không thể gửi yêu cầu. Vui lòng thử lại.");
        return;
      }
      setSuccess(true);
      setMessage("Nếu email tồn tại trong hệ thống, LSOUL đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư và thư mục Spam.");
    } catch {
      setMessage("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="authPage">
      <div className="authVisual">
        <div><p className="eyebrow">TÀI KHOẢN LSOUL</p><h1>Khôi phục<br />tài khoản.</h1><p>Tạo liên kết đặt lại mật khẩu an toàn, có thời hạn sử dụng.</p></div>
      </div>
      <div className="authPanel">
        <form className="authForm" onSubmit={submit}>
          <div className="authIcon"><Mail size={19} /></div>
          <p className="eyebrow">QUÊN MẬT KHẨU</p>
          <h2>Nhập email của bạn</h2>
          <label><span>Email</span><input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          {message ? <div className={success ? "authNotice" : "authError"} role="status">{message}</div> : null}
          <button className="btn block" type="submit" disabled={loading}>{loading ? "Đang gửi email..." : "Gửi liên kết đặt lại"}</button>
          <p className="authSwitch"><Link href="/login"><ArrowLeft size={13} /> Quay lại đăng nhập</Link></p>
        </form>
      </div>
    </section>
  );
}
