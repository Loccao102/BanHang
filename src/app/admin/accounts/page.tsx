"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  KeyOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SyncOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import { ToneTag } from "@/components/admin/status-tag";
import { Pagination } from "@/components/pagination";

type Account = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "admin" | "customer";
  createdAt: string;
  sessionCount: number;
  orderCount: number;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const last = parts[parts.length - 1][0] ?? "";
  const first = parts.length > 1 ? parts[0][0] : "";
  return `${first}${last}`.toUpperCase();
}

const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function AdminAccountsPage() {
  const { user, accountLoading } = useStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [generatedReset, setGeneratedReset] = useState<{ email: string; url: string; delivered: boolean } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const load = useCallback(async () => {
    if (user?.role !== "admin") return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/accounts", { cache: "no-store" });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.error || "Không thể tải tài khoản.");
      setAccounts(d.accounts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter(
      (a) =>
        (roleFilter === "all" || a.role === roleFilter) &&
        (!q || `${a.name} ${a.email} ${a.phone || ""}`.toLowerCase().includes(q))
    );
  }, [accounts, query, roleFilter]);

  async function mutate(id: string, action: string, role?: string) {
    const label =
      action === "revoke-sessions"
        ? "đăng xuất tất cả thiết bị của tài khoản này"
        : role === "admin"
        ? "cấp quyền quản trị"
        : "hạ quyền quản trị";
    if (!window.confirm(`Bạn có chắc muốn ${label}?`)) return;
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const r = await fetch(`/api/admin/accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, role })
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.error || "Không thể cập nhật.");
      setNotice(
        action === "revoke-sessions"
          ? `Đã thu hồi ${d.revoked} phiên đăng nhập.`
          : "Đã cập nhật quyền và thu hồi phiên đăng nhập cũ."
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cập nhật.");
    } finally {
      setBusyId("");
    }
  }

  async function createResetLink(account: Account) {
    setBusyId(account.id);
    setError("");
    setNotice("");
    setGeneratedReset(null);
    try {
      const r = await fetch(`/api/admin/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-reset-link" })
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.error || "Không thể tạo liên kết đặt lại mật khẩu.");
      if (d?.resetUrl) {
        setGeneratedReset({ email: account.email, url: d.resetUrl, delivered: Boolean(d.delivered) });
        try {
          await navigator.clipboard.writeText(d.resetUrl);
          setNotice(`Đã tạo & sao chép liên kết đặt lại mật khẩu cho ${account.email}.`);
        } catch {
          setNotice(`Đã tạo liên kết đặt lại mật khẩu cho ${account.email}.`);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo liên kết.");
    } finally {
      setBusyId("");
    }
  }

  if (accountLoading || (loading && accounts.length === 0 && !error)) {
    return (
      <div className="antLoadingState">
        <SyncOutlined spin style={{ fontSize: 32, color: "#1677ff" }} />
        <p>Đang tải danh sách tài khoản...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <section className="antAccessDeniedCard">
        <div className="antAccessDeniedContent">
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <h2>Khu vực quản trị bị hạn chế</h2>
          <p>Yêu cầu tài khoản quản trị.</p>
          <Link className="antBtn antBtnPrimary" href="/login?next=/admin/accounts">
            Đăng nhập quản trị
          </Link>
        </div>
      </section>
    );
  }

  const admins = accounts.filter((a) => a.role === "admin").length;
  const activeSessions = accounts.reduce((s, a) => s + a.sessionCount, 0);

  return (
    <div className="antAdminPageContainer">
      <div className="antPageHeader">
        <div className="antPageHeaderLeft">
          <div className="antBreadcrumb">
            <Link href="/admin">Trang chủ</Link>
            <span className="antBreadcrumbSeparator">/</span>
            <span className="antBreadcrumbCurrent">Quản lý tài khoản</span>
          </div>
          <h1 className="antPageTitle">Quản lý Tài khoản & Bảo mật</h1>
          <p className="antPageSubtitle">
            Theo dõi tài khoản khách hàng và quản trị viên, phân quyền truy cập, thu hồi phiên đăng nhập và cấp liên kết đặt lại mật khẩu.
          </p>
        </div>
        <div className="antPageHeaderRight">
          <button className="antBtn antBtnDefault" disabled={loading} onClick={() => void load()}>
            <ReloadOutlined spin={loading} /> Làm mới
          </button>
        </div>
      </div>

      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">TỔNG TÀI KHOẢN</span>
            <div className="antStatIconWrap blue"><TeamOutlined /></div>
          </div>
          <div className="antStatValue">{accounts.length}</div>
          <div className="antStatFooter">
            <span className="antTag antTagInfo">Toàn hệ thống</span>
          </div>
        </div>
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">KHÁCH HÀNG</span>
            <div className="antStatIconWrap green"><UserOutlined /></div>
          </div>
          <div className="antStatValue">{accounts.length - admins}</div>
          <div className="antStatFooter">
            <span className="antTag antTagSuccess">Tài khoản mua sắm</span>
          </div>
        </div>
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">QUẢN TRỊ VIÊN</span>
            <div className="antStatIconWrap purple"><SafetyCertificateOutlined /></div>
          </div>
          <div className="antStatValue">{admins}</div>
          <div className="antStatFooter">
            <span className="antTag antTagPurple">Toàn quyền Admin</span>
          </div>
        </div>
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">PHIÊN ĐANG HOẠT ĐỘNG</span>
            <div className="antStatIconWrap orange"><CheckCircleOutlined /></div>
          </div>
          <div className="antStatValue">{activeSessions}</div>
          <div className="antStatFooter">
            <span className="antTag antTagDefault">Thiết bị đang đăng nhập</span>
          </div>
        </div>
      </div>

      {error && <div role="alert" className="antInlineAlert error" style={{ marginBottom: 16 }}>{error}</div>}
      {notice && <div role="status" className="antInlineAlert success" style={{ marginBottom: 16 }}>{notice}</div>}
      {generatedReset && (
        <div className="antInlineAlert" style={{ marginBottom: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <strong>Liên kết đặt lại mật khẩu ({generatedReset.email}):</strong>{" "}
            <code className="antSkuBadge" style={{ wordBreak: "break-all" }}>{generatedReset.url}</code>
          </div>
          <button
            type="button"
            className="antBtn antBtnDefault antBtnSm"
            onClick={() => void navigator.clipboard.writeText(generatedReset.url)}
          >
            <CopyOutlined /> Sao chép link
          </button>
        </div>
      )}

      <div className="antCard">
        <div className="antCardHead antToolbar">
          <div className="antToolbarLeft">
            <h2 className="antCardTitle">
              Danh sách tài khoản <span className="antCountTag">{filtered.length}</span>
            </h2>
          </div>
          <div className="antToolbarRight">
            <div className="antSearchInput">
              <SearchOutlined className="antSearchIcon" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm tên, email, SĐT..."
              />
            </div>
            <select
              className="antSelect"
              aria-label="Lọc vai trò"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="customer">Khách hàng</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>
        </div>
        <div className="antTableContainer">
          <table className="antTable">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Liên hệ</th>
                <th>Vai trò</th>
                <th>Đơn hàng</th>
                <th>Phiên hoạt động</th>
                <th style={{ textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "#8c8c8c" }}>
                    Không có tài khoản phù hợp.
                  </td>
                </tr>
              )}
              {filtered.slice((page - 1) * pageSize, page * pageSize).map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="antCustomerCell">
                      <div className="antAvatar small">{initials(a.name)}</div>
                      <div className="antCustomerMeta">
                        {a.role === "customer" ? (
                          <Link href={`/admin/customers/${a.id}`} className="antCustomerName">
                            {a.name}
                          </Link>
                        ) : (
                          <strong className="antCustomerName">{a.name}</strong>
                        )}
                        <small className="antSubDate">Tạo ngày {dateFmt.format(new Date(a.createdAt))}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="antCustomerContact">
                      <span className="antCustomerEmail"><MailOutlined /> {a.email}</span>
                      <small className={`antCustomerPhone ${a.phone ? "" : "muted"}`}>
                        <PhoneOutlined /> {a.phone || "Chưa có số điện thoại"}
                      </small>
                    </div>
                  </td>
                  <td>
                    <ToneTag tone={a.role === "admin" ? "purple" : "info"}>
                      {a.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                    </ToneTag>
                  </td>
                  <td>
                    <ToneTag tone={a.orderCount > 0 ? "info" : "default"}>{a.orderCount} đơn</ToneTag>
                  </td>
                  <td>
                    <ToneTag tone={a.sessionCount > 0 ? "success" : "default"}>{a.sessionCount} phiên</ToneTag>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="antBtn antBtnDefault antBtnSm"
                        disabled={busyId === a.id}
                        onClick={() => void createResetLink(a)}
                        title="Tạo liên kết đặt lại mật khẩu 30 phút"
                      >
                        <KeyOutlined /> Cấp link đổi MK
                      </button>
                      <button
                        type="button"
                        className="antBtn antBtnDefault antBtnSm"
                        disabled={busyId === a.id || a.sessionCount === 0 || a.id === user.id}
                        onClick={() => void mutate(a.id, "revoke-sessions")}
                      >
                        Đăng xuất thiết bị
                      </button>
                      {a.id !== user.id && (
                        <button
                          type="button"
                          className="antBtn antBtnDefault antBtnSm"
                          disabled={busyId === a.id}
                          onClick={() => void mutate(a.id, "change-role", a.role === "admin" ? "customer" : "admin")}
                        >
                          {a.role === "admin" ? "Hạ quyền" : "Cấp quyền admin"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > pageSize && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--ant-border)" }}>
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(filtered.length / pageSize)}
              onPageChange={setPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              itemLabel="tài khoản"
            />
          </div>
        )}
      </div>
    </div>
  );
}
