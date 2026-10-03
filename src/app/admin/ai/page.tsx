"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AimOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExperimentOutlined,
  LikeOutlined,
  ReloadOutlined,
  RobotOutlined,
  SyncOutlined,
  ThunderboltOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";

type Data = {
  tryOn: {
    total: number;
    completed: number;
    failed: number;
    rejected: number;
    successRate: number;
    accepted: number;
  };
  stylist: {
    assessments: number;
    averageScore: number;
    feedback: Record<string, number>;
  };
  personalization: {
    profiles: number;
    averageConfidence: number;
    signals: number;
  };
  recommendations: {
    total: number;
    feedback: Record<string, number>;
  };
  recentBehavior: Record<string, number>;
};

export default function AdminAIPage() {
  const { user, accountLoading } = useStore();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);

  function loadData() {
    if (user?.role !== "admin") return;
    setLoading(true);
    fetch("/api/admin/ai", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, [user]);

  if (accountLoading || (user?.role === "admin" && !data)) {
    return (
      <div className="antLoadingState">
        <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
        <p>Đang tải dữ liệu AI Insights...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực Quản trị Bị Hạn chế</h2>
          <p>Trang AI Insights yêu cầu quyền quản trị viên.</p>
          <Link className="antBtn antBtnPrimary" href="/login?next=/admin/ai">
            Đăng nhập Quản trị
          </Link>
        </div>
      </section>
    );
  }

  if (!data) return null;

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
            <span className="antBreadcrumbCurrent">Trung tâm Trí tuệ Nhân tạo (AI Insights)</span>
          </div>
          <h1 className="antPageTitle">AI Operations & Intelligent Engine</h1>
          <p className="antPageSubtitle">
            Giám sát độ tin cậy của mô hình Virtual Try-On, đánh giá chất lượng Stylist tư vấn và hành vi cá nhân hóa gu thời trang.
          </p>
        </div>

        <div className="antPageHeaderRight">
          <div className="antHeaderActionGroup">
            <button
              type="button"
              className="antBtn antBtnDefault"
              onClick={loadData}
              disabled={loading}
            >
              <ReloadOutlined spin={loading} /> Làm mới số liệu
            </button>
            <Link className="antBtn antBtnPrimary" href="/admin/analytics">
              Sales Analytics
            </Link>
          </div>
        </div>
      </div>

      {/* Ant Design Stat Cards Grid */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">VIRTUAL TRY-ON</span>
            <div className="antStatIconWrap cyan">
              <ExperimentOutlined />
            </div>
          </div>
          <div className="antStatValue">{data.tryOn.total}</div>
          <div className="antStatFooter">
            <span className="antTag antTagSuccess">
              <CheckCircleOutlined /> {data.tryOn.successRate}% tỉ lệ thành công
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">AI STYLIST TƯ VẤN</span>
            <div className="antStatIconWrap purple">
              <RobotOutlined />
            </div>
          </div>
          <div className="antStatValue">{data.stylist.assessments}</div>
          <div className="antStatFooter">
            <span className="antTag antTagInfo">
              Điểm hài lòng TB {data.stylist.averageScore}/100
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">HỒ SƠ GU THỜI TRANG</span>
            <div className="antStatIconWrap orange">
              <ThunderboltOutlined />
            </div>
          </div>
          <div className="antStatValue">{data.personalization.profiles}</div>
          <div className="antStatFooter">
            <span className="antTag antTagWarning">
              Độ tin cậy TB {data.personalization.averageConfidence}%
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">GỢI Ý PHỐI ĐỒ (RECOMMEND)</span>
            <div className="antStatIconWrap blue">
              <AimOutlined />
            </div>
          </div>
          <div className="antStatValue">{data.recommendations.total}</div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">
              {data.personalization.signals} tín hiệu hành vi đã ghi nhận
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column AI Health Grids */}
      <div className="antTwoColGrid">
        {/* Panel 1: Try-On Health */}
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">HIỆU NĂNG THỬ ĐỒ ẢO</div>
              <h2 className="antCardTitle">Virtual Try-On Health</h2>
            </div>
            <ExperimentOutlined style={{ fontSize: 20, color: "#13c2c2" }} />
          </div>
          <div className="antCardBody">
            <div className="antBreakdownList">
              <div className="antBreakdownItem">
                <span className="antBreakdownLabel">
                  <span className="antStatusDot active" />
                  Ảnh tạo hoàn tất thành công (Completed)
                </span>
                <span className="antTag antTagSuccess">{data.tryOn.completed}</span>
              </div>
              <div className="antBreakdownItem">
                <span className="antBreakdownLabel">
                  <span className="antStatusDot" style={{ background: "#52c41a" }} />
                  Khách hàng ưng ý & thêm vào giỏ (Accepted)
                </span>
                <span className="antTag antTagSuccess">{data.tryOn.accepted}</span>
              </div>
              <div className="antBreakdownItem">
                <span className="antBreakdownLabel">
                  <span className="antStatusDot" style={{ background: "#faad14" }} />
                  Khách yêu cầu tạo lại (Rejected)
                </span>
                <span className="antTag antTagWarning">{data.tryOn.rejected}</span>
              </div>
              <div className="antBreakdownItem">
                <span className="antBreakdownLabel">
                  <span className="antStatusDot" style={{ background: "#ff4d4f" }} />
                  Lỗi API / Máy chủ xử lý (Failed)
                </span>
                <span className="antTag antTagError">{data.tryOn.failed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Stylist Feedback */}
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">PHẢN HỒI NGƯỜI DÙNG</div>
              <h2 className="antCardTitle">Stylist & Phối đồ phản hồi</h2>
            </div>
            <LikeOutlined style={{ fontSize: 20, color: "#722ed1" }} />
          </div>
          <div className="antCardBody">
            {Object.keys(data.stylist.feedback).length ? (
              <div className="antBreakdownList">
                {Object.entries(data.stylist.feedback).map(([k, v]) => (
                  <div key={k} className="antBreakdownItem">
                    <span className="antBreakdownLabel">{k}</span>
                    <span className="antTag antTagInfo">{v} lượt</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="antEmptyState">
                <RobotOutlined style={{ fontSize: 32, color: "#8c8c8c" }} />
                <p>Chưa có phản hồi chấm điểm từ khách hàng.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grids: Recommendations & User Behavior */}
      <div className="antTwoColGrid" style={{ marginTop: 24 }}>
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">TƯƠNG TÁC GỢI Ý</div>
              <h2 className="antCardTitle">Độ khớp gợi ý sản phẩm (Recommendation)</h2>
            </div>
            <AimOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          </div>
          <div className="antCardBody">
            {Object.keys(data.recommendations.feedback).length ? (
              <div className="antBreakdownList">
                {Object.entries(data.recommendations.feedback).map(([k, v]) => (
                  <div key={k} className="antBreakdownItem">
                    <span className="antBreakdownLabel">{k}</span>
                    <span className="antTag antTagDefault">{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="antEmptyState">
                <p>Chưa ghi nhận tín hiệu phản hồi gợi ý.</p>
              </div>
            )}
          </div>
        </div>

        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">NHẬT KÝ SỰ KIỆN</div>
              <h2 className="antCardTitle">500 hành vi người dùng gần nhất</h2>
            </div>
            <ThunderboltOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
          </div>
          <div className="antCardBody">
            <div className="antBreakdownList">
              {Object.entries(data.recentBehavior)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <div key={k} className="antBreakdownItem">
                    <span className="antBreakdownLabel"><code>{k}</code></span>
                    <span className="antTag antTagInfo">{v} lần</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
