# Use Case toàn hệ thống – Website thương mại điện tử thời trang LSOUL

> Phạm vi đồ án: website thương mại điện tử thời trang có tìm kiếm/sản phẩm, giỏ hàng – đặt hàng – thanh toán, trợ lý mua sắm AI, phối đồ và Virtual Try-On AI.  
> Social Commerce không nằm trong phạm vi Use Case chính thức của đồ án.

## 1. Actor của hệ thống

### A01 – Người dùng mua sắm
Actor tổng quát cho các chức năng mua sắm mà cả khách chưa đăng nhập và khách đã đăng nhập đều có thể thực hiện.

### A02 – Khách truy cập
Người chưa đăng nhập. Là actor chuyên biệt của **Người dùng mua sắm**.

### A03 – Khách hàng
Người đã đăng nhập. Là actor chuyên biệt của **Người dùng mua sắm**, đồng thời có thêm các chức năng cá nhân như hồ sơ, địa chỉ, lịch sử đơn hàng, đánh giá và lịch sử chat AI.

### A04 – Quản trị viên
Quản lý dữ liệu sản phẩm, biến thể, tồn kho và hoạt động bán hàng.

### A05 – Dịch vụ AI Try-On
Hệ thống ngoài thực hiện Virtual Try-On. Triển khai hiện tại có thể dùng FASHN API hoặc Hugging Face FASHN VTON/ZeroGPU.

### A06 – Dịch vụ AI tư vấn & Stylist
Hệ thống AI ngoài hỗ trợ tư vấn mua sắm và phân tích outfit. Triển khai hiện tại dùng Gemini khi có cấu hình; phần Stylist có metadata/profile fallback.

### A07 – Dịch vụ thanh toán
Hệ thống ngoài tham gia xác nhận thanh toán, ví dụ SePay/ngân hàng. VietQR là phương thức hiển thị QR thanh toán trong hệ thống.

## 2. Nhóm Use Case

| Nhóm | Tên nhóm | Use Case chính | Actor chính |
|---|---|---|---|
| G01 | Tài khoản | UC01–UC08 | Khách truy cập, Khách hàng |
| G02 | Khám phá & lựa chọn sản phẩm | UC09–UC15 | Người dùng mua sắm |
| G03 | Yêu thích, phối đồ & thử đồ AI | UC16–UC22 + UC20.1, UC20.2 | Người dùng mua sắm, AI Try-On, AI Stylist |
| G04 | Giỏ hàng, đơn hàng & thanh toán | UC23–UC31 | Người dùng mua sắm, Khách hàng, Dịch vụ thanh toán |
| G05 | Trợ lý mua sắm AI | UC32–UC34 | Người dùng mua sắm, Khách hàng, AI tư vấn |
| G06 | Quản trị | UC35–UC36 | Quản trị viên |

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

Hai Use Case mở rộng của UC20:

| Mã | Use Case | Actor |
|---|---|---|
| UC20.1 | Xem đánh giá độ phù hợp của outfit | Người dùng mua sắm, Dịch vụ AI tư vấn & Stylist |
| UC20.2 | Phản hồi đánh giá AI Stylist | Người dùng mua sắm |

Quy tắc outfit:
- Áo + quần/chân váy + áo khoác tùy chọn.
- Hoặc một váy/đầm hoàn chỉnh.
- Độ phù hợp chỉ được đánh giá **sau khi outfit hoàn chỉnh đã được Virtual Try-On**.

### G04 – Giỏ hàng, đơn hàng & thanh toán

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
| UC31 | Đánh giá sản phẩm đã mua | Khách hàng |

### G05 – Trợ lý mua sắm AI

| Mã | Use Case | Actor |
|---|---|---|
| UC32 | Tư vấn sản phẩm và phối đồ bằng AI | Người dùng mua sắm, Dịch vụ AI tư vấn & Stylist |
| UC33 | Thực hiện thao tác mua sắm qua trợ lý AI | Người dùng mua sắm, Dịch vụ AI tư vấn & Stylist |
| UC34 | Quản lý lịch sử trò chuyện AI | Khách hàng |

### G06 – Quản trị

| Mã | Use Case | Actor |
|---|---|---|
| UC35 | Quản lý sản phẩm, biến thể và tồn kho | Quản trị viên |
| UC36 | Quản lý bán hàng | Quản trị viên |

UC35 bao gồm: thêm/sửa sản phẩm, quản lý biến thể màu/cỡ, trạng thái bán và tồn kho.

UC36 bao gồm: quản lý đơn hàng, khách hàng, mã giảm giá, đánh giá sản phẩm và thống kê bán hàng cơ bản.

## 4. Quan hệ Use Case cần thể hiện trên sơ đồ nhóm

### G02
- UC10, UC11, UC12 là các cách mở rộng việc xem danh sách sản phẩm UC09.
- UC14 và UC15 phát sinh khi xem chi tiết sản phẩm UC13.

### G03
- UC20 bao gồm UC18 và UC19.
- UC20 bao gồm UC20.1 sau khi Try-On thành công.
- UC20.2 mở rộng UC20.1 khi người dùng muốn phản hồi.
- UC21 mở rộng UC20 khi người dùng muốn đổi biến thể và thử lại.
- UC22 mở rộng UC20 khi người dùng muốn mua cả outfit.

### G04
- UC26 bao gồm UC27.
- UC28 mở rộng UC27 khi người dùng chọn phương thức VietQR.
- UC31 chỉ khả dụng cho khách hàng đã mua sản phẩm.

### G05
- UC33 mở rộng UC32: sau khi AI tư vấn, người dùng có thể yêu cầu AI thực hiện thao tác mua sắm.
- UC34 chỉ dành cho khách hàng đăng nhập.

## 5. Xử lý nội bộ không tách thành Use Case

Không tạo Use Case độc lập cho các xử lý kỹ thuật sau:

- Hash mật khẩu, cookie/session và phân quyền.
- Đồng bộ cart/wishlist local với tài khoản.
- Kiểm tra tồn kho theo biến thể.
- Tính lại giá và kiểm tra coupon phía server.
- Transaction tạo đơn/trừ tồn.
- Tạo token đặt lại mật khẩu.
- Xác minh webhook thanh toán.
- Nén/kiểm tra ảnh đầu vào Try-On.
- Chọn provider FASHN API hoặc Hugging Face fallback.
- Gọi nhiều pass AI cho outfit nhiều món.
- Ghi BehaviorEvent, ProductAffinity và rebuild UserStyleProfile.
- Lưu OutfitAssessment.
- Retrieval/prompt nội bộ của trợ lý AI.

## 6. Thứ tự tạo sơ đồ UML

1. `UC-00-Tong-quan-he-thong.drawio` – toàn bộ actor, 6 nhóm chức năng và 36 Use Case chính.
2. `UC-G01-Tai-khoan.drawio`.
3. `UC-G02-San-pham.drawio`.
4. `UC-G03-Phoi-do-Thu-do-AI.drawio`.
5. `UC-G04-Gio-hang-Don-hang-Thanh-toan.drawio`.
6. `UC-G05-Tro-ly-AI.drawio`.
7. `UC-G06-Quan-tri.drawio`.
8. Chỉ sau khi bộ Use Case được duyệt mới bắt đầu tạo Sequence Diagram.

Tổng số Use Case chính thức: **36**. UC20.1 và UC20.2 là Use Case mở rộng thuộc UC20.
