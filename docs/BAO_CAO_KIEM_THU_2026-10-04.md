# BÁO CÁO KIỂM THỬ HỆ THỐNG LSOUL

**Ngày kiểm thử:** 04/10/2026
**Phiên bản:** v0.3.0 (nhánh hiện tại, commit `32cd894`)
**Môi trường:** Docker Compose (Next.js 16.3.8 production) — Storefront `http://localhost:3000`, Admin `http://localhost:3001`, PostgreSQL 16
**Phạm vi:** 137 test case tự động (HTTP/API + tài nguyên tĩnh) + kiểm tra mã nguồn cho các luồng UI không thể test bằng API

---

## 1. KẾT LUẬN NHANH

| Chỉ số | Kết quả |
| :--- | :--- |
| Tổng test case | **137** |
| Đạt | **134** |
| Không đạt (kỳ vọng của bộ test) | 3 — trong đó **0 lỗi hệ thống thật** (2 do quy ước API, 1 do route không tồn tại) |
| Lỗi/thiếu sót phát hiện thêm bằng phân tích mã + kiểm tra ngoài | **10 vấn đề thực tế** (2 mức nghiêm trọng, 5 mức trung bình, 3 mức nhỏ) |

**Tóm tắt:** các luồng nghiệp vụ chính (catalog, tài khoản, giỏ hàng, voucher, đặt hàng COD/VietQR, xác nhận thanh toán, quản trị đơn/kho/coupon/khách hàng/analytics, trợ lý AI) **chạy ổn định, tính toán đúng, phân quyền đúng**. Các thiếu sót tập trung vào: **script npm không chạy được trên Windows**, **khách vãng lai không đặt hàng được (trái tài liệu)**, **webhook SePay chưa cấu hình**, **quên mật khẩu không có kênh gửi**, **chatbot không gợi ý mã giảm giá**, **try-on phụ thuộc quota Hugging Face đã hết**.

---

## 2. CÁCH THỨC VÀ PHẠM VI KIỂM THỬ

- Bộ test tự động 137 case gọi trực tiếp API/HTTP của hệ thống đang chạy trong Docker (đúng môi trường mà `TESTING_CHECKLIST.md` mô tả).
- Kiểm tra kèm: build production (`npm run build`), typecheck (`npx tsc --noEmit`), phân tích mã các luồng UI (checkout, stepper, admin fulfillment, chat agent), kiểm tra ảnh bằng `sharp`, kiểm tra API Gemini/VietQR/Hugging Face trực tiếp.
- Đối chiếu 10 test case TC-01 → TC-10 trong `TESTING_CHECKLIST.md`.
- Script test có thể chạy lại: `C:\Users\Admin\AppData\Local\Temp\lsoul-e2e.mjs` (kết quả JSON: `lsoul-e2e-summary.json`).

---

## 3. ĐỐI CHIẾU 10 TEST CASE TRONG TESTING_CHECKLIST

| ID | Nội dung | Kết quả | Ghi chú |
| :---: | :--- | :---: | :--- |
| TC-01 | Nhập `TESTSAI` → báo lỗi đỏ, không F5 | ✅ ĐẠT | API trả 400 đúng thông báo; nút "Áp dụng" là `type="button"`, ô nhập chặn Enter bằng `preventDefault()` → không reload |
| TC-02 | Nhập `LSOUL10` → giảm 10% | ✅ ĐẠT | Giảm 250.000đ trên đơn 2.750.000đ (chạm trần), công thức client và server trùng nhau |
| TC-03 | Chọn VietQR → hiện QR, chờ thanh toán | ✅ ĐẠT | Mã QR `img.vietqr.io` trả PNG 68 KB; trạng thái `pending` |
| TC-04 | Nút xác nhận thanh toán local | ✅ ĐẠT | Chuyển `paid` + `confirmed`, gọi lại idempotent |
| TC-05 | COD xác nhận tức thì | ✅ ĐẠT | `paymentStatus=cod_pending`, trừ kho ngay |
| TC-06 | Stepper 4 bước, tách dòng title/desc | ✅ ĐẠT | `trackerStepLabel` và `trackerStepDesc` là 2 `div` riêng, CSS `flex-direction: column; gap: 5px` (nhãn chữ khác checklist, xem mục 4.10) |
| TC-07 | Admin dashboard không lỗi React #310 | ✅ ĐẠT | 7 trang admin tải 200; tất cả hook đều gọi trước mọi `return` sớm → không có nguy cơ #310 |
| TC-08 | Đổi trạng thái sang shipping + mã vận đơn | ✅ ĐẠT | `GHN888999` lưu đúng; hủy đơn hoàn kho đúng; không mở lại được đơn đã hủy |
| TC-09 | 28 ảnh flat-lay sắc nét, tỷ lệ 3:4 | ⚠️ ĐẠT MỘT PHẦN | 97/97 ảnh tải được, đều ≥ 800px (không mờ); **nhưng tỷ lệ không đồng nhất** (xem 4.8) |
| TC-10 | AI chat trả mã giảm giá + gợi ý đầm đỏ | ⚠️ ĐẠT MỘT PHẦN | Tìm đầm đỏ: **đúng 5/5 mẫu đỏ**; hỏi mã giảm giá: **KHÔNG liệt kê mã, không có nút áp nhanh** (xem 4.5) |

---

## 4. LỖI VÀ THIẾU SÓT PHÁT HIỆN

### 🔴 MỨC 1 — Cần xử lý trước khi demo/nộp

#### 4.1. Toàn bộ script npm dùng `npx.cmd` bị lỗi trên Windows + Node 24
**Hiện tượng:** các lệnh trong README đều thoát mã 1, không có thông báo lỗi:
```
npm run db:setup    → exit 1
npm run db:seed     → exit 1
npm run db:generate → exit 1
npm run db:catalog  → exit 1
npm run postinstall → exit 1   (⇒ npm install trên máy mới cũng lỗi hook này)
```
**Nguyên nhân:** `scripts/prisma-generate.mjs`, `db-setup.mjs`, `db-seed.mjs`, `db-catalog-sync.mjs` gọi
`spawnSync("npx.cmd", args, { stdio: "inherit" })` **không có `shell: true`**. Từ Node ≥ 20.12/22/24, `spawnSync` với file `.cmd` ném `EINVAL`:
```
node -e "…spawnSync('npx.cmd',['--version'],{stdio:'inherit'})"  →  status null, error EINVAL
```
**Ảnh hưởng:** phá vỡ hướng dẫn "Cách 2 – Chạy Next.js local" và "Cách 3" trong README, và `run-first-time.bat` (gọi `npm install` → `postinstall` lỗi ⇒ Prisma Client có thể không được generate). Đường Docker **không** bị ảnh hưởng vì trong container là Linux (`npx`, không `.cmd`).
**Cách sửa (1 dòng/script):** `spawnSync(npx, args, { stdio: "inherit", env, shell: true })`, hoặc gọi trực tiếp `process.execPath` + `node_modules/prisma/build/index.js` / `node_modules/tsx/dist/cli.mjs`.

#### 4.2. Khách vãng lai KHÔNG thể đặt hàng (trái với tài liệu)
**Hiện tượng:** `POST /api/orders` không có session → `401 {"error":"Vui lòng đăng nhập để thanh toán đơn hàng."}`; trang `/checkout` chặn bằng màn hình "Đăng nhập để thanh toán" và `router.push("/login?next=/checkout")`.
**Trái với:**
- `TESTING_CHECKLIST.md` §1: tài khoản "**Khách vãng lai** – Không cần đăng nhập – Kiểm thử mua hàng nhanh không cần tài khoản"; Kịch bản 2 bước 1 yêu cầu điền thông tin giao hàng mà không nhắc đăng nhập.
- `docs/USE_CASES.md`: A02 "Khách truy cập" là **chuyên biệt của** A01 "Người dùng mua sắm"; UC26 (Đặt hàng), UC27 (Chọn phương thức thanh toán), UC28 (Thanh toán VietQR) đều ghi actor "Người dùng mua sắm".
**Hướng xử lý:** hoặc cho phép guest checkout (`userId = null` đã được schema hỗ trợ sẵn — `Order.userId String?`), hoặc sửa lại checklist + Use Case cho khớp thực tế.

#### 4.3. Webhook SePay không hoạt động với cấu hình mặc định
`SEPAY_WEBHOOK_SECRET` trong `.env`/`.env.example` để trống → mọi request webhook trả:
```
POST /api/payments/sepay/webhook → 503 {"success":false,"message":"Webhook secret not configured"}
```
⇒ "Cách B – Test webhook ngân hàng qua Localtunnel" trong Kịch bản 2 **không thể chạy**. Cần điền secret và ký HMAC `sha256=<hmac(timestamp.rawBody)>` kèm header `x-sepay-signature`, `x-sepay-timestamp` (timestamp lệch ≤ 300 s).

#### 4.4. Chức năng "Quên mật khẩu" không có kênh gửi link
- Không tồn tại bất kỳ mã gửi email/SMS nào trong `src/` (không nodemailer/SMTP/API mail).
- `POST /api/auth/forgot-password` chỉ trả `resetUrl` khi `NODE_ENV !== "production"`; trong Docker (`NODE_ENV=production`) URL bị ẩn ⇒ **người dùng thật không bao giờ nhận được link đặt lại mật khẩu**.
- Đã kiểm chứng: tài liệu/UI có trang `/reset-password` và API `reset-password` hoạt động đúng (token sai bị chặn 400), nhưng token không có đường tới tay người dùng.
**Hướng xử lý:** tích hợp email (SMTP/Resend) hoặc ít nhất ghi log/trả link trong môi trường demo và ghi rõ trong tài liệu.

---

### 🟠 MỨC 2 — Lỗi chức năng / độ bền

#### 4.5. TC-10a không đạt: chatbot không gợi ý mã giảm giá và không có nút áp nhanh
Thực tế đo được (2 cách hỏi khác nhau):
```
"Cho tôi xin mã giảm giá với"  → actions: [], sản phẩm: 5, nội dung: chính sách freeship/đổi trả, KHÔNG có LSOUL10/WELCOME15
"Có mã giảm giá nào không?"    → actions: [], tương tự
```
**Nguyên nhân:** `src/lib/server/chat-agent.ts` chỉ sinh action `apply_coupon` khi **người dùng gõ đúng mã** (`couponTokens` khớp `coupons[].code`), không có nhánh "khách hỏi xin mã" ⇒ không bao giờ liệt kê/đề xuất mã.
**Hướng xử lý:** thêm nhánh intent "xin mã/ưu đãi" → trả danh sách coupon `active` (code, điều kiện, hạn mức) + action `apply_coupon` để widget hiện nút bấm nhanh.

#### 4.6. Model fallback của Gemini đã chết
Code thử lần lượt: `gemini-flash-latest` (thinkingBudget 0) → `gemini-flash-latest` → **`gemini-2.5-flash-lite`**.
Kiểm tra trực tiếp với API key trong `.env` (2 dòng đầu là model mà code đang dùng, dòng 3 là phép thử thêm):
```
gemini-flash-latest    → 200 OK            (đang dùng – tốt)
gemini-2.5-flash-lite  → 404 "This model … is no longer available to new users"   (đang dùng làm fallback – HỎNG)
gemini-2.0-flash       → 404 "… no longer available. Please update your code to use models/gemini-3.8-flash"
```
Model khả dụng với key này (trích `ListModels`): `gemini-flash-latest`, `gemini-flash-lite-latest`, `gemini-2.5-flash`, `gemini-3.8-flash`, …
Trong lúc test cũng gặp thật `503 UNAVAILABLE` của model chính ⇒ khi đó chat **âm thầm rơi về câu trả lời mẫu** (rule-based) mà không báo gì.
**Hướng xử lý:** đổi fallback sang `gemini-flash-lite-latest` / `gemini-3.8-flash` (danh sách model khả dụng đã liệt kê từ `ListModels`).

#### 4.7. Phòng thử đồ AI đang không tạo được ảnh (phụ thuộc hạn mức Hugging Face)
Gọi thật `POST /api/tryon` với ảnh người + sản phẩm trong catalog → `502`:
```
IDM-VTON failed; falling back to FASHN: You have exceeded your free ZeroGPU quota (60s requested vs. 81s left). Try again in 0:41:09
VTON failed; attempting Gemini Try-On fallback: Error: You have exceeded your ZeroGPU runs limit.
```
- Chuỗi fallback đã được code đúng: IDM-VTON → FASHN API → HF FASHN → Gemini → (báo lỗi 502 thân thiện).
- `FASHN_API_KEY` trống nên bỏ qua nhánh FASHN; HF free ZeroGPU đã hết quota.
- Dữ liệu sản phẩm **đầy đủ** cho try-on: `97/97` sản phẩm có `tryOnImage`, `tryOnCategory`.

#### 4.8. Ảnh catalog không đồng nhất tỷ lệ khung (TC-09 chỉ đạt một phần)
Thống kê 87 ảnh trong `public/products` (đo bằng `sharp`):

| Tỷ lệ (rộng/cao) | Số ảnh | Ghi chú |
| :--- | :--- | :--- |
| 0.747 (≈3:4) | 45 | chuẩn theo checklist |
| 1.000 (1:1, 1024×1024) | 21 | không phải 3:4 |
| 0.667 (2:3) | 12 | không phải 3:4 |
| Khác (0.684 / 0.714 / 0.751 / 0.798 / 0.8 / 0.832 / 0.971 / 1.25 / 1.501) | 9 | lệch rõ |

Độ nét đạt (tất cả ≥ 800 px chiều rộng, không ảnh vỡ). Ngoài ra catalog hiện có **97 sản phẩm / 83 ảnh riêng biệt**, trong khi checklist ghi "28 mẫu mới".

#### 4.9. Chip gợi ý voucher trong checkout là mã không tồn tại
`src/app/checkout/page.tsx` hiển thị placeholder và 2 chip thử nghiệm `TEST99 (-99%)`, `TEST2K`; nhưng seed chỉ có `LSOUL10`, `WELCOME15`, `STYLE20`, `AI200` ⇒ bấm chip **luôn** báo lỗi.
```
POST /api/coupons/validate {code:"TEST99"} → 400
POST /api/coupons/validate {code:"TEST2K"} → 400
```
(Logic `isTestOrder` phía server/client cũng được viết cho mã bắt đầu bằng `TEST` — dấu vết của bộ mã test chưa được seed.)

#### 4.10. `run-first-time.bat` in sai tài khoản admin
File in ra `admin@lsoul.com` trong khi tài khoản thật là `admin@lsoul.local` (đúng như README và CHECKLIST) ⇒ người dùng chạy 1-click sẽ không đăng nhập được.

---

### 🟡 MỨC 3 — Nhỏ / quy ước

| # | Vấn đề | Chi tiết |
| :--- | :--- | :--- |
| 4.11 | `GET /api/auth/me` trả `200 {"user":null}` thay vì 401 | Lệch quy ước REST (2 test L-05/Z-02 "fail" vì lý do này); client không bị ảnh hưởng |
| 4.12 | Không tồn tại route `/admin/orders` (404) | Danh sách đơn nằm ở `/admin?tab=orders`; nav không link sai, nhưng gõ URL trực tiếp sẽ 404 |
| 4.13 | Nhãn stepper khác checklist | Code: "Tiếp nhận đơn / Giao thành công"; checklist: "Đang xử lý / Hoàn thành" |
| 4.14 | Next.js cảnh báo `middleware` deprecated | Nên đổi `src/middleware.ts` → `proxy.ts` theo Next 16 (redirect 3000↔3001 hiện vẫn chạy đúng: 307) |
| 4.15 | Cookie session `Secure` trong production | `NODE_ENV=production` ⇒ cookie chỉ lưu trên `https` hoặc `localhost`. Demo qua LAN `http://192.168.x.x:3000` sẽ đăng nhập "thành công" nhưng mất session (localtunnel https thì OK) |
| 4.16 | `next build` tự sửa `tsconfig.json` + `next-env.d.ts` | Đã revert về đúng bản commit; cần lưu ý khi commit code |
| 4.17 | `GET /api/products` → 405 | Chỉ có `POST` (admin upsert); storefront dùng `/api/store/bootstrap` |
| 4.18 | `npm run lint` chỉ chạy `tsc --noEmit`, không có ESLint | Không có test tự động nào trong repo (không có Jest/Vitest/Playwright) |

---

## 5. NHỮNG GÌ ĐÃ CHẠY TỐT (BẰNG CHỨNG)

| Nhóm | Kết quả |
| :--- | :--- |
| Build & typecheck | `next build` ✅ (60 trang, 0 lỗi), `tsc --noEmit` ✅ |
| Trang storefront | 15/15 trang trả 200 (`/`, `/shop`, `/cart`, `/checkout`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/orders`, `/wishlist`, `/try-on`, `/outfit`, `/size-guide`, `/about`, `/account`, `/social`) |
| Trang admin (:3001) | 7/7 trang 200; redirect 2 chiều giữa 3000 ↔ 3001 đúng |
| Catalog | 97 sản phẩm `analyzerReady`, 388 variant, 97/97 ảnh tải 200, 97/97 trang chi tiết sản phẩm 200 |
| Xác thực | Sai mật khẩu 401; đăng nhập customer/admin OK; đăng ký 201 + chặn trùng email 409 + validate 400; `/me`, `/account/state` đúng; logout hủy session trong DB; đổi mật khẩu sai/ngắn bị chặn |
| Voucher | 9/9 case đúng (min order, trần giảm, %, fixed, không phân biệt hoa thường, mã sai); công thức client = server |
| Giỏ hàng / yêu thích | Lưu DB, khôi phục qua `/account/state`, chặn khi chưa đăng nhập |
| Đặt hàng | COD & QR tạo 201; trừ tồn theo variant (12 → 10); xóa giỏ sau đặt; vượt tồn 409; voucher sai 400; sản phẩm ngừng bán 409; thiếu thông tin 400 |
| Thanh toán | Polling trạng thái đúng; xác nhận local → `paid`+`confirmed`; idempotent; đơn người khác 403; chưa đăng nhập 401; đơn không tồn tại 404; QR VietQR render thật |
| Admin | Danh sách đơn; phân quyền 403 đúng cho guest/customer; chuyển `processing→confirmed→shipping` + carrier/tracking; hủy đơn **hoàn kho đúng** và chặn mở lại 409; CRUD coupon (tạo/tắt/xóa an toàn khi đã dùng); khách hàng; analytics; AI insights; social moderation; promo text lên storefront |
| Trợ lý AI | Hỏi đáp chính sách, tư vấn size, hỏi đơn hàng (lưu hội thoại), tìm **đúng 5/5 đầm đỏ**; chặn tin nhắn rỗng/>2000 ký tự; lịch sử hội thoại 401 khi chưa đăng nhập |
| Analytics / Social | Ghi nhận hành vi (kèm học style profile), chặn loại sai/sản phẩm sai |
| Try-on | 5/5 nhánh validate đúng (thiếu ảnh, sản phẩm chưa chuẩn hoá, ảnh sai, feedback/assess thiếu dữ liệu) |

---

## 6. TRẠNG THÁI MÔI TRƯỜNG SAU KIỂM THỬ

- Docker Desktop đã được khởi động (ban đầu đang tắt) và stack đang chạy: `lsoul-postgres`, `lsoul-web` (:3000), `lsoul-admin` (:3001). Dừng bằng `stop.bat` / `npm run stop:app`.
- Database đã được seed lại (`npx tsx prisma/seed.ts`) — 97 sản phẩm, 4 user, 4 coupon.
- **Dữ liệu test đã tạo trong DB** (có thể xoá nếu muốn giữ demo sạch):
  - Đơn: `LS261004A9511B` (shipping/GHN888999), `LS2610043B05DA` (QR đã trả tiền), `LS261004FBAB83` (đã hủy)
  - User: `e2e1791128626176@lsoul.local`
  - 3 `ChatConversation`, một số `UserBehaviorEvent`, `Session`, wishlist của `nam@lsoul.local`
  - Tồn kho SKU blazer beige size L giảm 2 (đã bán trong test)
- Đã **revert** các thay đổi do `next build` tự sinh (`tsconfig.json`, `next-env.d.ts`); `git status` chỉ còn `public/products.zip` (file của bạn, không phải do tôi tạo).

Lệnh dọn dữ liệu test (tuỳ chọn):
```powershell
docker exec lsoul-postgres psql -U lsoul -d lsoul -c "DELETE FROM \"Order\" WHERE id IN ('LS261004A9511B','LS2610043B05DA','LS261004FBAB83'); DELETE FROM \"ChatConversation\"; DELETE FROM \"User\" WHERE email LIKE 'e2e%@lsoul.local';"
```

---

## 7. THỨ TỰ ƯU TIÊN KHẮC PHỤC ĐỀ XUẤT

1. Sửa `spawnSync` cho 4 script `.mjs` (+ `shell: true`) → khôi phục `npm install`, `db:setup`, `db:seed`, `db:generate`, `db:catalog` trên Windows. *(~5 phút)*
2. Quyết định guest checkout: bổ sung cho `/api/orders` + `/checkout` **hoặc** sửa checklist/Use Case. *(nửa ngày nếu làm thật)*
3. Cấu hình `SEPAY_WEBHOOK_SECRET` và bổ sung kênh gửi link reset mật khẩu (hoặc nêu rõ giới hạn trong báo cáo). *(cấu hình + tích hợp mail)*
4. Thêm nhánh intent "xin mã giảm giá" trong `chat-agent.ts` (để TC-10a đạt). *(~1 giờ)*
5. Cập nhật model fallback Gemini (`gemini-flash-lite-latest`). *(5 phút)*
6. Thêm `FASHN_API_KEY` hoặc gia hạn/cấu hình Hugging Face Space để try-on chạy ổn định. *(cấu hình)*
7. Chuẩn hoá lại ảnh catalog về 3:4 và sửa 2 chip voucher `TEST99/TEST2K`, sửa email admin trong `run-first-time.bat`. *(thấp)*

---

## 8. ĐÃ SỬA (cập nhật cuối ngày 04/10/2026)

> ⚠️ **Cập nhật sau cùng:** theo quyết định của chủ dự án, **guest checkout đã được revert** — hệ thống yêu cầu đăng nhập cho mọi thao tác mua hàng. Vì vậy các mục **2, 3 và 13** trong bảng dưới đây đã được hoàn nguyên và tài liệu đã được sửa lại cho khớp (xem **mục 9**). Các mục còn lại vẫn giữ nguyên.

Tất cả thay đổi dưới đây **đã được build lại trong Docker và kiểm chứng** bằng bộ `npm run test:e2e`: **141/141 PASS**.

| # | Lỗi/thiếu sót | Cách sửa | File |
| :-- | :--- | :--- | :--- |
| 1 | 5 script npm lỗi `EINVAL` trên Windows/Node 24 | Thêm `scripts/run-bin.mjs` chạy trực tiếp entry point JS của prisma/tsx bằng `process.execPath` (không dùng `npx.cmd`, không cần `shell: true` nên không sinh cảnh báo DEP0190). Áp dụng cho cả 5 script. | `scripts/run-bin.mjs` (mới), `prisma-generate.mjs`, `db-setup.mjs`, `db-seed.mjs`, `db-catalog-sync.mjs`, `docker-db-init.mjs` |
| 2 | Khách vãng lai không mua được | Cho phép `POST /api/orders` không cần session (`userId = null`); cho phép thêm giỏ hàng cho khách và **giữ giỏ hàng cục bộ** (localStorage) thay vì xoá; bỏ màn hình chặn đăng nhập ở `/checkout`; đổi copy gợi ý ở `/cart`. | `src/app/api/orders/route.ts`, `src/components/store-provider.tsx`, `src/app/checkout/page.tsx`, `src/app/cart/page.tsx` |
| 3 | Không xác nhận được thanh toán cho đơn khách vãng lai | Cho phép xác nhận khi đơn không có chủ sở hữu (`userId = null`); đơn có chủ sở hữu vẫn yêu cầu đúng session (403 nếu không) và ghi log ai xác nhận. | `src/app/api/orders/[id]/payment/route.ts` |
| 4 | Webhook SePay luôn trả 503 | Đặt `SEPAY_WEBHOOK_SECRET` dev trong `.env`/`.env.example`, truyền biến này vào container, thêm script gửi webhook đã ký HMAC-SHA256. | `.env`, `.env.example`, `docker-compose.yml`, `scripts/test-sepay-webhook.mjs` (mới), `package.json` |
| 5 | Quên mật khẩu không có kênh nhận link | Thêm `PASSWORD_RESET_EXPOSE_LINK`: khi bật, API trả `resetUrl` và ghi link ra log server (tiện demo); mặc định tắt ở production. | `src/app/api/auth/forgot-password/route.ts`, `.env`, `.env.example`, `docker-compose.yml` |
| 6 | TC-10a: chatbot không gợi ý mã giảm giá | Thêm nhánh intent "xin mã/ưu đãi": liệt kê tối đa 3 mã đang bật (ưu tiên mã dễ dùng) + nút `apply_coupon` bấm nhanh; nạp coupon cho cả khách chưa đăng nhập; đảm bảo câu trả lời luôn nêu mã. | `src/lib/server/chat-agent.ts`, `src/app/api/chat/route.ts` |
| 7 | Model fallback Gemini đã ngừng hỗ trợ | Thay bằng `gemini-flash-lite-latest` + `gemini-2.5-flash`, hỗ trợ ghi đè qua `GEMINI_MODEL`. | `src/lib/server/chat-assistant.ts`, `docker-compose.yml` |
| 8 | Chip voucher `TEST99`/`TEST2K` không tồn tại | Đổi gợi ý sang mã thật `LSOUL10`, `WELCOME15` (cả placeholder). | `src/app/checkout/page.tsx` |
| 9 | `run-first-time.bat` in sai email admin | Sửa thành `admin@lsoul.local`. | `run-first-time.bat` |
| 10 | `/admin/orders` trả 404 | Thêm trang chuyển hướng 307 sang `/admin?tab=orders`. | `src/app/admin/orders/page.tsx` (mới) |
| 11 | Nhãn stepper lệch checklist | Đổi nhãn/mô tả 4 bước đúng như `TESTING_CHECKLIST.md`. | `src/components/order-tracker.tsx` |
| 12 | Chưa có test tự động | Thêm bộ e2e 141 case + script webhook + npm script; kết quả ghi ra `e2e-results.json` (đã gitignore). | `scripts/e2e-test.mjs` (mới), `package.json`, `.gitignore`, `README.md` |
| 13 | Khách vãng lai không xem lại được đơn sau khi tải lại trang | Trang `/orders` hiển thị đơn đã lưu cục bộ cho khách (kèm nhắc đăng nhập để đồng bộ) thay vì chặn hoàn toàn. | `src/app/orders/page.tsx` |

### Kiểm chứng sau khi sửa

```text
npm run test:e2e   →   TOTAL=141  PASS=141  FAIL=0
```

Các điểm đã xác nhận riêng:
- Guest COD/QR tạo đơn 201 (`userId = null`, xem qua API admin), xác nhận thanh toán không cần đăng nhập → `paid`/`confirmed`.
- Đơn có chủ sở hữu vẫn bị chặn 403 khi không có session; chủ đơn xác nhận được (200).
- Webhook SePay **đã ký** → `{"success":true}`, đơn chuyển `paid` với `paymentProvider = sepay`; không chữ ký/sai chữ ký vẫn bị chặn.
- Chat hỏi mã giảm giá → reply nêu `LSOUL10, WELCOME15, STYLE20` + 3 nút áp nhanh.
- Quên mật khẩu → có `resetUrl`, đổi mật khẩu bằng token và đăng nhập lại thành công.
- `npm run db:generate` / `npm run postinstall` → exit 0, không còn cảnh báo EINVAL (db:setup/db:seed dùng chung cơ chế, không chạy trực tiếp để tránh xoá dữ liệu demo).
- Tồn kho sau dọn dẹp: `sum(stock) = 6580`, khớp 100% catalog nguồn (0 sai lệch).

### Dữ liệu test đã được dọn

- Xoá **22 đơn test**, hoàn kho **18 sản phẩm**, xoá **4 tài khoản e2e**, xoá **6 hội thoại AI**; DB trở lại **18 đơn demo / 4 user / tổng tồn kho 6580** như ban đầu.
- Đã revert các file do công cụ tự sinh (`tsconfig.json`, `next-env.d.ts`, `tsconfig.tsbuildinfo`).

### Còn lại (cần quyết định của bạn, chưa sửa)

1. **Ảnh catalog chưa đồng nhất tỷ lệ 3:4** (45 ảnh 3:4, 21 ảnh 1:1, 12 ảnh 2:3, 9 ảnh khác) — cần sinh lại ảnh.
2. **Try-on AI** phụ thuộc quota Hugging Face ZeroGPU (đang hết) và `FASHN_API_KEY` trống.
3. **Gửi email thật** cho quên mật khẩu (hiện dùng giải pháp demo qua `PASSWORD_RESET_EXPOSE_LINK`).
4. Cookie session `Secure` trong production khiến đăng nhập qua LAN `http://<IP>:3000` mất session (chỉ hỗ trợ localhost/https).
5. `GET /api/auth/me` trả `200 {user:null}` (quy ước hiện tại, đã cập nhật test cho khớp).
6. Next.js 16 cảnh báo `middleware` deprecated — có thể đổi sang `proxy.ts` khi rảnh.

---

## 9. QUYẾT ĐỊNH CUỐI: BẮT BUỘC ĐĂNG NHẬP (không hỗ trợ guest checkout)

Sau khi cân nhắc, chủ dự án chọn **yêu cầu đăng nhập cho mọi thao tác mua hàng**. Phần guest checkout ở mục 8 đã được hoàn nguyên hoàn toàn:

| Hạng mục | Trạng thái cuối |
| :--- | :--- |
| `POST /api/orders` không session | Trả **401** "Vui lòng đăng nhập để thanh toán đơn hàng." |
| `POST /api/orders/[id]/payment` không session | Trả **401**; sai chủ sở hữu/không phải admin → **403**; khôi phục `manualConfirmedBy = currentUser.id` |
| Thêm vào giỏ / thêm cả set | Yêu cầu đăng nhập, tự chuyển hướng `/login?next=...` |
| Giỏ hàng của khách | Không lưu localStorage khi chưa đăng nhập (như thiết kế gốc) |
| `/checkout` | Hiện lại màn hình "Đăng nhập để thanh toán" + redirect `/login?next=/checkout` |
| `/orders` | Yêu cầu đăng nhập |

Tài liệu đã được sửa cho khớp (không còn mâu thuẫn giữa Use Case / checklist / sản phẩm):

- `TESTING_CHECKLIST.md`: dòng "Khách vãng lai" nêu rõ chỉ được **xem catalog, tìm kiếm, chi tiết sản phẩm và chat tư vấn**; thêm ghi chú điều kiện tiên quyết "các kịch bản 1→5 yêu cầu đăng nhập" ở đầu mục 2; Kịch bản 2 bước 1 bổ sung "Đăng nhập tài khoản khách hàng".
- `docs/USE_CASES.md`: mô tả rõ phạm vi A02 (khách truy cập) và ghi chú G04 "UC23–UC28 chỉ thực hiện được khi đã đăng nhập (A03)".
- `README.md`: bỏ ghi chú "hỗ trợ khách vãng lai", ghi rõ checkout yêu cầu đăng nhập.

**Ảnh hưởng tới bộ test:** 3 test case guest được chuyển thành test "bị chặn 401" (O-01, Q-08) và bổ sung 2 test cho webhook SePay đã ký hợp lệ (W-03, W-04) — tổng vẫn **141 case, PASS 141/141** sau khi build lại Docker.

**Các fix khác vẫn giữ nguyên:** script npm chạy được trên Windows, model Gemini fallback, webhook SePay + secret dev, link reset mật khẩu dạng demo, chat gợi ý mã giảm giá, chip voucher thật, email admin trong `run-first-time.bat`, redirect `/admin/orders`, nhãn stepper, bộ e2e + script webhook.

---

## 10. ẢNH CATALOG — AUDIT & XỬ LÝ

### 10.1. Kết quả audit (script `npm run images:audit`)

| Chỉ số | Trước | Sau xử lý |
| :--- | :--- | :--- |
| Sản phẩm | 97 | **99** (thêm 2 biến thể màu còn thiếu) |
| Ảnh riêng biệt được dùng | 83 | **85** |
| File ảnh trên đĩa | 87 | **85** (xoá 2 file rác) |
| Sản phẩm thiếu file ảnh | 0 | 0 |
| File ảnh không SP nào dùng (orphan) | 4 | **0** |
| Ảnh lệch tỷ lệ 3:4 | 39 | 40 (không ảnh hưởng hiển thị) |
| **2 SP khác nhau dùng chung 1 ảnh** | **14 file / 28 SP** | chưa xử lý (chờ gen ảnh) |

Lưu ý: CSS dùng `object-fit: cover` với khung `.productMedia { aspect-ratio: .78 }` nên phần lệch tỷ lệ file **không gây lỗi hiển thị** — web vẫn luôn crop về ~3:4.

### 10.2. Đã xử lý

1. **Xoá 2 file rác**: `test-pollinations.jpg` (ảnh sinh thử bị lỗi) và `top-basic-white.jpg` (thực chất là **ảnh chân dung nam**, không phải ảnh sản phẩm) — xoá ở host và cả 2 container.
2. **Thêm 2 biến thể màu còn thiếu** (dùng 2 ảnh orphan chất lượng tốt đã có sẵn), cập nhật `src/lib/extended-products.ts` rồi đồng bộ DB:
   - `DR-LUNA-HALTER-GRN` — Luna Backless Halter Midi Dress, **Xanh ngọc**, `#037E5F`, ảnh `dress-luna-halter-green.jpg` (896×1200)
   - `DR-NOIR-SLIP-BEI` — Noir Silk Slip Midi Dress, **Be**, `#D8C9B4`, ảnh `dress-satin-slip-beige.jpg`
   - Đã kiểm chứng qua API: 99 sản phẩm, mỗi biến thể 4 size (S/M/L/XL), tồn 48, ảnh 200, trang chi tiết 200.

### 10.3. Còn lại: 14 ảnh cho các cặp SP dùng chung ảnh (chờ quota)

6 cặp dòng sản phẩm gần trùng tên đang dùng chung 1 ảnh/màu (28 SP bị ảnh hưởng):
Poplin Shirt ↔ Luxe Poplin · Atelier Wide ↔ Wide-Pleat Slacks · Y2K Low-Rise ↔ Mid-Rise Flare · Pleated Schoolgirl ↔ Tennis Pleated · A-Line Slit ↔ Satin Bias-Cut Slit · Silk Slip ↔ Noir Silk Slip.

Script [generate-missing-images.ts](scripts/generate-missing-images.ts) đã sẵn sàng (`npm run images:plan`, `npm run images:generate`): sinh 14 ảnh 3:4 → cập nhật catalog nguồn → cập nhật DB → `docker cp` vào 2 container.

**Đang chặn:** tất cả model ảnh của Gemini trả `429` với metric `generate_content_free_tier_requests, limit: 0` (gói free không được dùng model ảnh). Các đường miễn phí khác đều không khả dụng: HF Inference API trả 410 (đã bỏ), HF Spaces hết quota ZeroGPU free, Pollinations trả ảnh sai nội dung + watermark. → Cần **bật billing** cho key Gemini (hoặc key dịch vụ khác) rồi chạy `npm run images:generate`.

---

## 11. PHÒNG THỬ ĐỒ AI — SỬA LỖI ẢNH KẾT QUẢ BỊ MỜ

### 11.1. Nguyên nhân (đo được, không phải phỏng đoán)

Chạy thật một lượt try-on rồi tải ảnh kết quả về đo bằng `sharp`:

```text
provider = huggingface-fashn-vton-1.5
content-type = image/webp
bytes = 9 KB
kích thước thật = 576 x 771
```

Trong khi khung hiển thị `.fittingResult` rộng ~1.200 px, cao **tối thiểu 820 px** (`next/image fill` kéo ảnh giãn theo khung) → ảnh 576×771 bị **phóng to ~2–4 lần** (màn hình retina còn cần gấp đôi số điểm ảnh) ⇒ mờ. Nguồn AI miễn phí (FASHN VTON 1.5 / IDM-VTON trên HF ZeroGPU) chỉ trả ảnh ~576–768 px, không có tham số tăng độ phân giải.

### 11.2. Đã sửa

| # | Sửa gì | File |
| :-- | :--- | :--- |
| 1 | **Không phóng to ảnh quá độ nét gốc**: bỏ `next/image fill` (ép ảnh theo khung) → `<img class="fittingStageImage">` với `max-width/max-height: 100%; width/height: auto`, khung `display:grid; place-items:center`. Ảnh luôn hiển thị ≤ kích thước thật nên không bị mờ do upscale. | `src/app/try-on/try-on-client.tsx`, `src/app/fitting-room.css` |
| 2 | **Yêu cầu Gemini trả ảnh độ phân giải cao**: thêm `generationConfig.imageConfig` với `imageSize` (mặc định **2K**, đổi bằng `TRYON_IMAGE_SIZE=1K\|2K\|4K`) và `aspectRatio` **tự suy ra từ ảnh người dùng** (đọc header JPEG trực tiếp, không cần thư viện giải mã). Thang thử: 2K → chỉ aspect ratio → không cấu hình (giữ nguyên hành vi cũ) nên model nào không hỗ trợ vẫn chạy bình thường. | `src/lib/server/gemini-tryon.ts` |
| 3 | **Kết quả bền hơn**: ảnh HF Space là URL có chữ ký `__sign=` (hết hạn theo thời gian) → tự tải về và nhúng thành data URL trước khi trả về/lưu DB (giữ nguyên URL nếu tải lỗi). | `src/app/api/tryon/route.ts` |
| 4 | **UI rõ ràng**: nút "✨ Gemini" → "✨ Gemini 2K" + dòng gợi ý giải thích vì sao IDM/Fashn hơi mềm khi xem to. | `src/app/try-on/try-on-client.tsx`, `fitting-room.css` |
| 5 | Truyền `TRYON_IMAGE_SIZE` vào container + ghi trong `.env.example`. | `docker-compose.yml`, `.env.example` |

### 11.3. Kiểm chứng

- Try-on thật (`engine=auto`): `200`, provider `huggingface-fashn-vton-1.5`, **output là data URL 12 KB** (trước đây là URL có chữ ký, sẽ hết hạn), ảnh 576×771.
- Try-on với `engine=gemini` khi Gemini hết quota: log `gemini-3-pro-image-preview HTTP 429` → **tự động fallback sang FASHN**, trả `200` — thang model mới không làm vỡ luồng.
- Bộ đọc kích thước JPEG: 12/12 ảnh khớp kết quả `sharp`; ảnh không phải JPEG → fallback `3:4`.
- CSS/JS mới có trong bundle production (`fittingStageImage`, `fittingEngineHint`), `TRYON_IMAGE_SIZE=2K` trong container, trang `/try-on` trả `200`.

### 11.4. Để ảnh vừa to vừa nét

| Cách | Kết quả |
| :--- | :--- |
| **Chọn engine "Gemini 2K"** + bật billing cho `GEMINI_API_KEY` | Ảnh ~2K, nét khi xem lớn (khuyến nghị) |
| Thêm `FASHN_API_KEY` | Dùng FASHN API chính thức (ảnh lớn hơn bản space miễn phí) |
| Giữ IDM/Fashn miễn phí | Ảnh chỉ ~576–768 px nên hiển thị đúng cỡ gốc: nét nhưng nhỏ hơn khung |

Lưu ý: ảnh 2K là data URL vài MB nên response/DB sẽ nặng hơn; nếu thấy chậm có thể đặt `TRYON_IMAGE_SIZE=1K` hoặc chuyển sang lưu kết quả thành file.

### 11.5. Làm nét bằng siêu phân giải (không cần billing)

Ảnh kết quả mới nhất đo được là **768×1024 PNG** (IDM-VTON) — vẫn nhỏ hơn khung hiển thị nên bị phóng to và mờ. Đã thử 2 cách và **đo bằng ảnh so sánh cùng kích thước hiển thị** (xem [`docs/tryon-sharpness-compare.png`](tryon-sharpness-compare.png)):

| | Cách làm | Kết quả |
| :--- | :--- | :--- |
| A | Ảnh gốc 768px hiển thị ở khung 1200px | mờ (mốc so sánh) |
| B | Lanczos 2× + unsharp mask (tại chỗ, `sharp`) | nét viền hơn, **không tốn quota**, 0.07 MB |
| C | **Real-ESRGAN 2× (Hugging Face Space)** | **nét rõ rệt**: lông mi, chân mày, sợi tóc, da — 6.5s, 0.04 MB |

Đã tích hợp tự động vào `/api/tryon`: sau khi tạo ảnh, tự gọi siêu phân giải rồi mới trả về/lưu DB; lỗi thì giữ ảnh gốc (không làm hỏng luồng).

| Biến môi trường | Ý nghĩa |
| :--- | :--- |
| `TRYON_UPSCALE=2` (mặc định) | Real-ESRGAN 2× — nét nhất, tốn thêm ~8–15s quota ZeroGPU |
| `TRYON_UPSCALE=4` | Real-ESRGAN 4× (3072×4096) |
| `TRYON_UPSCALE=sharp` | Lanczos + unsharp tại chỗ — **miễn phí, tức thì**, không tốn quota HF |
| `TRYON_UPSCALE=off` | Tắt |
| `TRYON_UPSCALE_SPACE=<space>` | Đổi Space siêu phân giải nếu Space mặc định chết |

**Nút thắt thật sự không phải độ mờ:** cả Space VTON và Space siêu phân giải đều chạy trên **ZeroGPU (`zero-a10g`)** của Hugging Face, và quota miễn phí theo ngày đã hết (lỗi `ZeroGPU quota exceeded`). Vì vậy hiện tại try-on trả `502` ở bước tạo ảnh — bước làm nét đã kiểm chứng độc lập (module `upscaleImage` 2×→1536×2048 trong 6.5s) nhưng chưa chạy được end-to-end cho tới khi quota hồi hoặc có HF PRO / billing.

Cách gỡ: chờ quota HF hồi (theo ngày) · HF PRO (~$9/tháng) · hoặc bật billing cho `GEMINI_API_KEY` rồi chọn engine **Gemini 2K** (khi đó ảnh gốc đã nét, không cần siêu phân giải).

---

## 12. CHAT PHỐI ĐỒ — LỖI "2 MÓN NHƯNG HIỂN THỊ 3 MÓN"

### 12.1. Nguyên nhân

Tái hiện bằng cách gọi thật `/api/chat` với 4 câu phối đồ:

| Câu hỏi | Thẻ sản phẩm UI | Món được nhắc trong câu trả lời |
| :--- | :--- | :--- |
| "Phối cho tôi một set đồ đi chơi thật trendy" | 2 | 2/2 |
| "Tôi muốn phối đồ đi dạo phố" | 3 | 3/3 |
| "Phối set đồ Y2K cho tôi" | 2 | 2/2 |
| "Tư vấn outfit đi tiệc giúp mình" | **3** | **2/3** ← lỗi |

Engine phối đồ (`coordinateSmartOutfit`) **cố ý trả 3 món** cho một số yêu cầu: áo + quần/chân váy + **lớp áo khoác ngoài** (blazer/jacket) — đúng thiết kế "set hoàn chỉnh" và khớp với nhãn nút "Thử cả set (3 món)". Nhưng **câu trả lời do model viết chỉ kể 2 món** (và tính tổng tiền cho 2 món), nên lệch với 3 thẻ sản phẩm + 3 món trong giỏ ⇒ giống hệt lỗi bạn gặp (áo + quần = 2.230.000đ nhưng UI hiện 3 món).

### 12.2. Đã sửa (2 lớp)

| # | Sửa gì | File |
| :-- | :--- | :--- |
| 1 | **Buộc model liệt kê đúng và đủ**: ghi chú gửi kèm prompt nay nêu rõ danh sách món + tổng tiền và yêu cầu "PHẢI liệt kê ĐÚNG và ĐỦ, không thêm/bớt" | `src/lib/server/chat-agent.ts` |
| 2 | **Chốt hạ ở server**: nếu câu trả lời vẫn thiếu món nào trong set, tự bổ sung dòng "📌 Set đã phối gồm N món: … — tổng …đ" (giống cơ chế đảm bảo mã giảm giá) | `src/app/api/chat/route.ts` |
| 3 | **UI**: thêm chú thích ngay trên các thẻ sản phẩm — "Set gồm N món · tổng …đ" | `src/components/chat-widget.tsx`, `src/app/chat-assistant.css` |

### 12.3. Kiểm chứng (sau khi build lại, chạy trên đường Gemini thật)

```text
"Tư vấn outfit đi tiệc giúp mình"   →  3 thẻ · nút "3 món"
… (câu trả lời của AI) …
📌 Set đã phối gồm 3 món: Ribbed Square-Neck Crop Top (Trắng) + Y2K Low-Rise Flare Jeans (Đen)
   + Cropped Utility Cargo Jacket (Xanh lá) — tổng 3.910.000đ.

"Phối cho tôi set đồ đi làm"        →  2 thẻ · nút "2 món", câu trả lời nêu đủ 2 món (không thêm dòng thừa)
```

Cả 4 câu kiểm thử đều cho kết quả **khớp 100%** giữa câu trả lời (số món + tổng tiền) và số thẻ sản phẩm/nút hành động.

### 12.4. Quy tắc thêm áo khoác ngoài (sửa theo phản hồi "tôi chọn quần + áo mà có cả áo khác")

**Nguyên nhân gốc:** trong `coordinateSmartOutfit`, nhánh `top_bottom` thêm áo khoác theo điều kiện
`salt % 3 === 0 || styleChoice === "power"`. Chat gọi engine **không truyền `variantSalt`** ⇒ `salt = 0` ⇒ điều kiện **luôn đúng** ⇒ mọi yêu cầu "áo + quần" đều bị thêm áo khoác ngoài. Nhánh `dress_layer` thì **luôn** cố thêm blazer, còn `coord_set` thêm 50% (`salt % 2 === 0`). Trên trang `/outfit`, `salt` random 0–999 nên áo khoác xuất hiện ngẫu nhiên ~1/3 số lần.

**Đã sửa — chỉ thêm lớp khoác khi khách yêu cầu rõ ràng:**

| Nơi | Trước | Sau |
| :--- | :--- | :--- |
| Engine `top_bottom` | luôn thêm (do salt=0) | chỉ thêm khi `includeOuterwear: true` |
| Engine `dress_layer` | luôn cố thêm blazer | chỉ thêm khi `includeOuterwear: true` |
| Engine `coord_set` | 50% ngẫu nhiên | chỉ thêm khi `includeOuterwear: true` |
| Chat | không có cách yêu cầu | nhận diện từ khoá: *khoác / blazer / jacket / cardigan / layer / giữ ấm / mùa đông / lạnh* |
| Nhãn sản phẩm | "Áo khoác ngoài" | "Áo khoác ngoài **(tùy chọn)**" |
| Nhãn nút giỏ | "Thêm cả set vào giỏ (3 món)" | "Thêm **2 món chính + áo khoác tùy chọn** (3 món)" |
| Trang `/outfit` | tab "Đầm liền & Áo khoác" + random | tab "Đầm liền" + **công tắc "Kèm áo khoác" (mặc định TẮT)** |
| Trang sản phẩm | tự thêm áo khoác | chỉ 2 món chính |

**Kiểm chứng sau khi build lại:**

```text
ENGINE setType=top_bottom, salt=0/1/3/42  -> 2 món (áo + quần), KHÔNG áo khoác
ENGINE includeOuterwear=true              -> 3 món, nhãn "Áo khoác ngoài (tùy chọn)"

CHAT "Phối cho tôi áo và quần đi chơi"      -> 2 món, KHÔNG áo khoác · "Thêm cả set vào giỏ (2 món)"
CHAT "Phối đồ đi dạo phố"                   -> 2 món, KHÔNG áo khoác
CHAT "Phối cho tôi bộ đồ đi làm có áo khoác" -> 3 món · "Thêm 2 món chính + áo khoác tùy chọn (3 món)"
```
