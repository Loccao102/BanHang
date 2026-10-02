"use client";

import { Suspense } from "react";
import { KeyRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/components/store-provider";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAccount } = useStore();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirmPassword") ?? "");

    if (password !== confirm) {
      setMessage("Mật khẩu nhập lại chưa khớp.");
      return;
    }

    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: searchParams.get("token"), password })
    });

    const result = await response.json();

    if (!response.ok) {
      setLoading(false);
      setMessage(result.error ?? "Không thể đặt lại mật khẩu.");
      return;
    }

    await refreshAccount(false);
    router.replace("/account");
    router.refresh();
  }

  return (
    <section className="authPage">
      <div className="authVisual">
        <div>
          <p className="eyebrow">BẢO MẬT TÀI KHOẢN</p>
          <h1>Đặt mật khẩu<br />mới.</h1>
          <p>Liên kết chỉ có thể sử dụng một lần và tự hết hạn.</p>
        </div>
      </div>
      <div className="authPanel">
        <form className="authForm" onSubmit={submit}>
          <div className="authIcon"><KeyRound size={19} /></div>
          <p className="eyebrow">ĐẶT LẠI MẬT KHẨU</p>
          <h2>Mật khẩu mới</h2>
          <label>
            <span>Mật khẩu mới</span>
            <input name="password" type="password" minLength={8} required autoComplete="new-password" />
          </label>
          <label>
            <span>Nhập lại mật khẩu</span>
            <input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" />
          </label>
          {message ? <div className="authError">{message}</div> : null}
          <button className="btn block" type="submit" disabled={loading}>
            {loading ? "Đang cập nhật..." : "Đặt mật khẩu mới"}
          </button>
        </form>
      </div>
    </section>
  );
}

function ResetPasswordFallback() {
  return (
    <section className="authPage">
      <div className="authVisual">
        <div>
          <p className="eyebrow">BẢO MẬT TÀI KHOẢN</p>
          <h1>Đặt mật khẩu<br />mới.</h1>
          <p>Đang chuẩn bị biểu mẫu đặt lại mật khẩu.</p>
        </div>
      </div>
      <div className="authPanel">
        <div className="authForm">
          <div className="authIcon"><KeyRound size={19} /></div>
          <p className="eyebrow">ĐẶT LẠI MẬT KHẨU</p>
          <h2>Đang tải...</h2>
        </div>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
