# LSOUL – Website thương mại điện tử thời trang tích hợp AI

Website thương mại điện tử thời trang xây dựng bằng Next.js App Router, Prisma và PostgreSQL, có trợ lý mua sắm AI và phòng thử đồ AI.

> Phạm vi đồ án chính thức không bao gồm Social Commerce. Danh sách Use Case được chốt tại `docs/USE_CASES.md`.

## Chức năng chính

- Catalog sản phẩm LSOUL có nguồn đối chiếu: SKU, tên, giá, màu, cỡ và ảnh.
- Tìm kiếm, lọc, sắp xếp và xem chi tiết sản phẩm.
- Yêu thích theo nhóm: áo/corset, quần & chân váy, váy/đầm, áo khoác, set nguyên bộ.
- Phối đồ từ danh sách yêu thích và thử đồ bằng FASHN.
- Giỏ hàng, mã giảm giá, checkout COD/VietQR (yêu cầu đăng nhập).
- SePay webhook xác minh thanh toán.
- Tài khoản, hồ sơ, sổ địa chỉ, đổi mật khẩu và đặt lại mật khẩu.
- Lịch sử đơn hàng, trạng thái thanh toán, vận chuyển và đánh giá sản phẩm.
- Trợ lý mua sắm AI dùng Gemini, có lịch sử hội thoại.
- Admin quản lý sản phẩm, tồn kho, đơn hàng, khách hàng và mã giảm giá.

## Biến môi trường

Sao chép file mẫu:

```bash
cp .env.example .env
```

Trên Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Các biến chính:

```env
DATABASE_URL="postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public"

POSTGRES_USER=lsoul
POSTGRES_PASSWORD=lsoul_dev
POSTGRES_DB=lsoul
POSTGRES_PORT=5432
APP_PORT=3000

GEMINI_API_KEY=
FASHN_API_KEY=

NEXT_PUBLIC_BANK_ID=MB
NEXT_PUBLIC_BANK_ACCOUNT=0123456789
NEXT_PUBLIC_BANK_ACCOUNT_NAME=LSOUL
SEPAY_WEBHOOK_SECRET=lsoul_dev_sepay_secret
PASSWORD_RESET_EXPOSE_LINK=1
```

- `SEPAY_WEBHOOK_SECRET`: phải khớp Webhook Secret trên dashboard SePay. Giá trị mặc định chỉ dùng cho local/demo.
- `PASSWORD_RESET_EXPOSE_LINK=1`: khi chưa tích hợp dịch vụ gửi email, API quên mật khẩu trả luôn link reset trong response và ghi ra log để demo. Đặt `0` khi chạy thật.

Không commit file `.env` có secret thật lên GitHub.


## Lưu ảnh sản phẩm: local / Cloudinary

Route `/api/upload` dùng một storage driver chung và chỉ cho tài khoản admin upload.

### Local development

```env
UPLOAD_DRIVER=local
```

Ảnh được lưu vào `public/uploads` và trả URL dạng `/api/uploads/<filename>`.

### Production / Vercel với Cloudinary

```env
UPLOAD_DRIVER=cloudinary
CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@CLOUD_NAME"
CLOUDINARY_FOLDER=lsoul/products
```

Có thể thay `CLOUDINARY_URL` bằng ba biến `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Sau khi upload, API trả URL HTTPS của Cloudinary; URL này được lưu vào các trường ảnh sản phẩm như hiện tại nên không cần thay đổi Prisma schema.

---

# Cách 1 – Chạy toàn bộ bằng Docker

Đây là cách đơn giản nhất để demo đồ án với 2 service riêng biệt:
- **Cửa hàng (Storefront):** `http://localhost:3000`
- **Quản trị (Admin Console):** `http://localhost:3001/admin`

### 🚀 Cách nhanh nhất (1-Click trên Windows):
- **Lần đầu tiên**: Bấm đúp vào file [`run-first-time.bat`](run-first-time.bat) (hoặc gõ `npm run run:first`).
  *Tự động kiểm tra Docker, tạo .env, cài dependencies, build container, khởi tạo database và mở trình duyệt.*
- **Các lần sau**: Bấm đúp vào file [`run.bat`](run.bat) (hoặc gõ `npm run start:app`).
  *Khởi động nhanh trong 2-3 giây không cần build lại.*
- **Khi muốn tắt**: Bấm đúp vào file [`stop.bat`](stop.bat) (hoặc gõ `npm run stop:app`).

### Hoặc chạy qua lệnh Terminal:

```bash
# Lần đầu:
npm run run:first

# Các lần sau:
npm run start:app

# Dừng lại:
npm run stop:app
```

Mở trình duyệt:

```text
Cửa hàng (Storefront): http://localhost:3000
Quản trị (Admin Console): http://localhost:3001/admin
```

Docker Compose gồm 4 service:

```text
postgres (5432)
   ↓ healthcheck
db-init
   ↓ prisma db push
   ↓ chỉ seed khi database hoàn toàn trống
web (Storefront - Cổng 3000)   &   admin (Admin Console - Cổng 3001)
   ↓ Next.js server (Khách)            ↓ Next.js server (Quản trị)
```

### Quan trọng về dữ liệu

`db-init` **không seed lại khi database đã có dữ liệu**. Vì vậy chạy lại:

```bash
docker compose down
docker compose up -d
```

không làm mất đơn hàng, tài khoản hoặc dữ liệu đã phát sinh.

Muốn xóa toàn bộ database Docker và tạo lại dữ liệu demo:

```bash
npm run docker:reset
npm run docker:up
```

Lệnh `docker:reset` dùng `docker compose down -v`, nên sẽ xóa volume PostgreSQL.

### Log Docker

```bash
npm run docker:logs
```

### Tắt toàn bộ stack

```bash
npm run docker:down
```

---

# Cách 2 – Chạy Next.js local, PostgreSQL bằng Docker

Phù hợp khi đang code vì Next.js có hot reload.

```bash
npm install
npm run db:up
npm run db:setup
```

Khởi chạy dịch vụ:

- **Chạy cả 2 service cùng lúc (Khuyên dùng):**
  ```bash
  npm run dev:all
  ```
  *(Storefront mở tại `http://localhost:3000`, Admin mở tại `http://localhost:3001/admin`)*

- **Hoặc chạy riêng từng service:**
  - Chỉ chạy Storefront (Cổng 3000): `npm run dev:store` (hoặc `npm run dev`)
  - Chỉ chạy Admin (Cổng 3001): `npm run dev:admin`

Trong chế độ này:

```text
Storefront (Khách hàng): http://localhost:3000
Admin (Quản trị viên):   http://localhost:3001/admin
PostgreSQL:             localhost:5432
DATABASE_URL:           postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public
```

Lưu ý: `npm run db:setup` có seed dữ liệu demo và phù hợp khi khởi tạo môi trường phát triển. Không dùng lệnh này trên database có dữ liệu cần giữ.

Tắt riêng PostgreSQL:

```bash
npm run db:down
```

---

# Cách 3 – Chạy hoàn toàn local

Nếu máy đã cài PostgreSQL, chỉ cần sửa `DATABASE_URL` trong `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public"
```

Sau đó:

```bash
npm install
npm run db:setup
npm run dev
```

---

## Local và Docker khác nhau ở đâu?

Code ứng dụng không thay đổi. Chỉ khác hostname database:

```text
Local:
localhost:5432

Trong Docker network:
postgres:5432
```

`docker-compose.yml` tự tạo `DATABASE_URL` nội bộ cho `db-init` và `web`, nên file `.env` vẫn giữ URL local để `npm run dev` hoạt động bình thường.

## Các dịch vụ ngoài

Các dịch vụ này không chạy container riêng vì chúng là API bên ngoài:

- Gemini → `GEMINI_API_KEY`
- FASHN → `FASHN_API_KEY`
- VietQR → cấu hình `NEXT_PUBLIC_BANK_*`
- SePay → `SEPAY_WEBHOOK_SECRET`

Cả local và Docker đều đọc cùng bộ biến môi trường.

### NEXT_PUBLIC và Docker

Các biến `NEXT_PUBLIC_BANK_*` được Next.js nhúng vào bundle lúc build. Khi thay thông tin ngân hàng trong `.env`, cần build lại:

```bash
docker compose up -d --build
```

Các secret server-side như Gemini, FASHN và SePay chỉ cần restart container nếu thay đổi:

```bash
docker compose up -d
```

## Prisma / database

Các lệnh phát triển:

```bash
npm run db:up
npm run db:down
npm run db:seed
npm run db:studio
```

Docker full stack dùng:

```bash
npm run db:docker:init
```

Script này:

1. chạy `prisma generate`;
2. chạy `prisma db push`;
3. kiểm tra dữ liệu;
4. chỉ seed khi cả bảng sản phẩm và người dùng đều đang trống.

## Tài khoản demo

```text
Admin
admin@lsoul.local
Admin@123456

Khách hàng
linh@lsoul.local
Lsoul@123456
```

## Kiểm thử

Bộ kiểm thử end-to-end gọi trực tiếp API của hệ thống đang chạy (mặc định `localhost:3000` và `localhost:3001`):

```bash
npm run test:e2e
```

- Kết quả in ra màn hình và lưu tại `e2e-results.json` / `e2e-results.jsonl`.
- Đổi môi trường kiểm thử: `STORE_URL=http://localhost:3100 ADMIN_URL=http://localhost:3101 npm run test:e2e`.

Kiểm thử webhook SePay đã ký HMAC (Kịch bản 2 – Cách B):

```bash
# Lấy mã đơn QR đang chờ thanh toán trong Admin, sau đó:
npm run test:webhook -- --order LS261004ABCDEF --amount 2500000
```

## CI

GitHub Actions vẫn dùng PostgreSQL 16 riêng và thực hiện:

```text
npm install
npm run db:setup
npm run lint
npm run build
```

CI dùng database tạm nên việc seed lại không ảnh hưởng dữ liệu thật.

## Use Case đồ án

Xem:

```text
docs/USE_CASES.md
```

Hiện chốt 36 Use Case cốt lõi để báo cáo và vẽ UML.
