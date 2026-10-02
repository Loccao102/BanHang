# LSOUL – Website thương mại điện tử thời trang tích hợp AI

Website thương mại điện tử thời trang xây dựng bằng Next.js App Router, Prisma và PostgreSQL, có trợ lý mua sắm AI và phòng thử đồ AI.

> Phạm vi đồ án chính thức không bao gồm Social Commerce. Danh sách Use Case được chốt tại `docs/USE_CASES.md`.

## Chức năng chính

- Catalog sản phẩm LSOUL có nguồn đối chiếu: SKU, tên, giá, màu, cỡ và ảnh.
- Tìm kiếm, lọc, sắp xếp và xem chi tiết sản phẩm.
- Yêu thích theo nhóm: áo/corset, quần & chân váy, váy/đầm, áo khoác, set nguyên bộ.
- Phối đồ từ danh sách yêu thích và thử đồ bằng FASHN.
- Giỏ hàng, mã giảm giá, checkout COD/VietQR.
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
SEPAY_WEBHOOK_SECRET=
```

Không commit file `.env` có secret thật lên GitHub.

---

# Cách 1 – Chạy toàn bộ bằng Docker

Đây là cách đơn giản nhất để demo đồ án.

```bash
docker compose up --build
```

Hoặc chạy nền:

```bash
npm run docker:up:d
```

Mở:

```text
http://localhost:3000
```

Docker Compose gồm 3 service:

```text
postgres
   ↓ healthcheck
db-init
   ↓ prisma db push
   ↓ chỉ seed khi database hoàn toàn trống
web
   ↓ Next.js production server
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
npm run dev
```

Mở:

```text
http://localhost:3000
```

Trong chế độ này:

```text
Next.js: localhost:3000
PostgreSQL: localhost:5432
DATABASE_URL: postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public
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
