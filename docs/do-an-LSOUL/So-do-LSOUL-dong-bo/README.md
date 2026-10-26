# Bộ sơ đồ LSOUL

Bộ bàn giao gồm 7 sơ đồ use case, 24 sơ đồ tuần tự và 10 sơ đồ hỗ trợ.

## Mở và chỉnh sửa

- **draw.io:** File → Open from → Device, chọn `LSOUL-Tat-ca-so-do.drawio` hoặc một tệp trong `drawio/`.
- **Visual Paradigm Online:** chọn mũi tên cạnh Create New → Import / Open → Import draw.io, rồi chọn `LSOUL-Tat-ca-so-do.xml` hoặc một tệp trong `visual-paradigm-online/`. Sau khi mở, lưu vào dự án của bạn.
- Mỗi tệp trọn bộ có 41 trang. Mỗi trang tương ứng một sơ đồ. Các đối tượng là chữ, khung, ký hiệu và đường nối có thể chỉnh sửa riêng.
- `Xem-truoc.html` là danh mục để xem và tìm sơ đồ trên máy.

## Ảnh đưa vào Word

- `anh-svg/`: ảnh vector; phóng to không vỡ nét.
- `anh-png/`: ảnh nền trắng, 216 dpi, có nhúng dữ liệu sơ đồ để mở lại trong draw.io.
- `pdf/`: bản vector của từng sơ đồ.
- Chú thích và số hình đặt trong Word, không lặp lại thành tiêu đề lớn bên trong ảnh.
- Toàn bộ chữ và nét đen, nền trắng; phông Times New Roman, cỡ 13 trong bản sơ đồ. Khi thu nhỏ ảnh để đưa vào Word, kích thước chữ nhìn thấy cũng giảm theo.

## Quy ước

- Use case: tác nhân ở ngoài khung; chức năng là hình elip; include và extend dùng mũi tên nét đứt; chuyên biệt hóa dùng tam giác rỗng.
- Tuần tự: tác nhân, giao diện, điều khiển và dữ liệu; đường sống nét đứt; thanh kích hoạt; lời gọi nét liền và phản hồi nét đứt.
- ERD: chỉ vẽ liên kết khóa ngoại; ghi lực lượng ở hai đầu; dữ liệu JSON không tạo bảng nối.

Hướng dẫn nhập định dạng: [Visual Paradigm Online](https://knowhow.visual-paradigm.com/technical-support/import-diagrams-draw-io-vp-online/), [draw.io](https://www.drawio.com/docs/manual/import/import-formats/).
