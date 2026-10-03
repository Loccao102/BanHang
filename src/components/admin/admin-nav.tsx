"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AppstoreOutlined,
  BarChartOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  ExportOutlined,
  RobotOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";

interface AdminNavProps {
  currentTab?: string;
  onTabChange?: (tab: "overview" | "products" | "orders" | "settings") => void;
}

export function AdminNav({ currentTab, onTabChange }: AdminNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, persistenceMode } = useStore();

  const activeTab = currentTab || searchParams?.get("tab") || "overview";

  const isMainAdmin = pathname === "/admin";

  const navItems = [
    {
      key: "overview",
      label: "Tổng quan",
      icon: <DashboardOutlined />,
      href: "/admin",
      isTab: true,
      tabValue: "overview" as const,
      active: isMainAdmin && activeTab === "overview"
    },
    {
      key: "products",
      label: "Sản phẩm & Kho",
      icon: <AppstoreOutlined />,
      href: "/admin?tab=products",
      isTab: true,
      tabValue: "products" as const,
      active: isMainAdmin && activeTab === "products"
    },
    {
      key: "orders",
      label: "Đơn hàng",
      icon: <ShoppingOutlined />,
      href: "/admin?tab=orders",
      isTab: true,
      tabValue: "orders" as const,
      active: (isMainAdmin && activeTab === "orders") || pathname?.startsWith("/admin/orders")
    },
    {
      key: "fulfillment",
      label: "Vận hành & Giao nhận",
      icon: <CarOutlined />,
      href: "/admin/fulfillment",
      isTab: false,
      active: pathname === "/admin/fulfillment"
    },
    {
      key: "customers",
      label: "Khách hàng CRM",
      icon: <TeamOutlined />,
      href: "/admin/customers",
      isTab: false,
      active: pathname?.startsWith("/admin/customers")
    },
    {
      key: "analytics",
      label: "Báo cáo doanh thu",
      icon: <BarChartOutlined />,
      href: "/admin/analytics",
      isTab: false,
      active: pathname === "/admin/analytics"
    },
    {
      key: "ai",
      label: "AI Insights",
      icon: <RobotOutlined />,
      href: "/admin/ai",
      isTab: false,
      active: pathname === "/admin/ai"
    },
    {
      key: "marketing",
      label: "Marketing & Social",
      icon: <TagsOutlined />,
      href: "/admin/marketing",
      isTab: false,
      active: pathname === "/admin/marketing"
    },
    {
      key: "settings",
      label: "Cài đặt",
      icon: <SettingOutlined />,
      href: "/admin?tab=settings",
      isTab: true,
      tabValue: "settings" as const,
      active: isMainAdmin && activeTab === "settings"
    }
  ];

  return (
    <header className="antAdminHeaderWrap">
      {/* Top Header Bar */}
      <div className="antAdminTopBar">
        <div className="antAdminBrandArea">
          <Link href="/admin" className="antAdminLogo">
            <span className="antLogoName">LSOUL</span>
            <span className="antLogoBadge">PRO CONSOLE</span>
          </Link>
          <div className="antDbBadgeWrap">
            {persistenceMode === "database" ? (
              <span className="antTag antTagSuccess">
                <CheckCircleOutlined /> PostgreSQL · Đã kết nối
              </span>
            ) : (
              <span className="antTag antTagWarning">
                <SyncOutlined spin /> Trình duyệt (Local)
              </span>
            )}
          </div>
        </div>

        <div className="antAdminTopActions">
          <a
            href={process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000"}
            target="_blank"
            rel="noreferrer"
            className="antBtn antBtnDefault antBtnSm"
          >
            <ShopOutlined />
            <span>Xem Website Khách Hàng (Port 3000)</span>
            <ExportOutlined style={{ fontSize: 11, opacity: 0.7 }} />
          </a>

          <div className="antUserPill">
            <div className="antAvatar">
              <UserOutlined />
            </div>
            <div className="antUserInfo">
              <span className="antUserName">{user?.name || "Admin"}</span>
              <span className="antUserRole">Quản trị viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Horizontal Navigation Tabs */}
      <nav className="antAdminNavMenu" aria-label="Admin Navigation">
        <div className="antAdminNavScroll">
          {navItems.map((item) => {
            if (isMainAdmin && item.isTab && item.tabValue && onTabChange) {
              const tabVal = item.tabValue;
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`antAdminNavItem ${item.active ? "antAdminNavItemActive" : ""}`}
                  onClick={() => onTabChange(tabVal)}
                >
                  <span className="antNavIcon">{item.icon}</span>
                  <span className="antNavLabel">{item.label}</span>
                  {item.active && <span className="antNavActiveIndicator" />}
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`antAdminNavItem ${item.active ? "antAdminNavItemActive" : ""}`}
              >
                <span className="antNavIcon">{item.icon}</span>
                <span className="antNavLabel">{item.label}</span>
                {item.active && <span className="antNavActiveIndicator" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
