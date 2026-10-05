# Use Case toàn hệ thống – Website thương mại điện tử thời trang LSOUL

> Phạm vi đồ án: website thương mại điện tử thời trang có tìm kiếm/sản phẩm, giỏ hàng – đặt hàng – thanh toán, trợ lý mua sắm AI, phối đồ và Virtual Try-On AI. Social Commerce không nằm trong phạm vi Use Case chính thức.

## 1. Actor của hệ thống

- **A01 – Người dùng mua sắm:** actor tổng quát cho các chức năng mua sắm.
- **A02 – Khách truy cập:** người chưa đăng nhập, chuyên biệt của A01. Phạm vi: xem catalog, tìm kiếm, xem chi tiết sản phẩm và chat tư vấn ở chế độ khách (không lưu lịch sử). Các thao tác ghi dữ liệu — giỏ hàng, yêu thích, áp mã, đặt hàng, thanh toán, thử đồ, lưu hội thoại — **yêu cầu đăng nhập** với vai trò A03. Hệ thống không hỗ trợ mua hàng ẩn danh (guest checkout).
- **A03 – Khách hàng:** người đã đăng nhập, có thêm hồ sơ, địa chỉ, lịch sử đơn hàng và lịch sử chat AI.
- **A04 – Quản trị viên:** quản lý catalog, vận hành bán hàng, khách hàng, ưu đãi và theo dõi analytics.
- **A05 – Dịch vụ AI Try-On:** FASHN API hoặc Hugging Face FASHN VTON.
- **A06 – Dịch vụ AI tư vấn & Stylist:** Gemini và logic Stylist/personalization.
- **A07 – Dịch vụ thanh toán:** SePay/ngân hàng, xác nhận VietQR.

## 2. Nhóm Use Case

| Nhóm | Tên nhóm | Use Case chính | Actor chính |
|---|---|---|---|
| G01 | Tài khoản | UC01–UC08 | Khách truy cập, Khách hàng |
| G02 | Khám phá & lựa chọn sản phẩm | UC09–UC15 | Người dùng mua sắm |
| G03 | Yêu thích, phối đồ & thử đồ AI | UC16–UC22 + UC20.1, UC20.2 | Người dùng mua sắm, AI Try-On, AI Stylist |
| G04 | Giỏ hàng, đơn hàng & thanh toán | UC23–UC30 | Người dùng mua sắm, Khách hàng, Dịch vụ thanh toán |
| G05 | Trợ lý mua sắm AI | UC31–UC33 | Người dùng mua sắm, Khách hàng, AI tư vấn |
| G06 | Quản trị | UC34–UC36 | Quản trị viên |

## 3. Danh sách 36 Use Case chính

### G01 – Tài khoản
| Mã | Use Case | Actor |
|---|---|---|
| UC01 | Đăng ký tài khoản | Khách truy cập |
| UC02 | Đăng nhập | Khách truy cập |
| UC03 | Đăng xuất | Khách hàng |
| UC04 | Quên mật khẩu | Khách truy cập |
| UC05 | Đặt lại mật khẩu | Khách truy cập |
| UC06 | Quản lý thông tin cá nhân | Khách hàng |
| UC07 | Đổi mật khẩu | Khách hàng |
| UC08 | Quản lý địa chỉ nhận hàng | Khách hàng |

### G02 – Khám phá & lựa chọn sản phẩm
| Mã | Use Case | Actor |
|---|---|---|
| UC09 | Xem danh sách sản phẩm | Người dùng mua sắm |
| UC10 | Tìm kiếm sản phẩm | Người dùng mua sắm |
| UC11 | Lọc sản phẩm | Người dùng mua sắm |
| UC12 | Sắp xếp sản phẩm | Người dùng mua sắm |
| UC13 | Xem chi tiết sản phẩm | Người dùng mua sắm |
| UC14 | Chọn màu sản phẩm | Người dùng mua sắm |
| UC15 | Chọn cỡ sản phẩm | Người dùng mua sắm |

### G03 – Yêu thích, phối đồ & thử đồ AI
| Mã | Use Case | Actor |
|---|---|---|
| UC16 | Thêm / xóa sản phẩm yêu thích | Người dùng mua sắm |
| UC17 | Xem danh sách yêu thích theo nhóm | Người dùng mua sắm |
| UC18 | Phối trang phục | Người dùng mua sắm |
| UC19 | Tải ảnh người dùng để thử đồ | Người dùng mua sắm |
| UC20 | Thử trang phục bằng AI | Người dùng mua sắm, Dịch vụ AI Try-On |
| UC21 | Điều chỉnh màu và cỡ sau khi thử | Người dùng mua sắm |
| UC22 | Thêm cả bộ trang phục vào giỏ | Người dùng mua sắm |

Use Case mở rộng của UC20:
| Mã | Use Case | Actor |
|---|---|---|
| UC20.1 | Xem đánh giá độ phù hợp của outfit | Người dùng mua sắm, AI Stylist |
| UC20.2 | Phản hồi đánh giá AI Stylist | Người dùng mua sắm |

### G04 – Giỏ hàng, đơn hàng & thanh toán

> Ghi chú: UC23–UC28 chỉ thực hiện được khi đã đăng nhập (actor A03 – Khách hàng). Khách truy cập (A02) chỉ xem được sản phẩm và được điều hướng sang trang đăng nhập khi thao tác mua hàng.

| Mã | Use Case | Actor |
|---|---|---|
| UC23 | Thêm sản phẩm vào giỏ hàng | Người dùng mua sắm |
| UC24 | Cập nhật giỏ hàng | Người dùng mua sắm |
| UC25 | Áp mã giảm giá | Người dùng mua sắm |
| UC26 | Đặt hàng | Người dùng mua sắm |
| UC27 | Chọn phương thức thanh toán | Người dùng mua sắm |
| UC28 | Thanh toán bằng VietQR | Người dùng mua sắm, Dịch vụ thanh toán |
| UC29 | Xem lịch sử đơn hàng | Khách hàng |
| UC30 | Theo dõi trạng thái đơn hàng | Khách hàng |

### G05 – Trợ lý mua sắm AI
| Mã | Use Case | Actor |
|---|---|---|
| UC31 | Tư vấn sản phẩm và phối đồ bằng AI | Người dùng mua sắm, AI tư vấn & Stylist |
| UC32 | Thực hiện thao tác mua sắm qua trợ lý AI | Người dùng mua sắm, AI tư vấn & Stylist |
| UC33 | Quản lý lịch sử trò chuyện AI | Khách hàng |

### G06 – Quản trị
| Mã | Use Case | Actor |
|---|---|---|
| UC34 | Quản lý sản phẩm, biến thể và tồn kho | Quản trị viên |
| UC35 | Quản lý bán hàng và vận hành | Quản trị viên |
| UC36 | Theo dõi phân tích kinh doanh và AI | Quản trị viên |

- **UC34** gồm thêm/sửa/ẩn sản phẩm, biến thể màu/cỡ, tồn kho và metadata phục vụ AI/Virtual Try-On.
- **UC35** gồm quản lý đơn hàng, hoàn tồn khi hủy, trạng thái thanh toán/vận chuyển, khách hàng và mã giảm giá.
- **UC36** gồm sales analytics, top sản phẩm, doanh thu đã thu, trạng thái đơn/thanh toán, Try-On health, AI Stylist feedback và personalization signals.

## 4. Quan hệ Use Case

### G02
- UC10, UC11, UC12 mở rộng UC09.
- UC14 và UC15 phát sinh khi xem chi tiết UC13.

### G03
- UC20 bao gồm UC18 và UC19.
- UC20 bao gồm UC20.1 sau khi Try-On thành công.
- UC20.2 mở rộng UC20.1.
- UC21 và UC22 mở rộng UC20.

### G04
- UC26 bao gồm UC27.
- UC28 mở rộng UC27 khi chọn VietQR.

### G05
- UC32 mở rộng UC31 sau khi AI tư vấn.
- UC33 chỉ dành cho khách hàng đăng nhập.

## 5. Xử lý nội bộ không tách thành Use Case

Không tách riêng: hash mật khẩu, cookie/session, đồng bộ cart/wishlist, kiểm tra tồn kho, tính giá/coupon server-side, transaction tạo đơn/trừ hoặc hoàn tồn, reset token, webhook payment, kiểm tra ảnh Try-On, chọn provider AI, ghi BehaviorEvent/ProductAffinity, rebuild UserStyleProfile, lưu OutfitAssessment, retrieval/prompt nội bộ.

## 6. Bộ sơ đồ

1. UC-00 tổng quan.
2. UC-G01 Tài khoản.
3. UC-G02 Sản phẩm.
4. UC-G03 Phối đồ & Try-On AI.
5. UC-G04 Giỏ hàng – đơn hàng – thanh toán.
6. UC-G05 Trợ lý AI.
7. UC-G06 Quản trị.

Tổng số Use Case chính thức: **36**. UC20.1 và UC20.2 là Use Case mở rộng thuộc UC20.
