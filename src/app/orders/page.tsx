"use client";

import Link from "next/link";
import { ArrowLeft, PackageSearch, RefreshCw, ShoppingBag, UserRound } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/components/store-provider";
import { OrderTracker } from "@/components/order-tracker";

export default function OrdersPage() {
  const { orders, user, accountLoading, refreshAccount } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await refreshAccount(false);
    setRefreshing(false);
  }

  if (accountLoading) {
    return (
      <div className="accountLoading" style={{ padding: "80px 4vw" }}>
        <div className="skeletonLine title" />
        <div className="skeletonBlock detailSkeleton" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="emptyState">
        <div>
          <UserRound size={40} />
          <h2>Đăng nhập để theo dõi đơn hàng</h2>
          <p>Tiến độ đóng gói, vận chuyển và lịch sử mua sắm được đồng bộ theo tài khoản của bạn.</p>
          <Link className="btn" href="/login?next=/orders">Đăng nhập</Link>
        </div>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="emptyState">
        <div>
          <PackageSearch size={40} />
          <h2>Chưa có đơn hàng nào</h2>
          <p>Các đơn hàng sau khi đặt mua sẽ hiển thị lộ trình và tiến độ xử lý chi tiết tại đây.</p>
          <Link className="btn" href="/shop">
            <ShoppingBag size={15} /> Khám phá sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="ordersPage">
      <div className="ordersHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p className="eyebrow">ORDER PROGRESS & TRACKING</p>
          <h1>Tiến độ đơn hàng</h1>
          <p style={{ color: "var(--muted)", margin: "8px 0 0", fontSize: 14 }}>
            Theo dõi hành trình xử lý, thanh toán VietQR và trạng thái giao vận theo thời gian thực.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn ghost small"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Đang cập nhật..." : "Làm mới trạng thái"}</span>
          </button>
          <Link className="btn secondary small" href="/shop">
            Mua thêm
          </Link>
        </div>
      </div>

      <div className="orderList">
        {orders.map((order) => (
          <OrderTracker key={order.id} order={order} showItems={true} />
        ))}
      </div>
    </section>
  );
}
