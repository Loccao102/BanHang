"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  LinkOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
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

type Draft = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "customer" | "admin";
};

const emptyDraft: Draft = { name: "", email: "", phone: "", password: "", role: "customer" };

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
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [modal, setModal] = useState<"create" | "edit" | "password" | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [customNewPassword, setCustomNewPassword] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [resetUrl, setResetUrl] = useState("");

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

  const admins = accounts.filter((a) => a.role === "admin").length;
  const activeSessions = accounts.reduce((s, a) => s + a.sessionCount, 0);

  function openCreate() {
    setSelected(null);
    setDraft(emptyDraft);
    setError("");
    setModal("create");
  }

  function openEdit(a: Account) {
    setSelected(a);
    setDraft({ name: a.name, email: a.email, phone: a.phone || "", password: "", role: a.role });
    setError("");
    setModal("edit");
  }

  function openPasswordModal(a: Account) {
    setSelected(a);
    setCustomNewPassword("");
    setTemporaryPassword("");
    setResetUrl("");
    setError("");
    setModal("password");
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setCustomNewPassword("");
    setTemporaryPassword("");
    setResetUrl("");
  }

  async function submitAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusyId(selected?.id || "create");
    setError("");
    setNotice("");
    try {
      const isCreate = modal === "create";
      const r = await fetch(isCreate ? "/api/admin/accounts" : `/api/admin/accounts/${selected!.id}`, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isCreate
            ? draft
            : {
                action: "edit",
                name: draft.name,
                email: draft.email,
                phone: draft.phone,
                role: draft.role,
                ...(draft.password.trim() ? { password: draft.password.trim() } : {})
              }
        )
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.error || "Không thể lưu tài khoản.");
      closeModal();
      setNotice(isCreate ? "Đã tạo tài khoản mới." : "Đã cập nhật thông tin tài khoản.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể lưu tài khoản.");
    } finally {
      setBusyId("");
    }
  }

  async function runAction(a: Account, action: string) {
    if (!action) return;
    if (action === "edit") {
      openEdit(a);
      return;
    }
    if (action === "reset-password") {
      openPasswordModal(a);
      return;
    }
    const descriptions: Record<string, string> = {
      "revoke-sessions": "đăng xuất tài khoản này khỏi tất cả thiết bị",
      "change-role":
        a.role === "admin"
          ? "hạ quyền tài khoản này xuống khách hàng"
          : "cấp quyền quản trị cho tài khoản này",
      delete: "xóa tài khoản này"
    };
    if (
      !window.confirm(
        `Bạn có chắc muốn ${descriptions[action]}? ${
          action === "delete" ? "Đơn hàng đã tạo sẽ được giữ lại nhưng không còn gắn với tài khoản." : ""
        }`
      )
    ) {
      return;
    }
    setBusyId(a.id);
    setError("");
    setNotice("");
    try {
      const r = await fetch(
        `/api/admin/accounts/${a.id}`,
        action === "delete"
          ? { method: "DELETE" }
          : {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action,
                role: a.role === "admin" ? "customer" : "admin"
              })
            }
      );
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.error || "Không thể thực hiện thao tác.");
      setNotice(
        action === "delete"
          ? "Đã xóa tài khoản."
          : action === "revoke-sessions"
          ? `Đã thu hồi ${d.revoked} phiên đăng nhập.`
          : "Đã cập nhật quyền tài khoản và thu hồi phiên đăng nhập cũ."
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể thực hiện thao tác.");
    } finally {
      setBusyId("");
    }
  }

  async function resetPassword() {
    if (!selected) return;
    setBusyId(selected.id);
    setError("");
    setTemporaryPassword("");
    try {
      const r = await fetch(`/api/admin/accounts/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          ...(customNewPassword.trim() ? { password: customNewPassword.trim() } : {})
        })
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.error || "Không thể đặt lại mật khẩu.");
      setTemporaryPassword(d.temporaryPassword);
      setNotice("Đã đặt mật khẩu mới thành công.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setBusyId("");
    }
  }

  async function createResetLink() {
    if (!selected) return;
    setBusyId(selected.id);
    setError("");
    setResetUrl("");
    try {
      const r = await fetch(`/api/admin/accounts/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-reset-link" })
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.error || "Không thể tạo liên kết đặt lại mật khẩu.");
      setResetUrl(d.resetUrl);
      try {
        await navigator.clipboard.writeText(d.resetUrl);
        setNotice("Đã tạo & sao chép liên kết đặt lại mật khẩu (hiệu lực 30 phút).");
      } catch {
        setNotice("Đã tạo liên kết đặt lại mật khẩu (hiệu lực 30 phút).");
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
            Thêm mới, chỉnh sửa thông tin, đặt lại mật khẩu, cấp liên kết khôi phục và quản lý quyền truy cập tài khoản.
          </p>
        </div>
        <div className="antPageHeaderRight">
          <div className="antHeaderActionGroup">
            <button className="antBtn antBtnDefault" disabled={loading} onClick={() => void load()}>
              <ReloadOutlined spin={loading} /> Làm mới
            </button>
            <button className="antBtn antBtnPrimary" onClick={openCreate}>
              <PlusOutlined /> Thêm tài khoản
            </button>
          </div>
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
                placeholder="Tìm tên, email, số điện thoại..."
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
                <th>Thông tin liên hệ</th>
                <th>Vai trò</th>
                <th>Đơn hàng</th>
                <th>Phiên đăng nhập</th>
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
                    <div style={{ display: "inline-flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        className="antActionBtn edit"
                        disabled={busyId === a.id}
                        onClick={() => openEdit(a)}
                        title="Sửa thông tin"
                      >
                        <EditOutlined /> Sửa
                      </button>
                      <button
                        type="button"
                        className="antActionBtn"
                        disabled={busyId === a.id}
                        onClick={() => openPasswordModal(a)}
                        title="Đặt lại mật khẩu / Tạo link khôi phục"
                      >
                        <KeyOutlined /> Mật khẩu
                      </button>
                      <select
                        aria-label={`Thao tác với ${a.name}`}
                        className="antSelect"
                        value=""
                        disabled={busyId === a.id}
                        onChange={(e) => {
                          const v = e.target.value;
                          e.target.value = "";
                          void runAction(a, v);
                        }}
                        style={{ minWidth: 135 }}
                      >
                        <option value="">Thêm thao tác...</option>
                        <option value="edit">Sửa thông tin</option>
                        <option value="reset-password">Đặt lại mật khẩu</option>
                        <option value="revoke-sessions" disabled={a.sessionCount === 0 || a.id === user.id}>
                          Đăng xuất thiết bị
                        </option>
                        {a.id !== user.id && (
                          <option value="change-role">
                            {a.role === "admin" ? "Hạ quyền admin" : "Cấp quyền admin"}
                          </option>
                        )}
                        {a.id !== user.id && <option value="delete">Xóa tài khoản</option>}
                      </select>
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

      {modal && (
        <div
          role="presentation"
          onClick={closeModal}
          className="antModalBackdrop"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              color: "#1f1f1f",
              width: "min(100%, 520px)",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <h2 id="account-modal-title" style={{ margin: 0, fontSize: 18 }}>
                {modal === "create"
                  ? "Thêm tài khoản mới"
                  : modal === "edit"
                  ? `Chỉnh sửa: ${selected?.name}`
                  : `Mật khẩu & Khôi phục: ${selected?.name}`}
              </h2>
              <button type="button" className="antBtn antBtnDefault antBtnSm" onClick={closeModal}>
                Đóng
              </button>
            </div>

            {modal !== "password" ? (
              <form onSubmit={submitAccount} style={{ display: "grid", gap: 14 }}>
                <label className="antFormField">
                  <span className="antFormLabel">Họ tên *</span>
                  <input
                    className="antInput"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    required
                    minLength={2}
                  />
                </label>
                <label className="antFormField">
                  <span className="antFormLabel">Email *</span>
                  <input
                    className="antInput"
                    type="email"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    required
                  />
                </label>
                <label className="antFormField">
                  <span className="antFormLabel">Số điện thoại</span>
                  <input
                    className="antInput"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  />
                </label>
                <label className="antFormField">
                  <span className="antFormLabel">Vai trò</span>
                  <select
                    className="antSelect"
                    value={draft.role}
                    disabled={modal === "edit" && selected?.id === user.id}
                    onChange={(e) => setDraft({ ...draft, role: e.target.value as Draft["role"] })}
                  >
                    <option value="customer">Khách hàng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </label>
                <label className="antFormField">
                  <span className="antFormLabel">
                    {modal === "create" ? "Mật khẩu ban đầu *" : "Đổi mật khẩu mới (để trống nếu giữ nguyên)"}
                  </span>
                  <input
                    className="antInput"
                    type="password"
                    minLength={8}
                    required={modal === "create"}
                    placeholder={modal === "create" ? "Tối thiểu 8 ký tự" : "Nhập mật khẩu mới nếu muốn đổi..."}
                    value={draft.password}
                    onChange={(e) => setDraft({ ...draft, password: e.target.value })}
                  />
                </label>
                {error && <div role="alert" className="antInlineAlert error">{error}</div>}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
                  <button type="button" className="antBtn antBtnDefault" onClick={closeModal}>
                    Hủy
                  </button>
                  <button className="antBtn antBtnPrimary" disabled={!!busyId}>
                    {busyId ? "Đang lưu..." : modal === "create" ? "Tạo tài khoản" : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                <p style={{ margin: 0, fontSize: 13.5, color: "#595959" }}>
                  Tài khoản: <strong>{selected?.name}</strong> ({selected?.email})
                </p>

                <label className="antFormField">
                  <span className="antFormLabel">Nhập mật khẩu mới (hoặc để trống để tạo ngẫu nhiên)</span>
                  <input
                    className="antInput"
                    type="text"
                    placeholder="VD: Lsoul@2026 (để trống sẽ tự sinh mã ngẫu nhiên)"
                    value={customNewPassword}
                    onChange={(e) => setCustomNewPassword(e.target.value)}
                  />
                </label>

                {temporaryPassword && (
                  <div className="antInlineAlert success" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                    <div>
                      Mật khẩu mới: <code className="antSkuBadge" style={{ fontSize: 14 }}>{temporaryPassword}</code>
                    </div>
                    <button
                      type="button"
                      className="antBtn antBtnDefault antBtnSm"
                      onClick={() => void navigator.clipboard.writeText(temporaryPassword)}
                    >
                      <CopyOutlined /> Sao chép
                    </button>
                  </div>
                )}

                {resetUrl && (
                  <div className="antInlineAlert" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
                    <div style={{ wordBreak: "break-all" }}>
                      Link đặt lại (30 phút): <code className="antSkuBadge">{resetUrl}</code>
                    </div>
                    <button
                      type="button"
                      className="antBtn antBtnDefault antBtnSm"
                      onClick={() => void navigator.clipboard.writeText(resetUrl)}
                    >
                      <CopyOutlined /> Sao chép link
                    </button>
                  </div>
                )}

                {error && <div role="alert" className="antInlineAlert error">{error}</div>}

                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  <button
                    type="button"
                    className="antBtn antBtnDefault"
                    disabled={!!busyId}
                    onClick={() => void createResetLink()}
                  >
                    <LinkOutlined /> Tạo link tự đặt lại MK (30p)
                  </button>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="antBtn antBtnDefault" onClick={closeModal}>
                      Đóng
                    </button>
                    <button
                      type="button"
                      className="antBtn antBtnPrimary"
                      disabled={!!busyId}
                      onClick={() => void resetPassword()}
                    >
                      <KeyOutlined /> {busyId ? "Đang xử lý..." : customNewPassword.trim() ? "Đặt mật khẩu này" : "Tạo mật khẩu tạm thời"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
