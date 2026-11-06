"use client";

import Link from "next/link";
import { ArrowLeft, Check, Copy, ExternalLink, Mail } from "lucide-react";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage("");
    setSuccess(false);
    setResetUrl("");

    try {
      const data = new FormData(event.currentTarget);
      const email = String(data.get("email") ?? "").trim();
      setRecipientEmail(email);

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof result?.error === "string" ? result.error : "Không thể gửi yêu cầu. Vui lòng thử lại.");
        return;
      }

      setSuccess(true);
      if (result?.resetUrl) {
        setResetUrl(result.resetUrl);
        setRecipientName(result.recipientName || "");
        setMessage("Hệ thống Hộp thư nội bộ LSOUL đã tạo thư khôi phục mật khẩu ngay bên dưới (hiệu lực 30 phút).");
      } else {
        setMessage("Nếu email tồn tại trong hệ thống, LSOUL đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư và thư mục Spam.");
      }
    } catch {
      setMessage("Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!resetUrl) return;
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="authPage">
      <div className="authVisual">
        <div>
          <p className="eyebrow">TÀI KHOẢN LSOUL</p>
          <h1>Khôi phục<br />tài khoản.</h1>
          <p>Tạo liên kết đặt lại mật khẩu an toàn, có thời hạn sử dụng.</p>
        </div>
      </div>
      <div className="authPanel">
        <form className="authForm" onSubmit={submit}>
          <div className="authIcon"><Mail size={19} /></div>
          <p className="eyebrow">QUÊN MẬT KHẨU</p>
          <h2>Nhập email của bạn</h2>
          <label>
            <span>Email</span>
            <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
          </label>
          {message ? <div className={success ? "authNotice" : "authError"} role="status">{message}</div> : null}

          {resetUrl ? (
            <div
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: 12,
                padding: 16,
                background: "#fafafa",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 13
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eaeaea", paddingBottom: 8 }}>
                <strong>Hộp thư bảo mật LSOUL</strong>
                <span style={{ fontSize: 11, color: "#666" }}>Hiệu lực 30 phút</span>
              </div>
              <p style={{ margin: 0, color: "#333", lineHeight: 1.5 }}>
                Xin chào <strong>{recipientName || recipientEmail}</strong>, nhấn vào nút bên dưới để đặt mật khẩu mới cho tài khoản của bạn:
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link
                  href={resetUrl}
                  className="btn"
                  style={{ flex: 1, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  Đặt lại mật khẩu ngay <ExternalLink size={14} />
                </Link>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => void copyLink()}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  {copied ? <><Check size={14} /> Đã chép</> : <><Copy size={14} /> Sao chép link</>}
                </button>
              </div>
            </div>
          ) : null}

          <button className="btn block" type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Gửi liên kết đặt lại"}
          </button>
          <p className="authSwitch">
            <Link href="/login"><ArrowLeft size={13} /> Quay lại đăng nhập</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
