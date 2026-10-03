"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeftOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  ExperimentOutlined,
  HeartOutlined,
  RobotOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TagOutlined,
  ThunderboltOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

type Data = { customer: any };

export default function CustomerDetailPage() {
  const { user, accountLoading } = useStore();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    if (user?.role === "admin" && params.id) {
      void fetch(`/api/admin/customers/${params.id}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then(setData);
    }
  }, [user, params.id]);

  if (accountLoading || (user?.role === "admin" && !data)) {
    return (
      <div className="antLoadingState">
        <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
        <p>Đang tải hồ sơ khách hàng 360...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực Quản trị Bị Hạn chế</h2>
          <p>Yêu cầu tài khoản quản trị để xem chi tiết khách hàng.</p>
          <Link className="antBtn antBtnPrimary" href="/login?next=/admin/customers">
            Đăng nhập Quản trị
          </Link>
        </div>
      </section>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="antAdminPageContainer">
        <div className="antCard">
          <div className="antEmptyState">
            <UserOutlined style={{ fontSize: 44, color: "#8c8c8c" }} />
            <h3>Không tìm thấy khách hàng</h3>
            <p>Khách hàng có thể đã bị xóa hoặc liên kết không hợp lệ.</p>
            <Link className="antBtn antBtnPrimary" href="/admin/customers">
              Quay lại danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const c = data.customer;
  const avg = c.assessments?.length
    ? Math.round(
        c.assessments.reduce((s: number, x: any) => s + x.overallScore, 0) /
          c.assessments.length
      )
    : 0;

  return (
    <div className="antAdminPageContainer">
      {/* Ant Design Page Header */}
      <div className="antPageHeader">
        <div className="antPageHeaderLeft">
          <div className="antBreadcrumb">
            <Link href="/admin">Trang chủ</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <Link href="/admin/customers">Khách hàng CRM</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <span className="antBreadcrumbCurrent">Hồ sơ 360 · {c.name}</span>
          </div>
          <h1 className="antPageTitle">{c.name}</h1>
          <p className="antPageSubtitle">
            {c.email} · {c.phone || "Chưa đăng ký số điện thoại"} · ID: {c.id}
          </p>
        </div>

        <div className="antPageHeaderRight">
          <Link className="antBtn antBtnDefault" href="/admin/customers">
            <ArrowLeftOutlined /> Quay lại danh sách CRM
          </Link>
        </div>
      </div>

      {/* Ant Design Stat Cards Grid */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">LIFETIME VALUE (LTV)</span>
            <div className="antStatIconWrap green">
              <DollarCircleOutlined />
            </div>
          </div>
          <div className="antStatValue greenText">
            {formatPrice(c.lifetimeValue)}
          </div>
          <div className="antStatFooter">
            <span className="antTag antTagSuccess">Doanh thu tích lũy</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">TỔNG ĐƠN HÀNG</span>
            <div className="antStatIconWrap blue">
              <ShoppingOutlined />
            </div>
          </div>
          <div className="antStatValue">{c.orders.length}</div>
          <div className="antStatFooter">
            <span className="antTag antTagInfo">Đơn đặt thành công</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">SỐ LẦN THỬ ĐỒ AI</span>
            <div className="antStatIconWrap cyan">
              <ExperimentOutlined />
            </div>
          </div>
          <div className="antStatValue">{c.tryOns.length}</div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">Virtual Try-On</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">STYLIST ĐIỂM TRUNG BÌNH</span>
            <div className="antStatIconWrap purple">
              <RobotOutlined />
            </div>
          </div>
          <div className="antStatValue">{avg ? `${avg}/100` : "—"}</div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">Mức độ hợp gu</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Style Profile & Top Affinities */}
      <div className="antTwoColGrid">
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">CHÂN DUNG PHONG CÁCH</div>
              <h2 className="antCardTitle">Style Profile Engine</h2>
            </div>
            <ThunderboltOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
          </div>
          <div className="antCardBody">
            {c.styleProfile ? (
              <div className="antStyleProfileContent">
                <div style={{ marginBottom: 16 }}>
                  <span className="antTag antTagInfo">
                    Độ tin cậy: {Math.round(c.styleProfile.confidence * 100)}%
                  </span>
                  <span className="antTag antTagDefault">
                    {c.styleProfile.eventCount} tín hiệu tương tác
                  </span>
                </div>
                <div className="antProfileTagsGroup">
                  <strong>Danh mục yêu thích:</strong>
                  <div className="antTagWrap">
                    {(c.styleProfile.preferredCategories || []).map((cat: string) => (
                      <span key={cat} className="antTag antTagDefault">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="antProfileTagsGroup" style={{ marginTop: 12 }}>
                  <strong>Gam màu ưu tiên:</strong>
                  <div className="antTagWrap">
                    {(c.styleProfile.preferredColors || []).map((color: string) => (
                      <span key={color} className="antTag antTagInfo">
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="antEmptyState">
                <p>Khách hàng chưa tích lũy đủ lịch sử tương tác để sinh hồ sơ phong cách.</p>
              </div>
            )}
          </div>
        </div>

        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">SẢN PHẨM QUAN TÂM CAO</div>
              <h2 className="antCardTitle">Điểm tương đồng (Affinity)</h2>
            </div>
            <TagOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          </div>
          <div className="antCardBody">
            {c.affinities && c.affinities.length ? (
              <div className="antRankList">
                {c.affinities.map((x: any) => (
                  <div key={x.product.id} className="antRankItem">
                    <div className="antRankInfo">
                      <strong className="antRankName">{x.product.name}</strong>
                      <span className="antRankRev">
                        {x.product.category} · {x.product.color}
                      </span>
                    </div>
                    <span className="antTag antTagInfo">
                      Score: {x.score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="antEmptyState">
                <p>Chưa có dữ liệu điểm quan tâm sản phẩm.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Orders History & Wishlist */}
      <div className="antTwoColGrid" style={{ marginTop: 24 }}>
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">LỊCH SỬ GIAO DỊCH</div>
              <h2 className="antCardTitle">Đơn hàng gần đây ({c.orders.length})</h2>
            </div>
            <ShoppingOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          </div>
          <div className="antCardBody">
            {c.orders.length ? (
              <div className="antOrderRecentList">
                {c.orders.slice(0, 8).map((o: any) => (
                  <div key={o.id} className="antOrderRecentItem">
                    <div className="antOrderMain">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="antOrderId"
                      >
                        #{o.id}
                      </Link>
                      <span className="antOrderMeta">
                        {new Intl.DateTimeFormat("vi-VN").format(new Date(o.createdAt))}
                      </span>
                    </div>
                    <div className="antOrderPricing">
                      <strong className="antOrderAmount">
                        {formatPrice(o.total)}
                      </strong>
                      <span className="antTag antTagInfo">{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="antEmptyState">
                <p>Khách hàng chưa thực hiện đơn đặt hàng nào.</p>
              </div>
            )}
          </div>
        </div>

        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">MỤC YÊU THÍCH</div>
              <h2 className="antCardTitle">Wishlist ({c.wishlist.length})</h2>
            </div>
            <HeartOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
          </div>
          <div className="antCardBody">
            {c.wishlist.length ? (
              <div className="antRankList">
                {c.wishlist.slice(0, 10).map((p: any) => (
                  <div key={p.id} className="antRankItem">
                    <div className="antRankInfo">
                      <strong className="antRankName">{p.name}</strong>
                    </div>
                    <strong className="antPrice greenText">
                      {formatPrice(p.price)}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="antEmptyState">
                <p>Danh sách yêu thích trống.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
