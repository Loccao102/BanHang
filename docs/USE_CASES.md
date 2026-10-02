# Use Case cốt lõi – Website thương mại điện tử thời trang LSOUL

> Phạm vi đồ án: website thương mại điện tử thời trang có trợ lý mua sắm AI và thử đồ AI.  
> **Không đưa Social Commerce vào phạm vi đề tài và không liệt kê các chức năng Social Commerce trong Use Case chính thức.**

## Actor

- **Khách truy cập**: người chưa đăng nhập.
- **Khách hàng**: người đã có tài khoản và đăng nhập.
- **Quản trị viên**: người quản lý hoạt động bán hàng của hệ thống.
- **Dịch vụ AI / thanh toán**: hệ thống ngoài hỗ trợ một số luồng nghiệp vụ, không coi là actor nghiệp vụ chính khi thống kê số Use Case.

## Danh sách 36 Use Case cốt lõi

### A. Tài khoản khách hàng

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

### B. Khám phá và lựa chọn sản phẩm

| Mã | Use Case | Actor |
|---|---|---|
| UC09 | Xem danh sách sản phẩm | Khách truy cập / Khách hàng |
| UC10 | Tìm kiếm sản phẩm | Khách truy cập / Khách hàng |
| UC11 | Lọc sản phẩm | Khách truy cập / Khách hàng |
| UC12 | Sắp xếp sản phẩm | Khách truy cập / Khách hàng |
| UC13 | Xem chi tiết sản phẩm | Khách truy cập / Khách hàng |
| UC14 | Chọn màu sản phẩm | Khách truy cập / Khách hàng |
| UC15 | Chọn cỡ sản phẩm | Khách truy cập / Khách hàng |

### C. Yêu thích, phối đồ và thử đồ AI

| Mã | Use Case | Actor |
|---|---|---|
| UC16 | Thêm / xóa sản phẩm yêu thích | Khách truy cập / Khách hàng |
| UC17 | Xem danh sách yêu thích theo nhóm | Khách truy cập / Khách hàng |
| UC18 | Phối trang phục từ danh sách yêu thích | Khách truy cập / Khách hàng |
| UC19 | Tải ảnh người dùng để thử đồ | Khách truy cập / Khách hàng |
| UC20 | Thử trang phục bằng AI | Khách truy cập / Khách hàng |
| UC21 | Điều chỉnh màu và cỡ sau khi thử | Khách truy cập / Khách hàng |
| UC22 | Thêm cả bộ trang phục vào giỏ | Khách truy cập / Khách hàng |

### D. Giỏ hàng, đặt hàng và thanh toán

| Mã | Use Case | Actor |
|---|---|---|
| UC23 | Thêm sản phẩm vào giỏ hàng | Khách truy cập / Khách hàng |
| UC24 | Cập nhật giỏ hàng | Khách truy cập / Khách hàng |
| UC25 | Áp mã giảm giá | Khách truy cập / Khách hàng |
| UC26 | Đặt hàng | Khách truy cập / Khách hàng |
| UC27 | Chọn phương thức thanh toán | Khách truy cập / Khách hàng |
| UC28 | Thanh toán bằng VietQR | Khách truy cập / Khách hàng |
| UC29 | Xem lịch sử đơn hàng | Khách hàng |
| UC30 | Theo dõi trạng thái đơn hàng | Khách hàng |
| UC31 | Đánh giá sản phẩm đã mua | Khách hàng |

### E. Trợ lý mua sắm AI

| Mã | Use Case | Actor |
|---|---|---|
| UC32 | Tư vấn sản phẩm và phối đồ bằng AI | Khách truy cập / Khách hàng |
| UC33 | Thực hiện thao tác mua sắm qua trợ lý AI | Khách truy cập / Khách hàng |
| UC34 | Quản lý lịch sử trò chuyện AI | Khách hàng |

### F. Quản trị

| Mã | Use Case | Actor |
|---|---|---|
| UC35 | Quản lý sản phẩm, biến thể và tồn kho | Quản trị viên |
| UC36 | Quản lý bán hàng | Quản trị viên |

## Phạm vi của các Use Case gộp

### UC08 – Quản lý địa chỉ nhận hàng
Bao gồm: thêm địa chỉ, sửa địa chỉ, xóa địa chỉ, đặt địa chỉ mặc định.

### UC17 – Xem danh sách yêu thích theo nhóm
Các nhóm chính:
- Áo / corset.
- Quần & chân váy.
- Váy / đầm.
- Áo khoác.
- Set nguyên bộ.

### UC18 – Phối trang phục
Quy tắc chính:
- Áo + quần/chân váy + áo khoác tùy chọn.
- Váy/đầm là một bộ riêng.
- Set nguyên bộ là một bộ riêng.
- Quần và chân váy dùng chung một vị trí phối đồ.

### UC20 – Thử trang phục bằng AI
Bao gồm kiểm tra ảnh đầu vào, gửi ảnh và trang phục tới dịch vụ AI, nhận kết quả thử đồ và hiển thị ảnh kết quả.

### UC24 – Cập nhật giỏ hàng
Bao gồm thay đổi số lượng và xóa sản phẩm khỏi giỏ.

### UC33 – Thực hiện thao tác mua sắm qua trợ lý AI
Có thể gồm:
- Tìm sản phẩm.
- Chọn sản phẩm được đề xuất.
- Thêm sản phẩm hoặc cả bộ vào giỏ.
- Áp mã giảm giá.
- Mở đơn hàng.
- Chuyển tới trang thanh toán.

Các thao tác nhỏ trên không tách thành Use Case riêng để giữ sơ đồ ở mức đồ án.

### UC35 – Quản lý sản phẩm, biến thể và tồn kho
Bao gồm thêm/sửa sản phẩm, quản lý màu, cỡ, trạng thái bán và tồn kho.

### UC36 – Quản lý bán hàng
Bao gồm:
- Quản lý đơn hàng.
- Quản lý khách hàng.
- Quản lý mã giảm giá.
- Quản lý đánh giá sản phẩm.
- Xem thống kê bán hàng cơ bản.

## Các xử lý nội bộ không tách thành Use Case

Những xử lý sau có trong hệ thống nhưng không nên đưa thành Use Case độc lập:

- Hash mật khẩu và quản lý phiên đăng nhập.
- Xác minh quyền truy cập.
- Đồng bộ giỏ hàng / yêu thích lên tài khoản.
- Kiểm tra tồn kho theo biến thể.
- Tính lại giá phía server.
- Kiểm tra điều kiện mã giảm giá.
- Transaction khi tạo đơn và trừ tồn kho.
- Tạo / kiểm tra mã đặt lại mật khẩu.
- Xác minh webhook thanh toán.
- Kiểm tra trạng thái thanh toán.
- Nén và kiểm tra ảnh trước khi thử đồ AI.
- Gọi FASHN và xử lý nhiều lượt thử đồ.
- Lưu lịch sử hội thoại AI.

## Gợi ý chia sơ đồ Use Case

1. **Tài khoản khách hàng** – UC01 đến UC08.
2. **Sản phẩm & mua sắm** – UC09 đến UC15, UC23 đến UC31.
3. **Yêu thích & thử đồ AI** – UC16 đến UC22.
4. **Trợ lý mua sắm AI** – UC32 đến UC34.
5. **Quản trị hệ thống** – UC35 đến UC36.

Tổng số Use Case chính thức: **36**.
