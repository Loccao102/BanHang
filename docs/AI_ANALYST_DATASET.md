# Dataset & AI Analyst – LSOUL demo

## Mục tiêu

Dataset demo được thiết kế để cùng lúc phục vụ 3 luồng:

1. **Thương mại điện tử**: catalog, biến thể cỡ, giỏ hàng, đơn hàng, review.
2. **Virtual Try-On**: mỗi sản phẩm có metadata `tryOnCategory`, `tryOnPhotoType`, `tryOnImage`.
3. **AI Analyst / Stylist**: sản phẩm có thuộc tính thời trang có cấu trúc, còn hành vi khách hàng được ghi thành tín hiệu có trọng số để cập nhật hồ sơ gu.

## Phân tầng nguồn dữ liệu

### Sản phẩm thương mại
`sourceType = official-marketplace | retailer-corroborated`

Đây là dữ liệu được phép dùng cho AI Analyst:
- SKU/model code.
- Tên sản phẩm.
- Giá snapshot.
- Màu.
- Cỡ.
- Hình ảnh.
- Nguồn và ngày đối chiếu.
- Các thuộc tính phong cách được chuẩn hóa cho demo.

Các record này có:

```text
analyzerReady = true
```

### Garment tham chiếu VTO
`sourceType = vto-reference`

Đây là garment reference từ bộ ví dụ FASHN/Hugging Face, dùng để kiểm tra kỹ thuật phòng thử đồ. Chúng:
- không hiện trong storefront chính;
- không tham gia học gu;
- không được coi là sản phẩm LSOUL thật.

```text
active = false
analyzerReady = false
```

## Nhóm trang phục demo

Không seed set nguyên bộ.

- `tops`: áo / corset.
- `bottoms`: quần và chân váy.
- `dress`: váy / đầm.
- `outerwear`: schema hỗ trợ sẵn để bổ sung áo khoác thật khi có asset đủ tốt.

Quy tắc phối:
- top + một bottom + outerwear tùy chọn;
- dress là look riêng.

## Metadata sản phẩm dành cho AI

Ngoài trường bán hàng thông thường, Product có:

```text
tryOnCategory
tryOnPhotoType
tryOnImage
silhouette
lengthClass
neckline
sleeveLength
pattern
season
formality
warmth
stretch
coverage
colorTemperature
styleKeywords
aiSearchText
analyzerReady
```

Mục đích:
- retrieval không chỉ dựa vào tên sản phẩm;
- AI có thể hiểu “váy đỏ đi tiệc”, “Y2K cạp thấp”, “nữ tính dưới 2 triệu”;
- VTO biết chính xác garment thuộc tops / bottoms / one-pieces;
- có thể mở rộng recommendation scoring mà không phải parse lại mô tả tự do.

## Continuous learning ở mức đồ án

Không tự fine-tune hoặc tự thay đổi model Gemini/FASHN.

Hệ thống học bằng dữ liệu hành vi:

```text
UserBehaviorEvent
        ↓
ProductAffinity
        ↓
UserStyleProfile
        ↓
retrieval + prompt context
        ↓
AIRecommendation
        ↓
feedback / hành vi tiếp theo
        ↺
```

### Trọng số mặc định

| Tín hiệu | Trọng số |
|---|---:|
| Xem sản phẩm | +0.25 |
| Thêm yêu thích | +2.5 |
| Bỏ yêu thích | -2 |
| Thêm giỏ | +3 |
| Bỏ giỏ | -1.5 |
| Bắt đầu thử đồ | +1 |
| Thử đồ thành công | +3 |
| Thử lại | +0.5 |
| Từ chối kết quả try-on | -2 |
| AI hiển thị gợi ý | +0.05 |
| Click gợi ý AI | +1.5 |
| Chấp nhận gợi ý AI | +4 |
| Từ chối gợi ý AI | -3 |
| Tạo đơn | +3 |
| Mua thành công | +5 |
| Review | +2 |

Các tín hiệu nhẹ như view giúp cold-start. Tín hiệu có ý định cao như cart, try-on, order và feedback AI có trọng số lớn hơn.

## UserStyleProfile

Hồ sơ được rebuild từ event history:

- `preferredCategories`
- `preferredTypes`
- `preferredColors`
- `preferredStyles`
- `preferredOccasions`
- `preferredFits`
- `priceMin / priceMax`
- `avoidAttributes`
- `confidence`
- `eventCount`

AI chat nhận một bản tóm tắt profile này trong context. Product retrieval đồng thời được boost bằng `ProductAffinity.score`.

## Quyền riêng tư cho thử đồ

Không lưu raw base64 ảnh người dùng vào bảng học.

`TryOnSession` chỉ lưu:
- SHA-256 hash của ảnh input;
- productIds;
- chuỗi category;
- trạng thái;
- URL output nếu provider trả;
- feedback kết quả.

Điều này đủ để phân tích hành vi demo nhưng tránh biến ảnh người dùng thành training corpus dài hạn.

## Persona seed

Seed có 3 persona để demo personalization:

- **Linh**: thiên về đầm nữ tính, glam, đỏ/nâu đỏ, tôn eo, đi tiệc/hẹn hò.
- **Nam**: thiên về Y2K/streetwear, denim, wide-leg, camo.
- **Mai**: thiên về corset + chân váy, Y2K/romantic, mix & match.

Sau seed, chạy:

```bash
npm run ai:rebuild
```

để rebuild toàn bộ profile từ event history.

## API

```text
POST /api/analytics/events
GET  /api/analytics/profile
```

Event endpoint có thể nhận guest event, nhưng profile học cá nhân chỉ được rebuild khi user đã đăng nhập.

## Reset và seed lại toàn bộ demo

### Docker

```bash
npm run docker:reset
docker compose up --build
```

### Local

```bash
npm run db:up
npm run db:setup
npm run dev
```

Lưu ý: `db:setup` chạy seed reset demo data. Không dùng trên database production có dữ liệu thật.


## AI Stylist sau Virtual Try-On

Sau khi FASHN tạo ảnh kết quả, phòng thử đồ gọi thêm:

```text
POST /api/tryon/assess
```

Pipeline:

```text
Ảnh try-on đã render
        +
metadata sản phẩm
        +
UserStyleProfile
        ↓
Gemini Vision (nếu có GEMINI_API_KEY)
        ↓
Compatibility Engine
        ↓
overallScore + 5 điểm thành phần + lý do + gợi ý
```

Năm điểm thành phần:
- màu sắc;
- tỉ lệ thị giác của outfit trong ảnh;
- độ đồng nhất phong cách;
- mức khớp với gu đã học;
- độ tin cậy của ảnh render.

Không dùng điểm này để khẳng định size hoặc độ vừa thực tế. AI không được suy đoán chủng tộc, sức khỏe, cân nặng hay số đo cơ thể từ ảnh.

Nếu Gemini không khả dụng, hệ thống fallback sang metadata sản phẩm + hồ sơ gu để phòng thử đồ vẫn hoạt động.

### Feedback học gu

Người dùng có thể chọn:
- `Chuẩn với mình`;
- `Mình thích outfit này`;
- `Chưa đúng gu`.

API:

```text
POST /api/tryon/feedback
```

Phản hồi được lưu vào `TryOnSession.rating/accepted`. Khi người dùng đã đăng nhập, hệ thống ghi thêm behavior event có source `virtual-fitting-room-stylist` rồi rebuild `UserStyleProfile`. Raw ảnh người dùng vẫn không được ghi vào dataset học.
