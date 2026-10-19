# Sơ đồ LSOUL để chỉnh sửa

Bộ này chốt theo kho `Loccao102/BanHang`, commit `f9f0df76b1ccaa1360ab515d10096e8d29158171`.

| Thư mục | Nội dung | Cách sử dụng |
|---|---|---|
| `drawio/` | 7 use case + 24 sequence, tệp `.drawio` với chữ, khung, đường nối có thể sửa riêng | Mở bằng **diagrams.net / draw.io → File → Open from → Device**. |
| `visual-paradigm-plantuml/` | 7 use case + 24 sequence, tệp `.puml` | Nhập PlantUML vào **Visual Paradigm Desktop** bằng chức năng PlantUML import. Đường dẫn menu tùy phiên bản. |

Tất cả bản bàn giao dùng nét và chữ đen, nền trắng, font **Times New Roman 13 pt**. Các sơ đồ sequence 07, 08, 11, 19, 20 sử dụng nội dung đã đối chiếu lại với mã nguồn; SEQ-21–24 là luồng mới theo commit hiện tại. 20 tệp `.drawio` gốc của repository vẫn nằm trong `../nguon/sequence/` để đối chiếu và không bị ghi đè.

Visual Paradigm dùng định dạng dự án gốc `.vpp`. Môi trường tạo báo cáo không cài Visual Paradigm, nên bộ này bàn giao nguồn `.puml` để nhập, **chưa thể xác nhận một tệp `.vpp` đã mở trong phiên bản Visual Paradigm của bạn**. Sau khi nhập, bạn có thể lưu thành `.vpp` và chỉnh bố cục/khung theo yêu cầu của trường. Visual Paradigm có [hướng dẫn nhập PlantUML](https://www.visual-paradigm.com/guide/from-text-to-architecture-the-ultimate-guide-to-plantuml-visual-paradigm-and-ai-driven-uml/) và [hướng dẫn nhập XMI](https://circle.visual-paradigm.com/docs/export-and-import/importing/importing-xmi/); bộ này dùng PlantUML để giữ đầy đủ nhánh `alt`, `opt` và thông điệp trong sequence.

Nguồn sơ đồ trong báo cáo Word là ảnh PNG đen trắng ở `../xuat/`. Hãy sửa các tệp tại đây rồi xuất ảnh mới để thay vào Word nếu bạn đổi nội dung/bố cục.
