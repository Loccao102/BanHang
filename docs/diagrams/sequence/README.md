# Sequence Diagrams

Bộ Sequence Diagram của LSOUL dùng **UML classic, đơn sắc**.

Mỗi Sequence có 2 nguồn editable:

- `.drawio` — mở trực tiếp bằng draw.io / diagrams.net.
- `.puml` — PlantUML source, thuận tiện import/chuyển đổi trong các công cụ UML như Visual Paradigm.

## Quy ước

- Lifeline dọc nét đứt.
- Request: mũi tên liền; response: nét đứt.
- Database chỉ nhận truy vấn/ghi dữ liệu; **không vẽ mũi tên đi ra từ PostgreSQL**.
- Dữ liệu trả về được biểu diễn từ Service/API đi lên tầng gọi.
- `alt`, `opt` dùng combined fragment khi có điều kiện.
- Không dùng màu trang trí.

## Danh sách 20 Sequence

- `SEQ-01-Dang-nhap.drawio` + `.puml` — ĐĂNG NHẬP — UC02
- `SEQ-02-Dang-ky-Dang-xuat.drawio` + `.puml` — ĐĂNG KÝ & ĐĂNG XUẤT — UC01, UC03
- `SEQ-03-Quen-va-Dat-lai-mat-khau.drawio` + `.puml` — QUÊN & ĐẶT LẠI MẬT KHẨU — UC04, UC05
- `SEQ-04-Quan-ly-Tai-khoan.drawio` + `.puml` — QUẢN LÝ TÀI KHOẢN — UC06, UC07, UC08
- `SEQ-05-Kham-pha-San-pham.drawio` + `.puml` — KHÁM PHÁ & LỰA CHỌN SẢN PHẨM — UC09–UC15
- `SEQ-06-Yeu-thich-va-Phoi-do.drawio` + `.puml` — YÊU THÍCH & PHỐI TRANG PHỤC — UC16, UC17, UC18
- `SEQ-07-Thu-do-AI.drawio` + `.puml` — THỬ TRANG PHỤC BẰNG AI — UC19, UC20, UC21, UC22
- `SEQ-08-Danh-gia-Outfit-AI.drawio` + `.puml` — ĐÁNH GIÁ OUTFIT & PHẢN HỒI AI STYLIST — UC20.1, UC20.2
- `SEQ-09-Gio-hang-va-Coupon.drawio` + `.puml` — GIỎ HÀNG & MÃ GIẢM GIÁ — UC23, UC24, UC25
- `SEQ-10-Dat-hang.drawio` + `.puml` — ĐẶT HÀNG — UC26, UC27
- `SEQ-11-Thanh-toan-VietQR.drawio` + `.puml` — THANH TOÁN VIETQR / SEPAY — UC28
- `SEQ-12-Don-hang-va-Danh-gia.drawio` + `.puml` — LỊCH SỬ, THEO DÕI ĐƠN & ĐÁNH GIÁ — UC29, UC30, UC31
- `SEQ-13-Tro-ly-Mua-sam-AI.drawio` + `.puml` — TRỢ LÝ MUA SẮM AI — UC32, UC33
- `SEQ-14-Lich-su-Tro-chuyen-AI.drawio` + `.puml` — QUẢN LÝ LỊCH SỬ TRÒ CHUYỆN AI — UC34
- `SEQ-15-Quan-tri-He-thong.drawio` + `.puml` — QUẢN TRỊ SẢN PHẨM & BÁN HÀNG — UC35, UC36
- `SEQ-16-Chi-tiet-San-pham-va-Bien-the.drawio` + `.puml` — CHI TIẾT SẢN PHẨM & BIẾN THỂ — UC13, UC14, UC15
- `SEQ-17-Dieu-chinh-sau-Thu-do-va-Them-Outfit.drawio` + `.puml` — ĐIỀU CHỈNH SAU TRY-ON & THÊM OUTFIT — UC21, UC22
- `SEQ-18-AI-Thuc-thi-Thao-tac-Mua-sam.drawio` + `.puml` — AI THỰC THI THAO TÁC MUA SẮM — UC33
- `SEQ-19-Quan-tri-San-pham-va-Ton-kho.drawio` + `.puml` — QUẢN TRỊ SẢN PHẨM & TỒN KHO — UC35
- `SEQ-20-Quan-tri-Don-hang-va-Ban-hang.drawio` + `.puml` — QUẢN TRỊ ĐƠN HÀNG & BÁN HÀNG — UC36

## Mapping Use Case → Sequence

| Use Case | Sequence |
|---|---|
| UC01 | SEQ-02 |
| UC02 | SEQ-01 |
| UC03 | SEQ-02 |
| UC04 | SEQ-03 |
| UC05 | SEQ-03 |
| UC06 | SEQ-04 |
| UC07 | SEQ-04 |
| UC08 | SEQ-04 |
| UC09 | SEQ-05 |
| UC10 | SEQ-05 |
| UC11 | SEQ-05 |
| UC12 | SEQ-05 |
| UC13 | SEQ-05, SEQ-16 |
| UC14 | SEQ-05, SEQ-16 |
| UC15 | SEQ-05, SEQ-16 |
| UC16 | SEQ-06 |
| UC17 | SEQ-06 |
| UC18 | SEQ-06 |
| UC19 | SEQ-07 |
| UC20 | SEQ-07 |
| UC20.1 | SEQ-08 |
| UC20.2 | SEQ-08 |
| UC21 | SEQ-07, SEQ-17 |
| UC22 | SEQ-07, SEQ-17 |
| UC23 | SEQ-09 |
| UC24 | SEQ-09 |
| UC25 | SEQ-09 |
| UC26 | SEQ-10 |
| UC27 | SEQ-10 |
| UC28 | SEQ-11 |
| UC29 | SEQ-12 |
| UC30 | SEQ-12 |
| UC31 | SEQ-12 |
| UC32 | SEQ-13 |
| UC33 | SEQ-13, SEQ-18 |
| UC34 | SEQ-14 |
| UC35 | SEQ-15, SEQ-19 |
| UC36 | SEQ-15, SEQ-20 |

**Kết quả:** 20 Sequence Diagram, đủ bao phủ UC01–UC36 và UC20.1/UC20.2; các flow core được tách chi tiết ở SEQ-16 → SEQ-20.
