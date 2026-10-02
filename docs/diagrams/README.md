# UML diagrams – LSOUL

Bộ UML chính thức của dự án lưu dưới dạng **draw.io / diagrams.net** trong GitHub để version control và chỉnh sửa lâu dài.

## Use Case Diagram

Toàn bộ Use Case dùng phong cách **UML classic, đơn sắc**:

- Actor người dùng/quản trị viên dùng stick figure và đặt ngoài system boundary.
- External system đặt ngoài boundary.
- Use Case dùng ellipse nền trắng, viền đen.
- Association dùng đường thẳng.
- `<<include>>` và `<<extend>>` dùng nét đứt có mũi tên.

### Bộ Use Case đã hoàn tất

- `usecase/UC-00-Tong-quan-he-thong.drawio`
- `usecase/UC-G01-Tai-khoan.drawio` — UC01–UC08
- `usecase/UC-G02-San-pham.drawio` — UC09–UC15
- `usecase/UC-G03-Phoi-do-Thu-do-AI.drawio` — UC16–UC22, UC20.1, UC20.2
- `usecase/UC-G04-Gio-hang-Don-hang-Thanh-toan.drawio` — UC23–UC31
- `usecase/UC-G05-Tro-ly-AI.drawio` — UC32–UC34
- `usecase/UC-G06-Quan-tri.drawio` — UC35–UC36

Chi tiết Use Case nằm trong `docs/USE_CASES.md`.

## Sequence Diagram

Toàn bộ Sequence dùng phong cách **UML classic, đơn sắc**:

- Participant/actor ở đầu lifeline.
- Lifeline là đường dọc nét đứt.
- Request dùng mũi tên liền.
- Response dùng nét đứt.
- Dùng `alt`, `opt` khi có điều kiện.
- Không sử dụng màu trang trí.
- **PostgreSQL chỉ nhận query/write; không có mũi tên đi ra từ database.**
- Dữ liệu trả về được biểu diễn từ Service/API lên tầng gọi.
- Prisma được thể hiện là tầng ORM/data access khi cần.

### Bộ Sequence đã hoàn tất

- `sequence/SEQ-01-Dang-nhap.drawio` — UC02
- `sequence/SEQ-02-Dang-ky-Dang-xuat.drawio` — UC01, UC03
- `sequence/SEQ-03-Quen-va-Dat-lai-mat-khau.drawio` — UC04, UC05
- `sequence/SEQ-04-Quan-ly-Tai-khoan.drawio` — UC06, UC07, UC08
- `sequence/SEQ-05-Kham-pha-San-pham.drawio` — UC09–UC15
- `sequence/SEQ-06-Yeu-thich-va-Phoi-do.drawio` — UC16–UC18
- `sequence/SEQ-07-Thu-do-AI.drawio` — UC19, UC20, UC21, UC22
- `sequence/SEQ-08-Danh-gia-Outfit-AI.drawio` — UC20.1, UC20.2
- `sequence/SEQ-09-Gio-hang-va-Coupon.drawio` — UC23–UC25
- `sequence/SEQ-10-Dat-hang.drawio` — UC26, UC27
- `sequence/SEQ-11-Thanh-toan-VietQR.drawio` — UC28
- `sequence/SEQ-12-Don-hang-va-Danh-gia.drawio` — UC29–UC31
- `sequence/SEQ-13-Tro-ly-Mua-sam-AI.drawio` — UC32, UC33
- `sequence/SEQ-14-Lich-su-Tro-chuyen-AI.drawio` — UC34
- `sequence/SEQ-15-Quan-tri-He-thong.drawio` — UC35, UC36

Mapping đầy đủ UC → Sequence nằm trong `docs/diagrams/sequence/README.md`.

## FigJam

Board review trực quan:
https://www.figma.com/board/RpD76jtjbKzyJcrJsY1vwm

File `.drawio` trong GitHub là **bản nguồn chính**. FigJam chỉ dùng để review/chỉnh trực quan khi quota MCP cho phép.
