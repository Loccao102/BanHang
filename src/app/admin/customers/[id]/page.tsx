"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DollarCircleOutlined,
  EnvironmentOutlined,
  ExperimentOutlined,
  HeartOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
  RobotOutlined,
  ShoppingOutlined,
  SyncOutlined,
  TagOutlined,
  ThunderboltOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useStore } from "@/components/store-provider";
import { StatusTag, ToneTag } from "@/components/admin/status-tag";
import { categoryLabels, formatPrice, typeLabels } from "@/lib/products";
import { paymentMethodLabel } from "@/lib/admin-status";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Data = { customer: any };
type ScoreEntry = { key: string; score: number };

/**
 * Style-profile preferences are stored as JSON score maps (`{"tops": 1, "dress": 0.4}`),
 * but older rows / seeds may contain plain arrays (`["tops"]`). Accept both shapes so the
 * page never crashes on `.map is not a function`.
 */
function toScoreEntries(value: unknown, limit = 8): ScoreEntry[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .slice(0, limit)
      .map((key) => ({ key, score: 1 }));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, score]) => typeof score === "number" && score > 0)
      .map(([key, score]) => ({ key, score: Math.min(1, Number(score)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  return [];
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value && typeof value === "object") return Object.keys(value as Record<string, unknown>);
  return [];
}

function labelFor(key: string) {
  return (
    (categoryLabels as Record<string, string>)[key] ??
    (typeLabels as Record<string, string>)[key] ??
    key.replace(/[-_]/g, " ")
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const last = parts[parts.length - 1][0] ?? "";
  const first = parts.length > 1 ? parts[0][0] : "";
  return `${first}${last}`.toUpperCase();
}

const dateFmt = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

function ScoreGroup({ title, entries, tone }: { title: string; entries: ScoreEntry[]; tone: string }) {
  return (
    <div className="crmScoreGroup">
      <div className="crmScoreGroupTitle">{title}</div>
      {entries.length ? (
        <div className="crmScoreList">
          {entries.map((entry) => (
            <div key={entry.key} className="crmScoreRow">
              <span className="crmScoreLabel" title={entry.key}>{labelFor(entry.key)}</span>
              <span className="crmScoreTrack">
                <span className={`crmScoreFill ${tone}`} style={{ width: `${Math.max(6, Math.round(entry.score * 100))}%` }} />
              </span>
              <span className="crmScoreValue">{Math.round(entry.score * 100)}</span>
            </div>
          ))}
        </div>
      ) : (
        <span className="crmMuted">Chưa đủ dữ liệu</span>
      )}
    </div>
  );
}

export default function CustomerDetailPage() {
  const { user, accountLoading } = useStore();
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/customers/${params.id}`, { cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Không thể tải hồ sơ khách hàng.");
      setData(result as Data);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : "Lỗi kết nối.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (user?.role === "admin") void load();
  }, [user?.role, load]);

  if (accountLoading || (user?.role === "admin" && !data && !error)) {
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
          <h2>Khu vực quản trị bị hạn chế</h2>
          <p>Yêu cầu tài khoản quản trị để xem chi tiết khách hàng.</p>
          <Link className="antBtn antBtnPrimary" href={`/login?next=/admin/customers/${params.id ?? ""}`}>
            Đăng nhập quản trị
          </Link>
        </div>
      </section>
    );
  }

  if (!data?.customer) {
    return (
      <div className="antAdminPageContainer">
        <div className="antCard">
          <div className="antEmptyState large">
            <UserOutlined style={{ fontSize: 44, color: "#8c8c8c" }} />
            <h3>Không tìm thấy khách hàng</h3>
            <p>{error || "Khách hàng có thể đã bị xóa hoặc liên kết không hợp lệ."}</p>
            <div className="antHeaderActionGroup">
              <button type="button" className="antBtn antBtnDefault" onClick={() => void load()}>
                <ReloadOutlined /> Thử lại
              </button>
              <Link className="antBtn antBtnPrimary" href="/admin/customers">
                Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const c = data.customer;
  const orders: any[] = c.orders ?? [];
  const addresses: any[] = c.addresses ?? [];
  const wishlist: any[] = c.wishlist ?? [];
  const affinities: any[] = c.affinities ?? [];
  const tryOns: any[] = c.tryOns ?? [];
  const assessments: any[] = c.assessments ?? [];
  const profile = c.styleProfile;

  const paidOrders = orders.filter((o) => o.paymentStatus === "paid" && o.status !== "cancelled");
  const activeOrders = orders.filter((o) => ["processing", "confirmed", "shipping"].includes(o.status));
  const avgScore = assessments.length
    ? Math.round(assessments.reduce((s, x) => s + (Number(x.overallScore) || 0), 0) / assessments.length)
    : 0;
  const acceptedTryOns = tryOns.filter((t) => t.accepted === true).length;
  const segment =
    c.lifetimeValue >= 5_000_000
      ? { label: "Khách VIP", tone: "purple" as const }
      : paidOrders.length > 0
      ? { label: "Đã mua hàng", tone: "success" as const }
      : orders.length > 0
      ? { label: "Có đơn, chưa thanh toán", tone: "warning" as const }
      : { label: "Chưa phát sinh đơn", tone: "default" as const };

  const confidence = profile ? Math.round((Number(profile.confidence) || 0) * 100) : 0;
  const avoid = profile ? toStringList(profile.avoidAttributes) : [];

  async function copyId() {
    try {
      await navigator.clipboard.writeText(c.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable on http */
    }
  }

  return (
    <div className="antAdminPageContainer">
      <div className="antBreadcrumb">
        <Link href="/admin">Trang chủ</Link>
        <span className="antBreadcrumbSeparator">/</span>
        <Link href="/admin/customers">Khách hàng CRM</Link>
        <span className="antBreadcrumbSeparator">/</span>
        <span className="antBreadcrumbCurrent">{c.name}</span>
      </div>

      {/* Profile hero */}
      <section className="crmHero">
        <div className="crmHeroMain">
          <div className="crmAvatarLg">{initials(c.name)}</div>
          <div className="crmHeroText">
            <div className="crmHeroTitleRow">
              <h1 className="antPageTitle">{c.name}</h1>
              <ToneTag tone={segment.tone}>{segment.label}</ToneTag>
            </div>
            <div className="crmContactRow">
              <span><MailOutlined /> {c.email}</span>
              <span><PhoneOutlined /> {c.phone || <em className="crmMuted">Chưa có SĐT</em>}</span>
              <span><CalendarOutlined /> Tham gia {dateFmt.format(new Date(c.createdAt))}</span>
              <button type="button" className="crmIdChip" onClick={() => void copyId()} title="Sao chép mã khách hàng">
                <CopyOutlined /> {copied ? "Đã sao chép" : c.id}
              </button>
            </div>
          </div>
        </div>
        <div className="antHeaderActionGroup">
          <button type="button" className="antBtn antBtnDefault" onClick={() => void load()} disabled={loading}>
            <ReloadOutlined spin={loading} /> Làm mới
          </button>
          <Link className="antBtn antBtnDefault" href="/admin/customers">
            <ArrowLeftOutlined /> Danh sách khách
          </Link>
        </div>
      </section>

      {/* KPI cards */}
      <div className="antStatCardsGrid">
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">Tổng chi tiêu (LTV)</span>
            <div className="antStatIconWrap green"><DollarCircleOutlined /></div>
          </div>
          <div className="antStatValue greenText">{formatPrice(c.lifetimeValue)}</div>
          <div className="antStatFooter">
            <span>Từ {paidOrders.length} đơn đã thanh toán</span>
          </div>
        </div>
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">Đơn hàng</span>
            <div className="antStatIconWrap blue"><ShoppingOutlined /></div>
          </div>
          <div className="antStatValue">{orders.length}</div>
          <div className="antStatFooter">
            {activeOrders.length ? (
              <ToneTag tone="processing">{activeOrders.length} đơn đang xử lý</ToneTag>
            ) : (
              <span>Không có đơn đang mở</span>
            )}
          </div>
        </div>
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">Thử đồ AI</span>
            <div className="antStatIconWrap cyan"><ExperimentOutlined /></div>
          </div>
          <div className="antStatValue">{tryOns.length}</div>
          <div className="antStatFooter">
            <span>{acceptedTryOns} lần khách hài lòng</span>
          </div>
        </div>
        <div className="antStatCard">
          <div className="antStatCardHeader">
            <span className="antStatLabel">Điểm stylist TB</span>
            <div className="antStatIconWrap purple"><RobotOutlined /></div>
          </div>
          <div className="antStatValue">{avgScore ? <>{avgScore}<small className="crmStatUnit">/100</small></> : "—"}</div>
          <div className="antStatFooter">
            <span>{assessments.length ? `${assessments.length} lượt đánh giá` : "Chưa có đánh giá"}</span>
          </div>
        </div>
      </div>

      <div className="crmLayout">
        {/* LEFT column */}
        <div className="crmColMain">
          <div className="antCard">
            <div className="antCardHead">
              <div>
                <div className="antCardEyebrow">Lịch sử giao dịch</div>
                <h2 className="antCardTitle">
                  Đơn hàng <span className="antCountTag">{orders.length}</span>
                </h2>
              </div>
              <ShoppingOutlined style={{ fontSize: 18, color: "#1677ff" }} />
            </div>
            {orders.length ? (
              <div className="antTableContainer">
                <table className="antTable">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Sản phẩm</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: "right" }}>Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 10).map((o) => {
                      const qty = (o.items ?? []).reduce((s: number, i: any) => s + (i.quantity || 0), 0);
                      return (
                        <tr key={o.id}>
                          <td>
                            <Link href={`/admin/orders/${o.id}`} className="antOrderId">#{o.id}</Link>
                            <small className="antSubDate">{dateTimeFmt.format(new Date(o.createdAt))}</small>
                          </td>
                          <td>
                            <span className="crmCellTitle">{o.items?.[0]?.productName ?? "—"}</span>
                            <small className="antSubDate">
                              {qty} sản phẩm{(o.items?.length ?? 0) > 1 ? ` · +${o.items.length - 1} mẫu khác` : ""}
                            </small>
                          </td>
                          <td>
                            <StatusTag kind="payment" value={o.paymentStatus} />
                            <small className="antSubDate">{paymentMethodLabel(o.payment)}</small>
                          </td>
                          <td><StatusTag kind="order" value={o.status} /></td>
                          <td style={{ textAlign: "right" }}>
                            <strong className="antPrice">{formatPrice(o.total)}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="antEmptyState">
                <ShoppingOutlined style={{ fontSize: 30, color: "#bfbfbf" }} />
                <p>Khách hàng chưa đặt đơn nào.</p>
              </div>
            )}
          </div>

          <div className="antCard">
            <div className="antCardHead">
              <div>
                <div className="antCardEyebrow">Chân dung phong cách</div>
                <h2 className="antCardTitle">Gu thời trang đã học</h2>
              </div>
              <ThunderboltOutlined style={{ fontSize: 18, color: "#fa8c16" }} />
            </div>
            <div className="antCardBody">
              {profile ? (
                <>
                  <div className="crmConfidence">
                    <div className="crmConfidenceHead">
                      <span>Độ tin cậy hồ sơ</span>
                      <strong>{confidence}%</strong>
                    </div>
                    <div className="crmProgress">
                      <span style={{ width: `${confidence}%` }} />
                    </div>
                    <small className="crmMuted">
                      Học từ {profile.eventCount ?? 0} tín hiệu tương tác
                      {profile.lastLearnedAt ? ` · cập nhật ${dateTimeFmt.format(new Date(profile.lastLearnedAt))}` : ""}
                    </small>
                  </div>

                  <div className="crmScoreGrid">
                    <ScoreGroup title="Danh mục yêu thích" entries={toScoreEntries(profile.preferredCategories)} tone="blue" />
                    <ScoreGroup title="Kiểu trang phục" entries={toScoreEntries(profile.preferredTypes)} tone="purple" />
                    <ScoreGroup title="Gam màu ưu tiên" entries={toScoreEntries(profile.preferredColors)} tone="orange" />
                    <ScoreGroup title="Phong cách" entries={toScoreEntries(profile.preferredStyles)} tone="green" />
                    <ScoreGroup title="Dịp mặc" entries={toScoreEntries(profile.preferredOccasions)} tone="cyan" />
                    <ScoreGroup title="Form dáng" entries={toScoreEntries(profile.preferredFits)} tone="blue" />
                  </div>

                  <div className="crmProfileFoot">
                    <div>
                      <span className="crmMuted">Khoảng giá quan tâm</span>
                      <strong>
                        {formatPrice(profile.priceMin ?? 0)} – {formatPrice(profile.priceMax ?? 0)}
                      </strong>
                    </div>
                    <div>
                      <span className="crmMuted">Tránh đề xuất</span>
                      <div className="antTagWrap">
                        {avoid.length ? avoid.map((a) => <ToneTag key={a} tone="error">{a}</ToneTag>) : <strong>Không có</strong>}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="antEmptyState">
                  <ThunderboltOutlined style={{ fontSize: 30, color: "#bfbfbf" }} />
                  <p>Khách hàng chưa đủ lịch sử tương tác để hệ thống học gu.</p>
                </div>
              )}
            </div>
          </div>

          <div className="antCard">
            <div className="antCardHead">
              <div>
                <div className="antCardEyebrow">Hoạt động AI</div>
                <h2 className="antCardTitle">Thử đồ & đánh giá stylist</h2>
              </div>
              <ExperimentOutlined style={{ fontSize: 18, color: "#13c2c2" }} />
            </div>
            <div className="antCardBody">
              {tryOns.length || assessments.length ? (
                <div className="crmTwoList">
                  <div>
                    <div className="crmScoreGroupTitle">Phiên thử đồ gần đây</div>
                    {tryOns.length ? (
                      <ul className="crmTimeline">
                        {tryOns.slice(0, 6).map((t) => (
                          <li key={t.id}>
                            <div>
                              <strong>{Array.isArray(t.productIds) ? t.productIds.length : 0} sản phẩm</strong>
                              <small className="crmMuted">{dateTimeFmt.format(new Date(t.createdAt))}</small>
                            </div>
                            <div className="antTagWrap">
                              <StatusTag kind="tryon" value={t.status} />
                              {t.accepted === true ? <ToneTag tone="success">Hài lòng</ToneTag> : t.accepted === false ? <ToneTag tone="default">Chưa ưng</ToneTag> : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="crmMuted">Chưa có phiên thử đồ.</p>
                    )}
                  </div>
                  <div>
                    <div className="crmScoreGroupTitle">Đánh giá phối đồ</div>
                    {assessments.length ? (
                      <ul className="crmTimeline">
                        {assessments.slice(0, 6).map((a, i) => (
                          <li key={`${a.createdAt}-${i}`}>
                            <div>
                              <strong>{a.overallScore}/100</strong>
                              <small className="crmMuted">{dateTimeFmt.format(new Date(a.createdAt))}</small>
                            </div>
                            <div className="antTagWrap">
                              <ToneTag tone={a.overallScore >= 75 ? "success" : a.overallScore >= 50 ? "warning" : "error"}>
                                {a.overallScore >= 75 ? "Rất hợp" : a.overallScore >= 50 ? "Khá hợp" : "Chưa hợp"}
                              </ToneTag>
                              {a.feedback === "love" ? <ToneTag tone="purple">Khách rất thích</ToneTag>
                                : a.feedback === "accurate" ? <ToneTag tone="info">Khách thấy chuẩn</ToneTag>
                                : a.feedback === "inaccurate" ? <ToneTag tone="default">Khách thấy chưa chuẩn</ToneTag>
                                : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="crmMuted">Chưa có đánh giá.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="antEmptyState">
                  <RobotOutlined style={{ fontSize: 30, color: "#bfbfbf" }} />
                  <p>Khách chưa sử dụng phòng thử đồ AI.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <aside className="crmColSide">
          <div className="antCard">
            <div className="antCardHead">
              <div>
                <div className="antCardEyebrow">Sổ địa chỉ</div>
                <h2 className="antCardTitle">
                  Địa chỉ giao hàng <span className="antCountTag">{addresses.length}</span>
                </h2>
              </div>
              <EnvironmentOutlined style={{ fontSize: 18, color: "#1677ff" }} />
            </div>
            <div className="antCardBody">
              {addresses.length ? (
                <div className="crmAddressList">
                  {addresses.map((a) => (
                    <div key={a.id} className={`crmAddress ${a.isDefault ? "isDefault" : ""}`}>
                      <div className="crmAddressHead">
                        <strong>{a.label || "Địa chỉ"}</strong>
                        {a.isDefault ? <ToneTag tone="info">Mặc định</ToneTag> : null}
                      </div>
                      <span>{a.recipientName} · {a.phone}</span>
                      <span className="crmMuted">{a.address}, {a.city}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="crmMuted" style={{ margin: 0 }}>Chưa lưu địa chỉ nào.</p>
              )}
            </div>
          </div>

          <div className="antCard">
            <div className="antCardHead">
              <div>
                <div className="antCardEyebrow">Sản phẩm quan tâm</div>
                <h2 className="antCardTitle">Mức độ yêu thích</h2>
              </div>
              <TagOutlined style={{ fontSize: 18, color: "#1677ff" }} />
            </div>
            <div className="antCardBody">
              {affinities.length ? (
                <div className="crmProductList">
                  {affinities.slice(0, 6).map((x) => (
                    <div key={x.product.id} className="crmProductRow">
                      <div className="crmThumb">
                        {x.product.image ? <img src={x.product.image} alt={x.product.name} loading="lazy" /> : null}
                      </div>
                      <div className="crmProductInfo">
                        <strong>{x.product.name}</strong>
                        <small className="crmMuted">{labelFor(x.product.category)} · {x.product.color}</small>
                      </div>
                      <span className="crmScoreBadge">{Number(x.score).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="crmMuted" style={{ margin: 0 }}>Chưa có dữ liệu quan tâm sản phẩm.</p>
              )}
            </div>
          </div>

          <div className="antCard">
            <div className="antCardHead">
              <div>
                <div className="antCardEyebrow">Danh sách yêu thích</div>
                <h2 className="antCardTitle">
                  Wishlist <span className="antCountTag">{wishlist.length}</span>
                </h2>
              </div>
              <HeartOutlined style={{ fontSize: 18, color: "#ff4d4f" }} />
            </div>
            <div className="antCardBody">
              {wishlist.length ? (
                <div className="crmProductList">
                  {wishlist.slice(0, 8).map((p) => (
                    <div key={p.id} className="crmProductRow">
                      <div className="crmThumb">
                        {p.image ? <img src={p.image} alt={p.name} loading="lazy" /> : null}
                      </div>
                      <div className="crmProductInfo">
                        <strong>{p.name}</strong>
                      </div>
                      <strong className="antPrice greenText">{formatPrice(p.price)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="crmMuted" style={{ margin: 0 }}>Danh sách yêu thích trống.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
