"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  InstagramOutlined,
  PercentageOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined,
  TagsOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

type CouponRow = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

type SocialRow = {
  id: string;
  authorName: string;
  authorHandle: string;
  platform: string;
  caption: string;
  image: string;
  status: "pending" | "approved" | "rejected";
  likes: number;
  createdAt: string;
  products: { id: string; name: string }[];
};

export default function AdminMarketingPage() {
  const { user, accountLoading } = useStore();
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [posts, setPosts] = useState<SocialRow[]>([]);
  const [editing, setEditing] = useState<CouponRow | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const [couponResponse, socialResponse] = await Promise.all([
      fetch("/api/admin/coupons", { cache: "no-store" }),
      fetch("/api/admin/social", { cache: "no-store" })
    ]);
    if (couponResponse.ok) setCoupons((await couponResponse.json()).coupons);
    if (socialResponse.ok) setPosts((await socialResponse.json()).posts);
    setLoading(false);
  }

  useEffect(() => {
    if (user?.role === "admin") void load();
  }, [user]);

  async function saveCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const code = String(data.get("code") ?? "").toUpperCase();
    const payload = {
      code,
      type: data.get("type"),
      value: Number(data.get("value")),
      minOrder: Number(data.get("minOrder")),
      maxDiscount: Number(data.get("maxDiscount")) || null,
      usageLimit: Number(data.get("usageLimit")) || null,
      startsAt: data.get("startsAt") || null,
      endsAt: data.get("endsAt") || null,
      active: true
    };
    const response = await fetch(
      editing ? `/api/admin/coupons/${editing.code}` : "/api/admin/coupons",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );
    const result = await response.json();
    setMessage(
      response.ok ? "Coupon đã được lưu thành công." : result.error ?? "Không thể lưu coupon."
    );
    if (response.ok) {
      setEditing(null);
      form.reset();
      await load();
    }
  }

  async function toggleCoupon(coupon: CouponRow) {
    await fetch(`/api/admin/coupons/${coupon.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active })
    });
    await load();
  }

  async function removeCoupon(coupon: CouponRow) {
    if (!window.confirm(`Xác nhận xóa vĩnh viễn mã ${coupon.code}?`)) return;
    await fetch(`/api/admin/coupons/${coupon.code}`, { method: "DELETE" });
    await load();
  }

  async function moderate(id: string, status: "approved" | "rejected") {
    await fetch(`/api/admin/social/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await load();
  }

  if (accountLoading) {
    return (
      <div className="antLoadingState">
        <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
        <p>Đang tải dữ liệu Marketing & Social...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực Quản trị Bị Hạn chế</h2>
          <p>Yêu cầu tài khoản quản trị để truy cập chiến dịch tiếp thị.</p>
          <Link className="antBtn antBtnPrimary" href="/login?next=/admin/marketing">
            Đăng nhập Quản trị
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="antAdminPageContainer">
      {/* Ant Design Page Header */}
      <div className="antPageHeader">
        <div className="antPageHeaderLeft">
          <div className="antBreadcrumb">
            <Link href="/admin">Trang chủ</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <span>Hệ thống Quản trị</span>
            <span className="antBreadcrumbSeparator">/</span>
            <span className="antBreadcrumbCurrent">Marketing & Social UGC</span>
          </div>
          <h1 className="antPageTitle">Mã Giảm Giá & Duyệt Bài Social</h1>
          <p className="antPageSubtitle">
            Quản lý chiến dịch coupon khuyến mãi và phê duyệt bài đăng phong cách cộng đồng (User Generated Content).
          </p>
        </div>

        <div className="antPageHeaderRight">
          <div className="antHeaderActionGroup">
            <a
              href="http://localhost:3000/social"
              target="_blank"
              rel="noreferrer"
              className="antBtn antBtnDefault"
            >
              <InstagramOutlined /> Xem trang Social
            </a>
          </div>
        </div>
      </div>

      {message && (
        <div className="antAlertInfo" style={{ marginBottom: 20 }}>
          <CheckCircleOutlined style={{ color: "#1677ff", marginRight: 8 }} />
          <span>{message}</span>
        </div>
      )}

      {/* 2-Column Grid: Coupons & Social Moderation */}
      <div className="antTwoColGrid">
        {/* Panel 1: Mã giảm giá */}
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">CHIẾN DỊCH KHUYẾN MÃI</div>
              <h2 className="antCardTitle">
                {editing ? `Sửa mã: ${editing.code}` : "Tạo mã giảm giá mới"}
              </h2>
            </div>
            <TagsOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          </div>

          <div className="antCardBody">
            <form onSubmit={saveCoupon} className="antCouponForm">
              <div className="antFormGrid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <label className="antFormField">
                  <span className="antFormLabel">Mã voucher *</span>
                  <input
                    name="code"
                    required
                    defaultValue={editing?.code ?? ""}
                    disabled={Boolean(editing)}
                    placeholder="VD: LSOULVIP20"
                    className="antInput"
                    style={{ textTransform: "uppercase" }}
                  />
                </label>

                <label className="antFormField">
                  <span className="antFormLabel">Loại giảm</span>
                  <select
                    name="type"
                    defaultValue={editing?.type ?? "percentage"}
                    className="antInput"
                  >
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </label>

                <label className="antFormField">
                  <span className="antFormLabel">Giá trị giảm *</span>
                  <input
                    name="value"
                    type="number"
                    min="1"
                    required
                    defaultValue={editing?.value ?? 10}
                    className="antInput"
                  />
                </label>

                <label className="antFormField">
                  <span className="antFormLabel">Đơn tối thiểu</span>
                  <input
                    name="minOrder"
                    type="number"
                    min="0"
                    defaultValue={editing?.minOrder ?? 0}
                    className="antInput"
                  />
                </label>

                <label className="antFormField">
                  <span className="antFormLabel">Giảm tối đa (nếu có)</span>
                  <input
                    name="maxDiscount"
                    type="number"
                    min="0"
                    defaultValue={editing?.maxDiscount ?? ""}
                    placeholder="Không giới hạn"
                    className="antInput"
                  />
                </label>

                <label className="antFormField">
                  <span className="antFormLabel">Giới hạn số lượt dùng</span>
                  <input
                    name="usageLimit"
                    type="number"
                    min="1"
                    defaultValue={editing?.usageLimit ?? ""}
                    placeholder="Không giới hạn"
                    className="antInput"
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button type="submit" className="antBtn antBtnPrimary">
                  <SaveOutlined /> {editing ? "Cập nhật coupon" : "Tạo mã coupon"}
                </button>
                {editing && (
                  <button
                    type="button"
                    className="antBtn antBtnDefault"
                    onClick={() => setEditing(null)}
                  >
                    Hủy sửa
                  </button>
                )}
              </div>
            </form>

            <div style={{ marginTop: 24 }}>
              <div className="antSectionTitle">Danh sách mã khuyến mãi ({coupons.length})</div>
              <div className="antCouponList">
                {coupons.map((coupon) => (
                  <div key={coupon.code} className="antCouponItem">
                    <div className="antCouponMain">
                      <div className="antCouponCode">
                        <TagsOutlined style={{ marginRight: 6, color: "#1677ff" }} />
                        <strong>{coupon.code}</strong>
                        <span
                          className={`antTag ${
                            coupon.active ? "antTagSuccess" : "antTagDefault"
                          }`}
                          style={{ marginLeft: 8 }}
                        >
                          {coupon.active ? "Đang áp dụng" : "Đã tạm dừng"}
                        </span>
                      </div>
                      <small className="antCouponMeta">
                        {coupon.type === "percentage"
                          ? `Giảm ${coupon.value}% (Đơn từ ${formatPrice(coupon.minOrder)})`
                          : `Giảm ${formatPrice(coupon.value)} (Đơn từ ${formatPrice(coupon.minOrder)})`}
                        {" · "}Đã dùng {coupon.usedCount}
                        {coupon.usageLimit ? `/${coupon.usageLimit}` : ""} lượt
                      </small>
                    </div>

                    <div className="antCouponActions">
                      <button
                        type="button"
                        className="antActionBtn"
                        title={coupon.active ? "Tắt mã" : "Bật mã"}
                        onClick={() => toggleCoupon(coupon)}
                      >
                        {coupon.active ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      </button>
                      <button
                        type="button"
                        className="antActionBtn edit"
                        title="Chỉnh sửa"
                        onClick={() => setEditing(coupon)}
                      >
                        <EditOutlined />
                      </button>
                      <button
                        type="button"
                        className="antActionBtn delete"
                        title="Xóa mã"
                        onClick={() => removeCoupon(coupon)}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Duyệt bài Social */}
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">DUYỆT BÀI ĐĂNG CỘNG ĐỒNG</div>
              <h2 className="antCardTitle">Social Feed Moderation</h2>
            </div>
            <InstagramOutlined style={{ fontSize: 20, color: "#c13584" }} />
          </div>

          <div className="antCardBody">
            {posts.length ? (
              <div className="antSocialList">
                {posts.map((post) => (
                  <div key={post.id} className="antSocialItem">
                    <div className="antSocialThumb">
                      <Image
                        src={post.image}
                        alt={post.authorName}
                        fill
                        sizes="72px"
                      />
                    </div>
                    <div className="antSocialInfo">
                      <div className="antSocialAuthor">
                        <strong>{post.authorName}</strong>
                        <span className="antSocialHandle">{post.authorHandle}</span>
                        <span
                          className={`antTag ${
                            post.status === "approved"
                              ? "antTagSuccess"
                              : post.status === "rejected"
                              ? "antTagError"
                              : "antTagWarning"
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p className="antSocialCaption">{post.caption}</p>
                      <small className="antSocialMeta">
                        {post.likes} lượt thích · {post.products?.length || 0} sản phẩm gắn kèm
                      </small>
                    </div>
                    <div className="antSocialActions">
                      <button
                        type="button"
                        className="antBtn antBtnSuccess antBtnSm"
                        title="Duyệt hiển thị"
                        onClick={() => moderate(post.id, "approved")}
                      >
                        <CheckCircleOutlined /> Duyệt
                      </button>
                      <button
                        type="button"
                        className="antBtn antBtnDanger antBtnSm"
                        title="Từ chối"
                        onClick={() => moderate(post.id, "rejected")}
                      >
                        <CloseCircleOutlined /> Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="antEmptyState">
                <InstagramOutlined style={{ fontSize: 36, color: "#8c8c8c" }} />
                <p>Chưa có bài đăng cộng đồng cần kiểm duyệt.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
