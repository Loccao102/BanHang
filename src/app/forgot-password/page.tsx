"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email") })
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(result.error ?? "Không thể tạo yêu cầu.");
      return;
    }
    setMessage("Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được tạo và có hiệu lực trong 30 phút.");
    if (result.resetUrl) setResetUrl(result.resetUrl);
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
          {message ? <div className="authNotice">{message}</div> : null}
          {resetUrl ? <Link className="authResetPreview" href={resetUrl}>Mở liên kết đặt lại mật khẩu (môi trường demo)</Link> : null}
          <button className="btn block" type="submit" disabled={loading}>{loading ? "Đang xử lý..." : "Tạo liên kết đặt lại"}</button>
          <p className="authSwitch"><Link href="/login"><ArrowLeft size={13} /> Quay lại đăng nhập</Link></p>
        </form>
      </div>
    </section>
  );
}
