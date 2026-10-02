# Catalog + Prisma + PostgreSQL

## Kiến trúc đúng

PostgreSQL là nguồn dữ liệu runtime của website. `src/lib/products.ts` hiện là catalog fixture/source để seed và fallback khi DB chưa cấu hình.

Điểm **độ phù hợp không nằm trên từng Product**.

Luồng đúng:

```text
top + bottom (+ outerwear)
hoặc một dress hoàn chỉnh
        ↓
FASHN render toàn bộ outfit
        ↓
AI Stylist đánh giá outfit đã phối
        ↓
OutfitAssessment lưu vào PostgreSQL
        ↓
feedback người dùng cập nhật profile học gu
```

## Catalog mục tiêu cho demo

- 40–45 áo
- 18–22 quần
- 16–20 chân váy
- 24–30 váy/đầm
- 10–14 áo khoác
- không seed set nguyên bộ

Hiện repo có 8 sản phẩm thương mại analyzer-ready và 3 garment reference VTO. Không nhân bản giả sản phẩm để đạt số lượng mục tiêu.

## Metadata Product dành cho AI Analyst

Prisma Product hiện hỗ trợ:

- SKU, category, type, price, size, stock
- image, hoverImage, images, tryOnImage
- material, fit, silhouette, lengthClass
- neckline, sleeveLength, waistRise
- pattern, season, formality, warmth, stretch, coverage
- colorFamily, colorTemperature, recommendedUndertones
- style, styleKeywords, occasion
- pairingTags, avoidPairingTags
- visualWeight, volume
- bodyShapeCompatibility
- aiSearchText, analyzerReady
- sourceUrl, sourceType, sourceUpdatedAt

`bodyShapeCompatibility` chỉ là metadata mô tả sản phẩm; hệ thống không tự suy đoán body shape người dùng từ ảnh.

## Bảng OutfitAssessment

Sau khi Virtual Try-On hoàn tất, kết quả đánh giá cả outfit được lưu vào:

```text
OutfitAssessment
```

Các trường chính:

- tryOnSessionId
- userId
- productIds
- overallScore
- colorScore
- proportionScore
- styleScore
- preferenceScore
- renderScore
- verdict
- summary
- positives
- cautions
- suggestions
- mode
- profileConfidence
- feedback / feedbackAt

## Sync schema + catalog vào PostgreSQL mà không xóa dữ liệu

Thiết lập `DATABASE_URL`, sau đó chạy:

```bash
npm run db:catalog
```

Lệnh này chạy lần lượt:

```bash
prisma generate
prisma db push
tsx prisma/seed-catalog.ts
```

Catalog và variants được **upsert**, không xóa user, order, wishlist, behavior history hay AI profile.

## Reset toàn bộ DB demo

Chỉ dùng khi bạn muốn làm mới database local/demo:

```bash
npm run db:setup
```

Lệnh này reset rồi seed lại toàn bộ dữ liệu demo, nên không dùng với database production đang có dữ liệu thật.

## PostgreSQL/Vercel

Với PostgreSQL cloud:

1. đặt `DATABASE_URL` đúng connection string;
2. chạy `npm run db:catalog` từ máy local hoặc môi trường có quyền kết nối DB;
3. deploy app;
4. website đọc catalog qua Prisma từ PostgreSQL.

Không cần hard-code dữ liệu catalog trên client khi database đã hoạt động.
