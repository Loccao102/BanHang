# XÂY DỰNG WEBSITE THƯƠNG MẠI ĐIỆN TỬ TÍCH HỢP SOCIAL COMMERCE CHO THƯƠNG HIỆU THỜI TRANG LSOUL

Website thương mại điện tử thời trang nữ xây dựng bằng Next.js App Router, Prisma và PostgreSQL, tập trung vào hành trình mua sắm trực tiếp kết hợp Social Commerce.

## Chức năng chính

- Catalog LSOUL với 170 sản phẩm quần áo nữ và tồn kho theo từng size
- Tìm kiếm, lọc danh mục, loại sản phẩm, màu, giá, sale và new arrivals
- Product detail, color options, size variant, wishlist, cart, quick view
- Đăng ký, đăng nhập, session httpOnly, hồ sơ và sổ địa chỉ
- Cart/wishlist đồng bộ theo tài khoản
- Checkout COD/QR, coupon từ database và tạo order transaction
- Kiểm tra tồn kho + trừ stock theo size trong PostgreSQL transaction
- Lịch sử đơn hàng, payment status, carrier và tracking code
- Review xác thực dành cho khách có đơn đã hoàn tất
- LSOUL Social feed, UGC, product tagging, shop-the-look và share tracking
- Admin quản lý sản phẩm, tồn kho, đơn hàng, khách hàng, coupon và nội dung social
- PostgreSQL + Prisma, CI chạy với PostgreSQL 16

## Chạy local

```bash
npm install
npm run db:up
npm run db:setup
npm run dev
```

Mở http://localhost:3000

```env
DATABASE_URL="postgresql://lsoul:lsoul_dev@localhost:5432/lsoul?schema=public"
```

Dữ liệu seed gồm 170 sản phẩm, size variants, 4 tài khoản, địa chỉ, cart, wishlist, 24 đơn hàng, coupon, review và social posts.

### Tài khoản seed

```text
Admin
admin@lsoul.local
Admin@123456

Customer
linh@lsoul.local
Lsoul@123456
```

## Lệnh database

```bash
npm run db:up
npm run db:down
npm run db:seed
npm run db:studio
```

## Vercel

Cấu hình một PostgreSQL hosted và thêm `DATABASE_URL` vào Environment Variables của Vercel. Không chạy lại sample seed khi database đã có dữ liệu khách hàng thật.

## AI mở rộng

`GEMINI_API_KEY` và `FASHN_API_KEY` vẫn được giữ làm điểm mở rộng cho shopping assistant và virtual try-on sau khi phần ecommerce/social commerce hoàn thiện.
