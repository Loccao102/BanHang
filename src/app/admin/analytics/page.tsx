"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  ReloadOutlined,
  RiseOutlined,
  RobotOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TeamOutlined,
  TrophyOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import { formatPrice } from "@/lib/products";

type Data = {
  summary: {
    customers: number;
    products: number;
    activeProducts: number;
    totalStock: number;
    orders: number;
    paidOrders: number;
    paidRevenue: number;
    grossOrderValue: number;
    averageOrderValue: number;
  };
  byStatus: Record<string, number>;
  byPayment: Record<string, number>;
  daily: { date: string; orders: number; revenue: number }[];
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
};

const statusViLabels: Record<string, string> = {
  processing: "Đang xử lý",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  completed: "Hoàn tất đơn",
  cancelled: "Đã hủy"
};

const paymentViLabels: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  cod_pending: "COD chờ thu tiền",
  failed: "Thanh toán lỗi",
  refunded: "Đã hoàn tiền"
};

export default function AdminAnalyticsPage() {
  const { user, accountLoading } = useStore();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);

  function loadData() {
    if (user?.role !== "admin") return;
    setLoading(true);
    fetch("/api/admin/analytics", { cache: "no-store" })
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
        <p>Đang tải dữ liệu phân tích doanh thu...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực Quản trị Bị Hạn chế</h2>
          <p>Trang báo cáo phân tích yêu cầu quyền quản trị viên.</p>
          <Link className="antBtn antBtnPrimary" href="/login?next=/admin/analytics">
            Đăng nhập Quản trị
          </Link>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const maxRevenue = Math.max(1, ...data.daily.map((x) => x.revenue));
  const totalDailyOrders = data.daily.reduce((sum, item) => sum + item.orders, 0);

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
            <span className="antBreadcrumbCurrent">Báo cáo Doanh thu & Hiệu quả</span>
          </div>
          <h1 className="antPageTitle">Hiệu quả Kinh doanh & Bán lẻ</h1>
          <p className="antPageSubtitle">
            Thống kê doanh số bán thực tế, quy mô giỏ hàng (AOV), xếp hạng sản phẩm bán chạy và phân bổ trạng thái đơn.
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
              <ReloadOutlined spin={loading} /> Làm mới
            </button>
            <Link className="antBtn antBtnPrimary" href="/admin/ai">
              <RobotOutlined /> Xem AI Insights
            </Link>
          </div>
        </div>
      </div>

      {/* Ant Design Stat Cards Grid */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">DOANH THU ĐÃ THU</span>
            <div className="antStatIconWrap green">
              <DollarCircleOutlined />
            </div>
          </div>
          <div className="antStatValue greenText">
            {formatPrice(data.summary.paidRevenue)}
          </div>
          <div className="antStatFooter">
            <span className="antTag antTagSuccess">
              <CheckCircleOutlined /> GMV {formatPrice(data.summary.grossOrderValue)}
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">ĐƠN ĐÃ THU TIỀN</span>
            <div className="antStatIconWrap blue">
              <ShoppingOutlined />
            </div>
          </div>
          <div className="antStatValue">{data.summary.paidOrders}</div>
          <div className="antStatFooter">
            <span className="antTag antTagInfo">
              Tổng {data.summary.orders} đơn đặt
            </span>
            <span className="antStatSubtext">
              ({data.summary.orders > 0 ? Math.round((data.summary.paidOrders / data.summary.orders) * 100) : 0}% thành công)
            </span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">GIÁ TRỊ ĐƠN TRUNG BÌNH (AOV)</span>
            <div className="antStatIconWrap purple">
              <RiseOutlined />
            </div>
          </div>
          <div className="antStatValue">
            {formatPrice(data.summary.averageOrderValue)}
          </div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">Trung bình mỗi giao dịch thành công</span>
          </div>
        </div>

        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">KHÁCH HÀNG TÍCH CỰC</span>
            <div className="antStatIconWrap orange">
              <TeamOutlined />
            </div>
          </div>
          <div className="antStatValue">{data.summary.customers}</div>
          <div className="antStatFooter">
            <span className="antTag antTagSuccess">
              {data.summary.activeProducts} SKU đang kinh doanh
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Analytics: 30 Days Chart & Top Products */}
      <div className="antTwoColGrid">
        {/* Daily Revenue Chart */}
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">DOANH THU 30 NGÀY QUA</div>
              <h2 className="antCardTitle">Biểu đồ doanh số theo ngày</h2>
            </div>
            <span className="antTag antTagInfo">
              <CalendarOutlined /> {totalDailyOrders} đơn phát sinh
            </span>
          </div>

          <div className="antCardBody">
            <div className="antDailyBarsList">
              {data.daily.map((x) => {
                const percent = Math.max(x.revenue > 0 ? 4 : 0, Math.round((x.revenue / maxRevenue) * 100));
                return (
                  <div key={x.date} className="antDailyBarRow">
                    <span className="antDailyDate">
                      {new Intl.DateTimeFormat("vi-VN", {
                        day: "2-digit",
                        month: "2-digit"
                      }).format(new Date(x.date))}
                    </span>
                    <div className="antDailyTrack">
                      <div
                        className="antDailyBarFill"
                        style={{ width: `${percent}%` }}
                        title={`${formatPrice(x.revenue)} (${x.orders} đơn)`}
                      />
                    </div>
                    <div className="antDailyStat">
                      <strong className={`antDailyAmount ${x.revenue > 0 ? "hasRev" : ""}`}>
                        {formatPrice(x.revenue)}
                      </strong>
                      <small className="antDailyOrderCount">{x.orders} đơn</small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">BẢNG XẾP HẠNG DOANH SỐ</div>
              <h2 className="antCardTitle">Top sản phẩm bán chạy</h2>
            </div>
            <TrophyOutlined style={{ fontSize: 20, color: "#faad14" }} />
          </div>

          <div className="antCardBody">
            {data.topProducts.length ? (
              <div className="antRankList">
                {data.topProducts.map((x, index) => {
                  const rankClass =
                    index === 0
                      ? "rank-1"
                      : index === 1
                      ? "rank-2"
                      : index === 2
                      ? "rank-3"
                      : "rank-default";
                  return (
                    <div key={x.productId} className="antRankItem">
                      <div className={`antRankBadge ${rankClass}`}>{index + 1}</div>
                      <div className="antRankInfo">
                        <strong className="antRankName">{x.name}</strong>
                        <span className="antRankRev">{formatPrice(x.revenue)}</span>
                      </div>
                      <div className="antRankQty">
                        <span className="antTag antTagInfo">
                          {x.quantity} sản phẩm
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="antEmptyState">
                <BarChartOutlined style={{ fontSize: 36, color: "#8c8c8c" }} />
                <p>Chưa có dữ liệu giao dịch thành công cho top sản phẩm.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Status Breakdown Grids */}
      <div className="antTwoColGrid" style={{ marginTop: 24 }}>
        {/* Orders by Status */}
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">PHÂN BỔ QUY TRÌNH</div>
              <h2 className="antCardTitle">Trạng thái đơn hàng</h2>
            </div>
            <ClockCircleOutlined style={{ fontSize: 20, color: "#1677ff" }} />
          </div>
          <div className="antCardBody">
            <div className="antBreakdownList">
              {Object.entries(data.byStatus).map(([k, v]) => (
                <div key={k} className="antBreakdownItem">
                  <span className="antBreakdownLabel">
                    <span className="antStatusDot" />
                    {statusViLabels[k] || k}
                  </span>
                  <span className="antTag antTagDefault">{v} đơn</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Orders by Payment */}
        <div className="antCard">
          <div className="antCardHead">
            <div>
              <div className="antCardEyebrow">CỔNG THANH TOÁN</div>
              <h2 className="antCardTitle">Trạng thái thanh toán</h2>
            </div>
            <DollarCircleOutlined style={{ fontSize: 20, color: "#52c41a" }} />
          </div>
          <div className="antCardBody">
            <div className="antBreakdownList">
              {Object.entries(data.byPayment).map(([k, v]) => (
                <div key={k} className="antBreakdownItem">
                  <span className="antBreakdownLabel">
                    <span className="antStatusDot payment" />
                    {paymentViLabels[k] || k}
                  </span>
                  <span className="antTag antTagSuccess">{v} giao dịch</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
