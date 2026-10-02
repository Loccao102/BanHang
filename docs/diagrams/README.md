# UML diagrams – LSOUL

Bộ UML của dự án được duy trì **song song ở hai định dạng editable**:

1. **draw.io / diagrams.net**  
   - Lưu trực tiếp trong GitHub dưới dạng `.drawio`.
   - Đây là bản nguồn chính để version control, backup và chỉnh sửa lâu dài.

2. **FigJam**  
   - Dùng để review trực quan, kéo thả và chỉnh nhanh trên canvas.
   - Mọi thay đổi quan trọng sẽ được đồng bộ lại về file `.drawio` trong GitHub.

## Quy trình

1. Chốt Use Case toàn hệ thống.
2. Chia Use Case theo nhóm chức năng và actor.
3. Hoàn thiện/duyệt toàn bộ Use Case.
4. Sau đó mới bắt đầu Sequence Diagram.
5. Mỗi sơ đồ mới phải có cả:
   - bản `.drawio` trong GitHub;
   - bản FigJam editable.

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

## Actor chuẩn

- A01 – Người dùng mua sắm.
- A02 – Khách truy cập.
- A03 – Khách hàng.
- A04 – Quản trị viên.
- A05 – Dịch vụ AI Try-On.
- A06 – Dịch vụ AI tư vấn & Stylist.
- A07 – Dịch vụ thanh toán.

Chi tiết mapping nằm trong `docs/USE_CASES.md`.

## FigJam

Board FigJam hiện tại:
https://www.figma.com/board/RpD76jtjbKzyJcrJsY1vwm

Tên board: `LSOUL - UML Use Cases`

FigJam không thay thế draw.io. Hai bản được duy trì song song.

## Sequence Diagram

Chưa tạo. Sequence sẽ được xây dựng sau khi bộ Use Case phía trên được duyệt và chốt.
