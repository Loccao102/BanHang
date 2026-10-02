# Sequence Diagrams

Bộ Sequence Diagram của LSOUL dùng UML classic, đơn sắc. Mỗi Sequence có bản `.drawio` và `.puml`.

## Quy ước
- Request: mũi tên liền; response: nét đứt.
- Database chỉ nhận truy vấn/ghi dữ liệu; **không vẽ mũi tên đi ra từ PostgreSQL**.
- Dữ liệu trả về được biểu diễn từ Service/API đi lên tầng gọi.
- Dùng `alt`, `opt` khi cần.

## Danh sách 20 Sequence
- SEQ-01 Đăng nhập — UC02
- SEQ-02 Đăng ký & đăng xuất — UC01, UC03
- SEQ-03 Quên & đặt lại mật khẩu — UC04, UC05
- SEQ-04 Quản lý tài khoản — UC06–UC08
- SEQ-05 Khám phá sản phẩm — UC09–UC15
- SEQ-06 Yêu thích & phối đồ — UC16–UC18
- SEQ-07 Thử đồ AI — UC19–UC22
- SEQ-08 Đánh giá outfit AI — UC20.1, UC20.2
- SEQ-09 Giỏ hàng & coupon — UC23–UC25
- SEQ-10 Đặt hàng — UC26, UC27
- SEQ-11 Thanh toán VietQR — UC28
- SEQ-12 Lịch sử & theo dõi đơn hàng — UC29, UC30
- SEQ-13 Trợ lý mua sắm AI — UC31, UC32
- SEQ-14 Lịch sử trò chuyện AI — UC33
- SEQ-15 Quản trị hệ thống — UC34, UC35
- SEQ-16 Chi tiết sản phẩm & biến thể — UC13–UC15
- SEQ-17 Điều chỉnh sau Try-On & thêm outfit — UC21, UC22
- SEQ-18 AI thực thi thao tác mua sắm — UC32
- SEQ-19 Quản trị sản phẩm & tồn kho — UC34
- SEQ-20 Quản trị bán hàng & phân tích — UC35, UC36

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
| UC09–UC12 | SEQ-05 |
| UC13–UC15 | SEQ-05, SEQ-16 |
| UC16–UC18 | SEQ-06 |
| UC19–UC20 | SEQ-07 |
| UC20.1–UC20.2 | SEQ-08 |
| UC21–UC22 | SEQ-07, SEQ-17 |
| UC23–UC25 | SEQ-09 |
| UC26–UC27 | SEQ-10 |
| UC28 | SEQ-11 |
| UC29–UC30 | SEQ-12 |
| UC31 | SEQ-13 |
| UC32 | SEQ-13, SEQ-18 |
| UC33 | SEQ-14 |
| UC34 | SEQ-15, SEQ-19 |
| UC35 | SEQ-15, SEQ-20 |
| UC36 | SEQ-20 |
