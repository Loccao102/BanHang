# UML diagrams – LSOUL

Toàn bộ sơ đồ trong thư mục này là file **.drawio editable trực tiếp** bằng diagrams.net / draw.io.

## Quy trình

1. Chốt Use Case toàn hệ thống.
2. Chia Use Case theo nhóm chức năng và actor.
3. Hoàn thiện/duyệt toàn bộ Use Case.
4. Sau đó mới bắt đầu Sequence Diagram.

Hiện tại **chưa tạo Sequence Diagram** theo đúng quy trình trên.

## Use Case tổng quan

- `usecase/UC-00-Tong-quan-he-thong.drawio`
  - Toàn bộ hệ thống.
  - 7 actor.
  - 6 nhóm chức năng.
  - 36 Use Case chính.
  - UC20.1 và UC20.2 là Use Case mở rộng của UC20.

## Use Case theo nhóm

- `usecase/UC-G01-Tai-khoan.drawio`
  - UC01–UC08.
  - Actor: Khách truy cập, Khách hàng.

- `usecase/UC-G02-San-pham.drawio`
  - UC09–UC15.
  - Actor: Người dùng mua sắm.

- `usecase/UC-G03-Phoi-do-Thu-do-AI.drawio`
  - UC16–UC22, UC20.1, UC20.2.
  - Actor: Người dùng mua sắm, Dịch vụ AI Try-On, Dịch vụ AI tư vấn & Stylist.

- `usecase/UC-G04-Gio-hang-Don-hang-Thanh-toan.drawio`
  - UC23–UC31.
  - Actor: Người dùng mua sắm, Khách hàng, Dịch vụ thanh toán.

- `usecase/UC-G05-Tro-ly-AI.drawio`
  - UC32–UC34.
  - Actor: Người dùng mua sắm, Khách hàng, Dịch vụ AI tư vấn & Stylist.

- `usecase/UC-G06-Quan-tri.drawio`
  - UC35–UC36.
  - Actor: Quản trị viên.
  - Có các Use Case con để thể hiện phạm vi của UC35/UC36 nhưng không tăng số Use Case chính thức.

## Actor chuẩn

- A01 – Người dùng mua sắm.
- A02 – Khách truy cập.
- A03 – Khách hàng.
- A04 – Quản trị viên.
- A05 – Dịch vụ AI Try-On.
- A06 – Dịch vụ AI tư vấn & Stylist.
- A07 – Dịch vụ thanh toán.

Chi tiết và bảng mapping nằm trong `docs/USE_CASES.md`.

## Sequence Diagram

Chưa tạo. Sequence sẽ được xây dựng sau khi bộ Use Case phía trên được duyệt và chốt.
