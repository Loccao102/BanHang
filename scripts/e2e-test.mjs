// LSOUL end-to-end API smoke/functional test
// Chạy: npm run test:e2e   (hoặc: node scripts/e2e-test.mjs)
// Yêu cầu hệ thống đang chạy ở STORE_URL / ADMIN_URL (mặc định localhost:3000 & :3001).
import { writeFileSync, appendFileSync } from "node:fs";

const STORE = process.env.STORE_URL || "http://localhost:3000";
const ADMIN = process.env.ADMIN_URL || "http://localhost:3001";
const LOG = process.env.E2E_LOG || "e2e-results.jsonl";
const SUMMARY = process.env.E2E_SUMMARY || "e2e-results.json";
writeFileSync(LOG, "");

const results = [];
let currentSection = "";

function section(name) {
  currentSection = name;
  console.log(`\n===== ${name} =====`);
}

function record(id, name, ok, detail, extra) {
  const row = { id, section: currentSection, name, ok: !!ok, detail: detail ?? "", extra: extra ?? null };
  results.push(row);
  appendFileSync(LOG, JSON.stringify(row) + "\n");
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id} :: ${name} :: ${detail ?? ""}`);
}

async function req(method, url, { body, cookie, headers, redirect } = {}) {
  const h = { ...(headers || {}) };
  if (cookie) h["cookie"] = cookie;
  let payload;
  if (body !== undefined) {
    if (typeof body === "string") payload = body;
    else { payload = JSON.stringify(body); h["content-type"] = "application/json"; }
  }
  const started = Date.now();
  try {
    const res = await fetch(url, { method, headers: h, body: payload, redirect: redirect ?? "follow" });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, text, json, headers: res.headers, ms: Date.now() - started };
  } catch (error) {
    return { status: -1, text: String(error?.message ?? error), json: null, headers: new Headers(), ms: Date.now() - started };
  }
}

function cookieOf(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const c of raw) {
    const m = /lsoul_session=([^;]+)/.exec(c);
    if (m) return `lsoul_session=${m[1]}`;
  }
  return null;
}

const j = (v) => { try { return JSON.stringify(v); } catch { return "<unserializable>"; } };
const clip = (s, n = 220) => (typeof s === "string" ? (s.length > n ? s.slice(0, n) + "..." : s) : j(s));

// ---------------------------------------------------------------- 1. pages
section("1. TRANG STOREFRONT");
const storePages = [
  ["P-01", "/", "Trang chủ"],
  ["P-02", "/shop", "Shop"],
  ["P-03", "/cart", "Giỏ hàng"],
  ["P-04", "/checkout", "Checkout"],
  ["P-05", "/login", "Đăng nhập"],
  ["P-06", "/register", "Đăng ký"],
  ["P-07", "/forgot-password", "Quên mật khẩu"],
  ["P-08", "/reset-password", "Đặt lại mật khẩu"],
  ["P-09", "/orders", "Đơn hàng của tôi"],
  ["P-10", "/wishlist", "Yêu thích"],
  ["P-11", "/try-on", "Phòng thử đồ AI"],
  ["P-12", "/outfit", "Phối đồ"],
  ["P-13", "/size-guide", "Bảng size"],
  ["P-14", "/about", "Giới thiệu"],
  ["P-15", "/account", "Tài khoản"]
];
for (const [id, path, name] of storePages) {
  const r = await req("GET", STORE + path);
  const title = /<title>(.*?)<\/title>/.exec(r.text)?.[1] ?? "";
  record(id, name, r.status === 200, `status=${r.status} ms=${r.ms} title="${title}"`);
}

section("2. TRANG ADMIN (cổng 3001)");
const adminPages = [
  ["A-01", "/", "Admin root"],
  ["A-02", "/admin", "Dashboard"],
  ["A-03", "/admin/fulfillment", "Vận hành & giao nhận"],
  ["A-04", "/admin/customers", "Khách hàng"],
  ["A-05", "/admin/marketing", "Marketing & Social"],
  ["A-06", "/admin/analytics", "Báo cáo doanh thu"],
  ["A-07", "/admin/ai", "AI Insights"]
];
for (const [id, path, name] of adminPages) {
  const r = await req("GET", ADMIN + path);
  record(id, name, r.status === 200, `status=${r.status} ms=${r.ms}`);
}
{
  const r = await req("GET", ADMIN + "/admin/orders", { redirect: "manual" });
  const loc = r.headers.get("location") ?? "";
  record("A-08", "/admin/orders chuyển hướng sang /admin?tab=orders", (r.status === 307 || r.status === 308) && loc.includes("tab=orders"), `status=${r.status} location=${loc}`);
  const r2 = await req("GET", ADMIN + "/admin/orders/LS26DEMO001");
  record("A-09", "/admin/orders/[id] (chi tiết đơn)", r2.status === 200, `status=${r2.status}`);
}
{
  const r = await req("GET", STORE + "/admin", { redirect: "manual" });
  const loc = r.headers.get("location") ?? "";
  record("A-10", "Store /admin redirect sang :3001", (r.status === 307 || r.status === 308) && loc.includes("3001"), `status=${r.status} location=${loc}`);
  const r2 = await req("GET", ADMIN + "/shop", { redirect: "manual" });
  const loc2 = r2.headers.get("location") ?? "";
  record("A-11", "Admin /shop redirect về storefront :3000", (r2.status === 307 || r2.status === 308) && loc2.includes("3000"), `status=${r2.status} location=${loc2}`);
}

// ---------------------------------------------------------------- 3. catalog
section("3. CATALOG");
const boot = await req("GET", STORE + "/api/store/bootstrap");
const products = boot.json?.products ?? [];
const mode = boot.json?.mode;
record("C-01", "Bootstrap catalog từ PostgreSQL", boot.status === 200 && mode === "database" && products.length > 0,
  `status=${boot.status} mode=${mode} products=${products.length} ms=${boot.ms}`);
record("C-02", "100% sản phẩm analyzerReady", products.length > 0 && products.every((p) => p.analyzerReady === true),
  `analyzerReady=${products.filter((p) => p.analyzerReady).length}/${products.length}`);
{
  const broken = [];
  for (const p of products) {
    if (!p.image || !p.image.startsWith("/")) { broken.push(`${p.id}:image=${p.image}`); continue; }
    const r = await req("GET", STORE + p.image);
    if (r.status !== 200) broken.push(`${p.id}:${p.image}=${r.status}`);
  }
  record("C-03", "Toàn bộ ảnh sản phẩm tải được (200)", broken.length === 0, `ok=${products.length - broken.length}/${products.length} lỗi=${broken.length} ${clip(broken.slice(0, 5).join(", "))}`);
}
{
  const noVariant = products.filter((p) => !p.variants?.length).map((p) => p.id);
  const zeroStock = products.filter((p) => (p.stock ?? 0) <= 0).map((p) => p.id);
  record("C-04", "Mọi sản phẩm có size/variant", noVariant.length === 0, `thiếu variant=${noVariant.length} ${clip(noVariant.slice(0, 5).join(","))}`);
  record("C-05", "Tồn kho > 0 cho toàn bộ sản phẩm", zeroStock.length === 0, `hết hàng=${zeroStock.length} ${clip(zeroStock.slice(0, 5).join(","))}`);
}
{
  const r = await req("GET", STORE + "/api/products");
  record("C-06", "GET /api/products (không có GET handler)", r.status === 405 || r.status === 404, `status=${r.status}`);
}
const first = products.find((p) => p.variants?.some((v) => v.stock > 0));
const variant = first?.variants.find((v) => v.stock > 0);
record("C-07", "Chọn được sản phẩm còn hàng để test", !!first && !!variant, `product=${first?.id} size=${variant?.size} stock=${variant?.stock} price=${first?.price}`);
const PID = first.id;
const SIZE = variant.size;

// ---------------------------------------------------------------- 4. auth
section("4. XÁC THỰC / TÀI KHOẢN");
{
  const r = await req("POST", STORE + "/api/auth/login", { body: { email: "nam@lsoul.local", password: "sai-mat-khau" } });
  record("L-01", "Đăng nhập sai mật khẩu", r.status === 401, `status=${r.status} ${clip(r.json ?? r.text)}`);
}
const login = await req("POST", STORE + "/api/auth/login", { body: { email: "nam@lsoul.local", password: "Lsoul@123456" } });
const custCookie = cookieOf(login);
record("L-02", "Đăng nhập customer", login.status === 200 && !!custCookie, `status=${login.status} cookie=${!!custCookie} user=${clip(login.json?.user)}`);

const adminLogin = await req("POST", ADMIN + "/api/auth/login", { body: { email: "admin@lsoul.local", password: "Admin@123456" } });
const adminCookie = cookieOf(adminLogin);
record("L-03", "Đăng nhập admin (cổng 3001)", adminLogin.status === 200 && !!adminCookie, `status=${adminLogin.status} cookie=${!!adminCookie} role=${adminLogin.json?.user?.role}`);

{
  const r = await req("GET", STORE + "/api/auth/me", { cookie: custCookie });
  record("L-04", "/api/auth/me có session", r.status === 200, `status=${r.status} ${clip(r.json)}`);
  const r2 = await req("GET", STORE + "/api/auth/me");
  record("L-05", "/api/auth/me không session trả user=null (200)", r2.status === 200 && r2.json?.user === null, `status=${r2.status} ${clip(r2.json)}`);
}
let regEmail = `e2e${Date.now()}@lsoul.local`;
{
  const r = await req("POST", STORE + "/api/auth/register", { body: { name: "E2E User", email: regEmail, password: "E2ePass@123" } });
  record("L-06", "Đăng ký tài khoản mới", r.status === 201, `status=${r.status} ${clip(r.json)}`);
  const r2 = await req("POST", STORE + "/api/auth/register", { body: { name: "E2E User", email: regEmail, password: "E2ePass@123" } });
  record("L-07", "Đăng ký trùng email bị chặn", r2.status === 409, `status=${r2.status} ${clip(r2.json)}`);
  const r3 = await req("POST", STORE + "/api/auth/register", { body: { name: "X", email: "khong-phai-email", password: "123" } });
  record("L-08", "Đăng ký dữ liệu sai bị chặn", r3.status === 400, `status=${r3.status} ${clip(r3.json)}`);
}
{
  const r = await req("POST", STORE + "/api/auth/forgot-password", { body: { email: regEmail } });
  const resetUrl = r.json?.resetUrl ?? "";
  const token = /token=([^&]+)/.exec(resetUrl)?.[1];
  record("L-09", "Quên mật khẩu trả accepted", r.status === 200 && r.json?.accepted === true,
    `status=${r.status} resetUrl=${resetUrl ? "có" : "KHÔNG (cần PASSWORD_RESET_EXPOSE_LINK=1 khi NODE_ENV=production)"}`);
  if (token) {
    const reset = await req("POST", STORE + "/api/auth/reset-password", { body: { token: decodeURIComponent(token), password: "ResetPass@123" } });
    const relogin = await req("POST", STORE + "/api/auth/login", { body: { email: regEmail, password: "ResetPass@123" } });
    record("L-09b", "Dùng link reset để đổi mật khẩu rồi đăng nhập lại", reset.status === 200 && relogin.status === 200,
      `reset=${reset.status} login=${relogin.status} ${clip(reset.json)}`);
  }
  const r2 = await req("POST", STORE + "/api/auth/reset-password", { body: { token: "token-gia", password: "NewPass@12345" } });
  record("L-10", "Reset mật khẩu với token sai bị chặn", r2.status >= 400, `status=${r2.status} ${clip(r2.json)}`);
  const r3 = await req("POST", STORE + "/api/auth/forgot-password", { body: { email: "khong-ton-tai@lsoul.local" } });
  record("L-11", "Quên mật khẩu email không tồn tại (không lộ thông tin)", r3.status === 200 && r3.json?.accepted === true, `status=${r3.status}`);
}
{
  const r = await req("GET", STORE + "/api/account/state", { cookie: custCookie });
  record("L-12", "Account state trả dữ liệu", r.status === 200 && r.json?.authenticated === true,
    `status=${r.status} orders=${r.json?.orders?.length} cart=${r.json?.cart?.length} addresses=${r.json?.addresses?.length}`);
}

// ---------------------------------------------------------------- 5. voucher
section("5. VOUCHER (TC-01 / TC-02)");
const couponCases = [
  ["V-01", "TESTSAI", 1000000, false, null, "mã sai"],
  ["V-02", "LSOUL10", 700000, true, 70000, "10% của 700k"],
  ["V-03", "LSOUL10", 600000, false, null, "chưa đủ đơn tối thiểu 700k"],
  ["V-04", "LSOUL10", 5000000, true, 250000, "chạm trần 250k"],
  ["V-05", "WELCOME15", 1200000, true, 180000, "15% của 1.2tr"],
  ["V-06", "STYLE20", 2000000, true, 400000, "20% của 2tr"],
  ["V-07", "AI200", 1800000, true, 200000, "giảm tiền mặt 200k"],
  ["V-08", "AI200", 1700000, false, null, "chưa đủ 1.8tr"],
  ["V-09", "lsoul10", 700000, true, 70000, "không phân biệt hoa thường"],
  ["V-10", "TEST99", 1000000, false, null, "mã cũ đã bị bỏ khỏi gợi ý UI"],
  ["V-11", "TEST2K", 1000000, false, null, "mã cũ đã bị bỏ khỏi gợi ý UI"]
];
for (const [id, code, subtotal, expectOk, expectDiscount, note] of couponCases) {
  const r = await req("POST", STORE + "/api/coupons/validate", { body: { code, subtotal } });
  let ok = (r.status === 200) === expectOk;
  if (ok && expectDiscount != null) ok = r.json?.discount === expectDiscount;
  record(id, `Voucher ${code} / ${subtotal} (${note})`, ok, `status=${r.status} discount=${r.json?.discount} msg=${clip(r.json?.error)}`);
}

// ---------------------------------------------------------------- 6. cart/wishlist
section("6. GIỎ HÀNG / YÊU THÍCH");
{
  const r = await req("PUT", STORE + "/api/account/cart", { body: { items: [{ product: first, quantity: 1, size: SIZE }] }, cookie: custCookie });
  record("K-01", "PUT đồng bộ giỏ hàng", r.status === 200, `status=${r.status} ${clip(r.json)}`);
  const st = await req("GET", STORE + "/api/account/state", { cookie: custCookie });
  record("K-02", "Giỏ hàng lưu vào DB", (st.json?.cart?.length ?? 0) === 1, `cart=${st.json?.cart?.length}`);
  const r2 = await req("PUT", STORE + "/api/account/wishlist", { body: { productIds: [PID] }, cookie: custCookie });
  const st2 = await req("GET", STORE + "/api/account/state", { cookie: custCookie });
  record("K-03", "Wishlist lưu vào DB", r2.status === 200 && (st2.json?.wishlist ?? []).includes(PID), `status=${r2.status} wishlist=${st2.json?.wishlist?.length}`);
  const r3 = await req("PUT", STORE + "/api/account/cart", { body: { items: [{ product: first, quantity: 1, size: SIZE }] } });
  record("K-04", "PUT giỏ hàng không đăng nhập bị chặn", r3.status === 401, `status=${r3.status}`);
}

// ---------------------------------------------------------------- 7. orders
section("7. ĐẶT HÀNG (TC-03 / TC-04 / TC-05)");
const customer = { name: "Trần Hoàng Nam", phone: "0901234567", address: "12 Lê Lợi", city: "Hà Nội" };
{
  // Hệ thống không hỗ trợ mua hàng ẩn danh: khách vãng lai bị chặn ở bước đặt hàng.
  const r = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: PID }, quantity: 1, size: SIZE }], payment: "cod", customer } });
  record("O-01", "GUEST: đặt hàng không đăng nhập bị chặn (401)", r.status === 401, `status=${r.status} ${clip(r.json)}`);
  const r2 = await req("POST", STORE + "/api/orders", { body: { items: [], payment: "cod", customer }, cookie: custCookie });
  record("O-02", "Đặt hàng với giỏ trống bị chặn", r2.status === 400, `status=${r2.status} ${clip(r2.json)}`);
  const r3 = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: PID }, quantity: 1, size: SIZE }], payment: "cod", customer: { name: "A", phone: "1", address: "B", city: "" } }, cookie: custCookie });
  record("O-03", "Thiếu thông tin nhận hàng bị chặn", r3.status === 400, `status=${r3.status} ${clip(r3.json)}`);
}
// Đo tồn kho ngay trước khi tạo đơn để mốc so sánh luôn chính xác.
const stockBefore = (await req("GET", STORE + "/api/store/bootstrap")).json.products
  .find((p) => p.id === PID).variants.find((v) => v.size === SIZE).stock;
const cod = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: PID }, quantity: 1, size: SIZE }], payment: "cod", customer }, cookie: custCookie });
const codId = cod.json?.order?.id;
record("O-04", "TC-05: Đặt hàng COD xác nhận ngay", cod.status === 201 && cod.json?.order?.paymentStatus === "cod_pending",
  `status=${cod.status} id=${codId} paymentStatus=${cod.json?.order?.paymentStatus} total=${cod.json?.order?.total} shipping=${cod.json?.order?.shipping}`);

const qr = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: PID }, quantity: 1, size: SIZE }], payment: "qr", couponCode: "LSOUL10", customer }, cookie: custCookie });
const qrId = qr.json?.order?.id;
record("O-05", "TC-03: Đặt hàng QR + voucher LSOUL10", qr.status === 201 && qr.json?.order?.paymentStatus === "pending",
  `status=${qr.status} id=${qrId} subtotal=${qr.json?.order?.subtotal} shipping=${qr.json?.order?.shipping} discount=${qr.json?.order?.discount} total=${qr.json?.order?.total}`);
if (qr.status === 201) {
  const o = qr.json.order;
  const expectedDiscount = Math.min(Math.round(o.subtotal * 0.1), 250000);
  record("O-06", "Server tính giảm giá & tổng tiền đúng",
    o.discount === expectedDiscount && o.total === o.subtotal + o.shipping - expectedDiscount && o.shipping === 0,
    `subtotal=${o.subtotal} shipping=${o.shipping} discount=${o.discount} (kỳ vọng ${expectedDiscount}) total=${o.total}`);
}
{
  const boot2 = await req("GET", STORE + "/api/store/bootstrap");
  const p2 = boot2.json.products.find((p) => p.id === PID);
  const after = p2.variants.find((v) => v.size === SIZE).stock;
  record("O-07", "Trừ tồn kho theo size sau 2 đơn", after === stockBefore - 2, `trước=${stockBefore} sau=${after}`);
  const st = await req("GET", STORE + "/api/account/state", { cookie: custCookie });
  const stillInCart = (st.json?.cart ?? []).some((l) => l.product?.id === PID);
  record("O-08", "Giỏ hàng được xóa sau khi đặt hàng", !stillInCart, `cart=${st.json?.cart?.length}`);
}
{
  const r = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: PID }, quantity: 9999, size: SIZE }], payment: "cod", customer }, cookie: custCookie });
  record("O-09", "Đặt vượt tồn kho bị chặn (409)", r.status === 409, `status=${r.status} ${clip(r.json)}`);
  const r2 = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: PID }, quantity: 1, size: SIZE }], payment: "cod", couponCode: "TESTSAI", customer }, cookie: custCookie });
  record("O-10", "Đặt hàng với voucher không tồn tại bị chặn", r2.status === 400, `status=${r2.status} ${clip(r2.json)}`);
  const r3 = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: "khong-ton-tai" }, quantity: 1, size: "M" }], payment: "cod", customer }, cookie: custCookie });
  record("O-11", "Đặt sản phẩm không tồn tại bị chặn", r3.status === 400 || r3.status === 409, `status=${r3.status} ${clip(r3.json)}`);
}

// ---------------------------------------------------------------- 8. payment
section("8. PHÒNG CHỜ THANH TOÁN + WEBHOOK");
{
  const r = await req("GET", STORE + `/api/orders/${qrId}/payment`);
  record("Q-01", "Polling trạng thái đơn QR (chưa trả tiền)", r.status === 200 && r.json?.paymentStatus === "pending",
    `status=${r.status} paymentStatus=${r.json?.paymentStatus} total=${r.json?.total}`);
  const r2 = await req("POST", STORE + `/api/orders/${qrId}/payment`);
  record("Q-02", "Xác nhận thanh toán khi chưa đăng nhập bị chặn (401)", r2.status === 401, `status=${r2.status} ${clip(r2.json)}`);
  const other = await req("POST", STORE + "/api/auth/login", { body: { email: "linh@lsoul.local", password: "Lsoul@123456" } });
  const otherCookie = cookieOf(other);
  const r3 = await req("POST", STORE + `/api/orders/${qrId}/payment`, { cookie: otherCookie });
  record("Q-03", "Xác nhận đơn của người khác bị chặn (403)", r3.status === 403, `status=${r3.status} ${clip(r3.json)}`);
  const r4 = await req("POST", STORE + `/api/orders/${qrId}/payment`, { cookie: custCookie });
  record("Q-04", "TC-04: Nút xác nhận thanh toán local", r4.status === 200 && r4.json?.paymentStatus === "paid",
    `status=${r4.status} paymentStatus=${r4.json?.paymentStatus} orderStatus=${r4.json?.status}`);
  const r5 = await req("POST", STORE + `/api/orders/${qrId}/payment`, { cookie: custCookie });
  record("Q-05", "Xác nhận lần 2 (idempotent)", r5.status === 200 && r5.json?.paymentStatus === "paid", `status=${r5.status}`);
  const r6 = await req("GET", STORE + `/api/orders/${qrId}/payment`);
  record("Q-06", "Sau xác nhận: paid + confirmed", r6.json?.paymentStatus === "paid" && r6.json?.status === "confirmed",
    `paymentStatus=${r6.json?.paymentStatus} status=${r6.json?.status} paidAt=${r6.json?.paidAt} provider=${r6.json?.paymentProvider}`);
  const r7 = await req("GET", STORE + "/api/orders/LSKHONGTONTAI/payment");
  record("Q-07", "Đơn không tồn tại trả 404", r7.status === 404, `status=${r7.status}`);

  // Hệ thống không hỗ trợ đơn ẩn danh: đơn QR của khách vãng lai bị chặn ngay từ bước tạo.
  const guestQr = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: PID }, quantity: 1, size: SIZE }], payment: "qr", customer } });
  record("Q-08", "GUEST: không tạo được đơn QR ẩn danh (401)", guestQr.status === 401, `status=${guestQr.status} ${clip(guestQr.json)}`);
}
{
  const payload = { id: Math.floor(Math.random() * 1e9), gateway: "MB", transactionDate: "2026-10-04 10:00:00", accountNumber: "0123456789", code: codId, content: `LS ${codId}`, transferType: "in", transferAmount: 100000, referenceCode: "REF-E2E" };
  const raw = JSON.stringify(payload);
  const r = await req("POST", STORE + "/api/payments/sepay/webhook", { body: raw });
  record("W-01", "Webhook SePay không có chữ ký", r.status === 401 || r.status === 503, `status=${r.status} ${clip(r.json)}`);
  const r2 = await req("POST", STORE + "/api/payments/sepay/webhook", {
    body: raw,
    headers: { "x-sepay-signature": "sha256=gia-mao", "x-sepay-timestamp": String(Math.floor(Date.now() / 1000)) }
  });
  record("W-02", "Webhook SePay chữ ký sai", r2.status === 401 || r2.status === 503, `status=${r2.status} ${clip(r2.json)}`);

  // Cách B của checklist: webhook hợp lệ (đã ký HMAC) phải tự xác nhận đơn QR khớp số tiền.
  const { createHmac } = await import("node:crypto");
  const secret = process.env.SEPAY_WEBHOOK_SECRET || "lsoul_dev_sepay_secret";
  const payOrder = await req("POST", STORE + "/api/orders", {
    body: { items: [{ product: { id: PID }, quantity: 1, size: SIZE }], payment: "qr", customer },
    cookie: custCookie
  });
  const payOrderId = payOrder.json?.order?.id;
  const payTotal = payOrder.json?.order?.total ?? 0;
  const signedPayload = JSON.stringify({
    id: Math.floor(Math.random() * 1e9),
    gateway: "MB",
    transactionDate: new Date().toISOString().slice(0, 19).replace("T", " "),
    accountNumber: "0123456789",
    code: payOrderId,
    content: `Thanh toan don ${payOrderId}`,
    transferType: "in",
    transferAmount: payTotal,
    referenceCode: `REF-SIGNED-${Date.now()}`
  });
  const signedTs = String(Math.floor(Date.now() / 1000));
  const signedSig = "sha256=" + createHmac("sha256", secret).update(`${signedTs}.${signedPayload}`).digest("hex");
  const w3 = await req("POST", STORE + "/api/payments/sepay/webhook", {
    body: signedPayload,
    headers: { "x-sepay-signature": signedSig, "x-sepay-timestamp": signedTs }
  });
  record("W-03", "Webhook đã ký hợp lệ được chấp nhận", w3.status === 200 && w3.json?.success === true, `status=${w3.status} ${clip(w3.json)}`);
  const payAfter = await req("GET", STORE + `/api/orders/${payOrderId}/payment`);
  record("W-04", "Webhook khớp số tiền -> đơn paid qua SePay",
    payAfter.json?.paymentStatus === "paid" && payAfter.json?.paymentProvider === "sepay",
    `paymentStatus=${payAfter.json?.paymentStatus} provider=${payAfter.json?.paymentProvider} total=${payTotal}`);
}

// ---------------------------------------------------------------- 9. admin
section("9. ADMIN (TC-07 / TC-08)");
{
  const r = await req("GET", ADMIN + "/api/admin/orders");
  record("D-01", "Admin orders không đăng nhập (403)", r.status === 403, `status=${r.status}`);
  const r2 = await req("GET", ADMIN + "/api/admin/orders", { cookie: custCookie });
  record("D-02", "Customer không xem được admin orders (403)", r2.status === 403, `status=${r2.status}`);
  const r3 = await req("GET", ADMIN + "/api/admin/orders", { cookie: adminCookie });
  record("D-03", "TC-07: Admin tải danh sách đơn", r3.status === 200 && (r3.json?.orders?.length ?? 0) > 0, `status=${r3.status} orders=${r3.json?.orders?.length}`);
}
{
  const r = await req("PATCH", ADMIN + `/api/orders/${codId}`, { body: { status: "confirmed" }, cookie: adminCookie });
  record("D-04", "Admin duyệt đơn processing -> confirmed", r.status === 200, `status=${r.status} ${clip(r.json)}`);
  const r2 = await req("PATCH", ADMIN + `/api/orders/${codId}`, { body: { status: "shipping", shippingCarrier: "GHN", trackingCode: "GHN888999" }, cookie: adminCookie });
  record("D-05", "TC-08: Chuyển sang shipping + mã vận đơn", r2.status === 200, `status=${r2.status} ${clip(r2.json)}`);
  const r3 = await req("GET", ADMIN + `/api/orders/${codId}`, { cookie: adminCookie });
  record("D-06", "Đơn lưu đúng status/tracking/carrier",
    r3.json?.order?.status === "shipping" && r3.json?.order?.trackingCode === "GHN888999" && r3.json?.order?.shippingCarrier === "GHN",
    `status=${r3.json?.order?.status} carrier=${r3.json?.order?.shippingCarrier} tracking=${r3.json?.order?.trackingCode}`);
  const r4 = await req("PATCH", ADMIN + `/api/orders/${codId}`, { body: { status: "processing" }, cookie: custCookie });
  record("D-07", "Customer không đổi được trạng thái đơn (403)", r4.status === 403, `status=${r4.status}`);
  const r5 = await req("PATCH", ADMIN + `/api/orders/${codId}`, { body: { status: "shipping", shippingCarrier: "", trackingCode: "" }, cookie: adminCookie });
  record("D-08", "Xóa trắng carrier/tracking (lưu null)", r5.status === 200, `status=${r5.status}`);
  const r6 = await req("PATCH", ADMIN + `/api/orders/${codId}`, { body: { status: "shipping", trackingCode: "GHN888999" }, cookie: adminCookie });
  record("D-09", "Khôi phục mã vận đơn", r6.status === 200, `status=${r6.status}`);
}
{
  const r = await req("GET", ADMIN + "/api/admin/customers", { cookie: adminCookie });
  record("D-10", "Admin customers", r.status === 200, `status=${r.status} count=${r.json?.customers?.length}`);
  const r2 = await req("GET", ADMIN + "/api/admin/analytics", { cookie: adminCookie });
  record("D-11", "Admin analytics", r2.status === 200, `status=${r2.status} ${clip(r2.json, 200)}`);
  const r3 = await req("GET", ADMIN + "/api/admin/ai", { cookie: adminCookie });
  record("D-12", "Admin AI insights", r3.status === 200, `status=${r3.status} ${clip(r3.json, 160)}`);
  const r4 = await req("GET", ADMIN + "/api/admin/social", { cookie: adminCookie });
  record("D-13", "Admin social moderation", r4.status === 200, `status=${r4.status}`);
  const r5 = await req("GET", ADMIN + "/api/account/state", { cookie: adminCookie });
  record("D-14", "Admin account state", r5.status === 200, `status=${r5.status}`);
}
{
  const code = `E2E${Math.floor(Math.random() * 9000 + 1000)}`;
  const r = await req("POST", ADMIN + "/api/admin/coupons", { body: { code, type: "percentage", value: 5, minOrder: 100000, maxDiscount: 50000, active: true }, cookie: adminCookie });
  record("D-15", "Tạo coupon mới", r.status === 200, `status=${r.status} code=${code}`);
  const v = await req("POST", STORE + "/api/coupons/validate", { body: { code, subtotal: 500000 } });
  record("D-16", "Coupon mới dùng được ngay", v.status === 200 && v.json?.discount === 25000, `status=${v.status} discount=${v.json?.discount}`);
  const r2 = await req("PATCH", ADMIN + `/api/admin/coupons/${code}`, { body: { active: false }, cookie: adminCookie });
  const v2 = await req("POST", STORE + "/api/coupons/validate", { body: { code, subtotal: 500000 } });
  record("D-17", "Tắt coupon -> không dùng được", r2.status === 200 && v2.status === 400, `patch=${r2.status} validate=${v2.status}`);
  const r3 = await req("DELETE", ADMIN + `/api/admin/coupons/${code}`, { cookie: adminCookie });
  record("D-18", "Xóa coupon chưa dùng", r3.status === 200, `status=${r3.status} ${clip(r3.json)}`);
  const r4 = await req("POST", ADMIN + "/api/admin/coupons", { body: { code: "ab", type: "percentage", value: 5 }, cookie: adminCookie });
  record("D-19", "Tạo coupon mã không hợp lệ bị chặn", r4.status === 400, `status=${r4.status} ${clip(r4.json)}`);
  const r5 = await req("DELETE", ADMIN + "/api/admin/coupons/LSOUL10", { cookie: adminCookie });
  record("D-20", "Xóa coupon đang dùng -> chỉ vô hiệu hóa (an toàn)", r5.status === 200, `status=${r5.status} ${clip(r5.json)}`);
  if (r5.json?.disabled) {
    await req("PATCH", ADMIN + "/api/admin/coupons/LSOUL10", { body: { active: true }, cookie: adminCookie });
    record("D-21", "Bật lại LSOUL10 sau test", true, "đã khôi phục active=true");
  }
}
{
  const r = await req("PUT", ADMIN + "/api/settings", { body: { promoText: "E2E PROMO TEXT" }, cookie: adminCookie });
  const b = await req("GET", STORE + "/api/store/bootstrap");
  record("D-22", "Đổi promo text hiển thị lên storefront", r.status === 200 && b.json?.settings?.promoText === "E2E PROMO TEXT", `status=${r.status} promo=${b.json?.settings?.promoText}`);
  await req("PUT", ADMIN + "/api/settings", { body: { promoText: "NEW DROP · FREESHIP ĐƠN TỪ 699K · ĐỔI SIZE TRONG 7 NGÀY" }, cookie: adminCookie });
}
{
  const before = (await req("GET", STORE + "/api/store/bootstrap")).json.products.find((p) => p.id === PID).variants.find((v) => v.size === SIZE).stock;
  const o = await req("POST", STORE + "/api/orders", { body: { items: [{ product: { id: PID }, quantity: 1, size: SIZE }], payment: "cod", customer: { name: "Hủy Đơn", phone: "0900000000", address: "1 Test", city: "HCM" } }, cookie: custCookie });
  const id = o.json?.order?.id;
  const r = await req("PATCH", ADMIN + `/api/orders/${id}`, { body: { status: "cancelled" }, cookie: adminCookie });
  const after = (await req("GET", STORE + "/api/store/bootstrap")).json.products.find((p) => p.id === PID).variants.find((v) => v.size === SIZE).stock;
  record("D-23", "Hủy đơn hoàn kho", r.status === 200 && r.json?.restocked === true && after === before, `status=${r.status} restocked=${r.json?.restocked} tồn trước=${before} sau=${after}`);
  const r2 = await req("PATCH", ADMIN + `/api/orders/${id}`, { body: { status: "processing" }, cookie: adminCookie });
  record("D-24", "Không mở lại được đơn đã hủy (409)", r2.status === 409, `status=${r2.status} ${clip(r2.json)}`);
}

// ---------------------------------------------------------------- 10. chat
section("10. TRỢ LÝ AI (TC-10)");
{
  const t0 = Date.now();
  const r = await req("POST", STORE + "/api/chat", { body: { message: "Cho tôi xin mã giảm giá với" } });
  const txt = r.json?.message ?? "";
  const couponActions = (r.json?.actions ?? []).filter((a) => a.type === "apply_coupon");
  const hasCoupon = /LSOUL10|WELCOME15|STYLE20|AI200/.test(txt) || couponActions.length > 0;
  record("X-01", "TC-10a: Hỏi mã giảm giá -> liệt kê mã + nút áp nhanh", r.status === 200 && hasCoupon,
    `status=${r.status} ms=${Date.now() - t0} cóMã=${hasCoupon} nútÁp=${couponActions.map((a) => a.code).join(",") || "không"} msg="${clip(txt, 160)}"`);
  const r2 = await req("POST", STORE + "/api/chat", { body: { message: "Tôi muốn tìm đầm dự tiệc màu đỏ sang trọng" } });
  const reds = (r2.json?.products ?? []).filter((p) => /đỏ|red/i.test(p.color + " " + p.colorFamily));
  record("X-02", "TC-10b: Tìm đầm đỏ dự tiệc", r2.status === 200 && (r2.json?.products?.length ?? 0) > 0,
    `status=${r2.status} sản phẩm=${r2.json?.products?.length} đỏ=${reds.length} tên=${clip((r2.json?.products ?? []).map((p) => p.name).join(" | "), 200)}`);
  const r3 = await req("POST", STORE + "/api/chat", { body: { message: "Tư vấn size cho người cao 1m65 nặng 52kg" } });
  record("X-03", "Chat tư vấn size", r3.status === 200, `status=${r3.status} msg="${clip(r3.json?.message, 120)}"`);
  const r4 = await req("POST", STORE + "/api/chat", { body: { message: "Đơn hàng của tôi đang giao chưa?" }, cookie: custCookie });
  record("X-04", "Chat hỏi đơn hàng (đã đăng nhập, lưu hội thoại)", r4.status === 200 && r4.json?.persisted === true,
    `status=${r4.status} conversationId=${r4.json?.conversationId} msg="${clip(r4.json?.message, 120)}"`);
  const r5 = await req("GET", STORE + "/api/chat/conversations", { cookie: custCookie });
  record("X-05", "Lịch sử hội thoại AI", r5.status === 200 && (r5.json?.conversations?.length ?? 0) > 0, `status=${r5.status} conversations=${r5.json?.conversations?.length}`);
  const r6 = await req("POST", STORE + "/api/chat", { body: { message: "" } });
  record("X-06", "Chat tin nhắn rỗng bị chặn", r6.status === 400, `status=${r6.status}`);
  const r7 = await req("POST", STORE + "/api/chat", { body: { message: "x".repeat(2500) } });
  record("X-07", "Chat tin nhắn >2000 ký tự bị chặn", r7.status === 400, `status=${r7.status}`);
  const r8 = await req("GET", STORE + "/api/chat/conversations");
  record("X-08", "Lịch sử hội thoại khi chưa đăng nhập (401)", r8.status === 401, `status=${r8.status}`);
}

// ---------------------------------------------------------------- 11. account
section("11. TÀI KHOẢN / ĐỊA CHỈ");
{
  const r = await req("GET", STORE + "/api/account/addresses", { cookie: custCookie });
  record("N-01", "Danh sách địa chỉ", r.status === 200, `status=${r.status} count=${r.json?.addresses?.length}`);
  const r2 = await req("POST", STORE + "/api/account/addresses", { body: { label: "E2E", recipientName: "Trần Hoàng Nam", phone: "0901234567", address: "99 Nguyễn Huệ", city: "HCM", isDefault: false }, cookie: custCookie });
  const addrId = r2.json?.address?.id;
  record("N-02", "Thêm địa chỉ", r2.status === 201 && !!addrId, `status=${r2.status} id=${addrId}`);
  const r3 = await req("PATCH", STORE + `/api/account/addresses/${addrId}`, { body: { isDefault: true }, cookie: custCookie });
  record("N-03", "Sửa địa chỉ (đặt mặc định)", r3.status === 200, `status=${r3.status}`);
  const st = await req("GET", STORE + "/api/account/state", { cookie: custCookie });
  const def = (st.json?.addresses ?? []).filter((a) => a.isDefault);
  record("N-04", "Chỉ có 1 địa chỉ mặc định", def.length === 1, `mặc định=${def.length}`);
  const r4 = await req("POST", STORE + "/api/account/addresses", { body: { label: "Thiếu", recipientName: "", phone: "", address: "", city: "" }, cookie: custCookie });
  record("N-05", "Thêm địa chỉ thiếu dữ liệu bị chặn", r4.status === 400, `status=${r4.status}`);
  const r5 = await req("DELETE", STORE + `/api/account/addresses/${addrId}`, { cookie: custCookie });
  record("N-06", "Xóa địa chỉ", r5.status === 200, `status=${r5.status}`);
  const r6 = await req("PATCH", STORE + "/api/account/profile", { body: { name: "Trần Hoàng Nam", phone: "0901234567" }, cookie: custCookie });
  record("N-07", "Cập nhật hồ sơ", r6.status === 200, `status=${r6.status} ${clip(r6.json)}`);
  const r7 = await req("PATCH", STORE + "/api/account/password", { body: { currentPassword: "sai-mat-khau", newPassword: "Abc@123456" }, cookie: custCookie });
  record("N-08", "Đổi mật khẩu với mật khẩu cũ sai bị chặn", r7.status >= 400, `status=${r7.status} ${clip(r7.json)}`);
  const r8 = await req("PATCH", STORE + "/api/account/password", { body: { currentPassword: "Lsoul@123456", newPassword: "123" }, cookie: custCookie });
  record("N-09", "Đổi mật khẩu mới quá ngắn bị chặn", r8.status >= 400, `status=${r8.status}`);
  const login2 = await req("POST", STORE + "/api/auth/login", { body: { email: "linh@lsoul.local", password: "Lsoul@123456" } });
  record("N-10", "Tài khoản demo khác vẫn đăng nhập được (mật khẩu không bị đổi)", login2.status === 200, `status=${login2.status}`);
}

// ---------------------------------------------------------------- 12. try-on
section("12. PHÒNG THỬ ĐỒ AI");
{
  const r = await req("POST", STORE + "/api/tryon", { body: { productIds: [PID] }, cookie: custCookie });
  record("T-01", "Try-on thiếu ảnh người bị chặn", r.status === 400, `status=${r.status} ${clip(r.json)}`);
  const r2 = await req("POST", STORE + "/api/tryon", { body: { modelImage: "data:image/png;base64,AAAA", productIds: ["khong-ton-tai"] }, cookie: custCookie });
  record("T-02", "Try-on sản phẩm không tồn tại bị chặn", r2.status === 400, `status=${r2.status} ${clip(r2.json)}`);
  const r3 = await req("POST", STORE + "/api/tryon", { body: { modelImage: "khong-phai-anh", productIds: [PID] }, cookie: custCookie });
  record("T-03", "Try-on ảnh không hợp lệ bị chặn", r3.status === 400, `status=${r3.status}`);
  const r4 = await req("POST", STORE + "/api/tryon/feedback", { body: {} });
  record("T-04", "Try-on feedback thiếu dữ liệu bị chặn", r4.status >= 400, `status=${r4.status} ${clip(r4.json)}`);
  const r5 = await req("POST", STORE + "/api/tryon/assess", { body: {} });
  record("T-05", "Try-on assess thiếu dữ liệu bị chặn", r5.status >= 400, `status=${r5.status} ${clip(r5.json)}`);
}

// ---------------------------------------------------------------- 13. analytics/social
section("13. ANALYTICS / SOCIAL");
{
  const r = await req("POST", STORE + "/api/analytics/events", { body: { type: "product_view", productId: PID, source: "storefront" }, cookie: custCookie });
  record("E-01", "Ghi nhận hành vi người dùng", r.status === 200 && r.json?.recorded === true, `status=${r.status} ${clip(r.json)}`);
  const r2 = await req("POST", STORE + "/api/analytics/events", { body: { type: "loai-khong-hop-le" } });
  record("E-02", "Loại hành vi sai bị chặn", r2.status === 400, `status=${r2.status}`);
  const r3 = await req("POST", STORE + "/api/analytics/events", { body: { type: "product_view", productId: "khong-ton-tai" } });
  record("E-03", "Hành vi với sản phẩm sai bị chặn", r3.status === 404, `status=${r3.status}`);
  const r4 = await req("GET", STORE + "/api/analytics/profile", { cookie: custCookie });
  record("E-04", "Style profile", r4.status === 200, `status=${r4.status} ${clip(r4.json, 120)}`);
  const r5 = await req("GET", STORE + "/api/social/posts");
  record("E-05", "Social posts", r5.status === 200, `status=${r5.status} posts=${r5.json?.posts?.length}`);
  const r6 = await req("POST", STORE + "/api/social/events", { body: { type: "view", channel: "web" } });
  record("E-06", "Ghi nhận social event", r6.status === 200 && r6.json?.saved === true, `status=${r6.status}`);
  const r7 = await req("POST", STORE + "/api/social/events", { body: {} });
  record("E-07", "Social event thiếu dữ liệu bị chặn", r7.status === 400, `status=${r7.status}`);
}

// ---------------------------------------------------------------- 14. logout
section("14. ĐĂNG XUẤT");
{
  const r = await req("POST", STORE + "/api/auth/logout", { cookie: custCookie });
  record("Z-01", "Đăng xuất trả 200", r.status === 200, `status=${r.status}`);
  const r2 = await req("GET", STORE + "/api/auth/me", { cookie: custCookie });
  record("Z-02", "Sau đăng xuất: /api/auth/me trả user=null", r2.status === 200 && r2.json?.user === null, `status=${r2.status} ${clip(r2.json)}`);
  const r3 = await req("GET", STORE + "/api/account/state", { cookie: custCookie });
  record("Z-03", "Không truy cập được dữ liệu tài khoản sau đăng xuất", r3.status === 401, `status=${r3.status}`);
}

// ---------------------------------------------------------------- summary
const pass = results.filter((r) => r.ok).length;
const fail = results.filter((r) => !r.ok);
console.log("\n==================== TỔNG KẾT ====================");
console.log(`TOTAL=${results.length} PASS=${pass} FAIL=${fail.length}`);
for (const f of fail) console.log(`  FAIL ${f.id} | ${f.name} | ${f.detail}`);
writeFileSync(SUMMARY, JSON.stringify({ total: results.length, pass, fail: fail.length, results }, null, 2));
console.log(`\nĐã lưu: ${SUMMARY}`);
