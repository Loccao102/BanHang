# Danh sách thay đổi và đối chiếu báo cáo LSOUL

**Ngày lập:** 14/10/2026; **cập nhật:** 19/10/2026
**Mã nguồn:** `Loccao102/BanHang`, nhánh `main`, commit [`f9f0df76b1ccaa1360ab515d10096e8d29158171`](https://github.com/Loccao102/BanHang/tree/f9f0df76b1ccaa1360ab515d10096e8d29158171).
**Báo cáo tham khảo:** `C:\Users\This PC\Downloads\1019086301-11-Ba-o-ca-o-đo-a-n-to-t-nghie-p-la-n-1-BuiBinhMinh-211212322.docx`. Tệp gốc không bị ghi đè. Không sửa mã nguồn ứng dụng.

## 1. Đầu ra đã tạo

| Đầu ra | Nội dung |
|---|---|
| `Bao-cao-do-an-LSOUL.docx` | Báo cáo ba chương; bìa, lời cảm ơn, mở đầu, nội dung nghiệp vụ và công nghệ, use case, activity/sequence/state/ERD/kiến trúc/deployment, ảnh giao diện LSOUL, kiểm thử, phụ lục sơ đồ và kết luận. Heading, caption, mục lục/danh mục hình/bảng dùng trường Word để cập nhật. |
| `Bieu-do-LSOUL/` | Nguồn chỉnh sửa và PNG xuất; giữ 7 use case, 20 sequence gốc; bổ sung/sửa các sơ đồ theo mã nguồn. Xem `Bieu-do-LSOUL/README.md`. |
| `Ma-tran-UseCase-BieuDo-KiemThu.xlsx` | 40 mục gồm 36 UC chính và 4 UC mở rộng; sheet kiểm thử 38 kịch bản, sheet bằng chứng đã xác minh. |
| `Danh-sach-thay-doi-LSOUL.md` | Tài liệu này: phạm vi chỉnh sửa, nguồn chứng minh, điểm chưa khớp và thông tin cần bổ sung. |

**Chuẩn hóa ngày 19/10/2026:** báo cáo và ma trận dùng Times New Roman 13 cho nội dung/bảng, chữ đen nền trắng; hình sơ đồ và ảnh giao diện trong báo cáo xuất đen trắng. `Bieu-do-LSOUL/Chinh-sua/` cung cấp 7 use case và 24 sequence ở dạng `.drawio` chỉnh sửa trực tiếp và `.puml` để nhập Visual Paradigm. Khung/bìa và thông tin cá nhân vẫn để người thực hiện hoàn thiện.

## 2. Nội dung mẫu → nội dung LSOUL → nguồn → trạng thái

| Nội dung báo cáo mẫu | Nội dung LSOUL thay thế | Nguồn chứng minh | Trạng thái |
|---|---|---|---|
| Bìa và bìa phụ đề tài bệnh viện, tên sinh viên/GVHD cũ | Tên đề tài LSOUL; thông tin cá nhân để nhãn cần bổ sung | Yêu cầu người dùng; báo cáo mẫu | Đã thay; chờ thông tin người thực hiện |
| HIS và quy trình đặt lịch khám | Mua sắm thời trang, chọn màu/cỡ, phối outfit, Try-On, đơn và tồn kho | `docs/USE_CASES.md`; `src/app/` | Đã viết lại |
| Kotlin/Compose, Angular, C#/.NET, SQL Server/EF | TypeScript, React, Next.js App Router, Node.js, Prisma, PostgreSQL/pgvector | `package.json`; `prisma/schema.prisma`; `docker-compose.yml` | Đã thay |
| Tác nhân bệnh nhân/bác sĩ/quản trị bệnh viện | Khách truy cập, khách hàng, admin, dịch vụ ngoài | `docs/USE_CASES.md`; enum `UserRole` | Đã thay; không thêm role ngoài schema |
| Phân rã/Use Case/Sequence bệnh viện | G01–G06; 36 UC chính + 4 mở rộng; các sequence nghiệp vụ LSOUL | `docs/diagrams/`; route/API tương ứng | Đã xây dựng và truy vết |
| ERD/bảng bệnh viện với kiểu dữ liệu không nhất quán | ERD tài khoản–thương mại và AI; từ điển dữ liệu cốt lõi theo Prisma | `prisma/schema.prisma` | Đã xây dựng; xem giới hạn dưới đây |
| Ảnh giao diện bệnh viện và Android | Ảnh chụp trang chủ, shop, login, Try-On khi chạy local | `src/app/*`; ảnh chụp 16/10/2026 | Đã thay ảnh; ảnh admin cần bổ sung |
| Kết quả kiểm thử mẫu không có bằng chứng đầy đủ | Kiểm tra tĩnh đã chạy và bảng kịch bản tích hợp ghi trạng thái thực | `package.json`; log lệnh tại phiên lập báo cáo | Đã tách đạt tĩnh/chưa chạy tích hợp |
| Kết luận và tài liệu y tế/Android/.NET | Kết luận bám commit và nguồn công nghệ phù hợp | Mã nguồn và tài liệu chính thức | Đã thay |

## 3. Biểu đồ đã chuẩn bị

- Giữ nguồn **7 Use Case `.drawio`** và **20 Sequence** (mỗi luồng có `.drawio` và `.puml`). Hai định dạng sequence không được đếm thành hai sơ đồ.
- Cập nhật UC-00 và UC-G04 để phân biệt giỏ cục bộ, Mua ngay và checkout/đơn hàng cần đăng nhập; cập nhật UC-G02 với UC10.1 Visual Search và UC15.1 Smart Fit; chỉnh UC-G03 để đánh giá outfit là nhánh tùy chọn sau Try-On; bổ sung UC-G05 về cỡ/vóc dáng, Try-On, chốt đơn và feedback trong chat.
- Cập nhật SEQ-07 để mô tả IDM-VTON, FASHN API, Hugging Face FASHN VTON, Gemini và các nhánh fallback; hiệu chỉnh SEQ-08, SEQ-11, SEQ-19, SEQ-20 theo code.
- Vẽ mới phân rã G01–G06, hai activity, ba state machine, hai ERD, kiến trúc và deployment Docker. Có nguồn PlantUML và bản PNG.
- Xuất đủ 20 sequence gốc, 4 sequence mới SEQ-21…24 (Mua ngay/QR pending, Try-On trong chat, chốt đơn trong chat, phản hồi chat) và 7 use case theo nhóm. Các luồng trọng tâm đặt ở Chương 2; use case và sequence bổ trợ đặt trong phụ lục B/C.

## 4. Kết quả đã xác minh trong phiên này

| Kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| `npm run lint` | Exit code 0, không in lỗi TypeScript | Chỉ kiểm tra tĩnh |
| `npm run test:chat` | 78/78 ca hồi quy trong script báo đạt | Logic nội bộ; không gọi Gemini thực |
| `npm run test:quality` | 6 nhóm kiểm tra in dấu đạt; exit code 0 | Logic nội bộ; không có DB/QR thực |
| `npm run test:checkout` | Exit code 0; kiểm tra mã SePay, Mua ngay và fallback biến thể | Logic nội bộ; không có DB/webhook thực |
| `npm run test:ai:scenarios` | 7/7 kịch bản đạt | Dữ liệu/fallback cục bộ; không gọi Gemini thực |
| `npx tsx scripts/test-order-components.ts` | 5 kiểm tra đạt | Logic thành phần; không có webhook thực |
| Chạy Next.js local và chụp giao diện | Trang chủ, shop, login, Try-On render ở 1440×1000 | Development, dữ liệu mẫu/fallback, chưa đăng nhập |
| Kiểm tra cấu trúc Word | OOXML validator báo “All validations PASSED”; 45 hình và 38 kịch bản tích hợp đối chiếu được với ma trận | Bộ kết xuất PDF kiểm tra được bố cục tổng quát nhưng không thay thế Word khi kiểm tra dấu tiếng Việt và trang ngang |

**Chưa xác minh:** E2E có PostgreSQL, checkout đồng thời, webhook SePay/PayOS thật, admin với dữ liệu đăng nhập, Try-On/Gemini với API key, hiệu năng, responsive nhiều kích thước và đánh giá người dùng. Báo cáo kiểm thử `docs/BAO_CAO_KIEM_THU_2026-10-04.md` gắn commit `32cd894`; không lấy số liệu đó làm kết quả của commit đang xét.

## 5. Bất nhất và việc cần sửa trong mã nguồn/tài liệu

| Vấn đề | Bằng chứng | Cách xử lý đề xuất |
|---|---|---|
| Try-On yêu cầu đăng nhập trong use case/UI nhưng API cho `userId = null` | `docs/USE_CASES.md`; `src/app/api/tryon/route.ts` | Chốt chính sách guest hay bắt buộc login; đồng bộ route, UI, test và mô tả. |
| README vẫn nhắc đánh giá sản phẩm | `README.md`; chú thích `LegacyReview` trong schema | Sửa README; giữ LegacyReview là bảng tương thích, không là chức năng đang hoạt động. |
| Social Commerce còn bảng/API nhưng ngoài phạm vi chính thức | README; `docs/USE_CASES.md`; `SocialPost`, `SocialEvent` | Ghi rõ ngoài phạm vi khi bảo vệ; không tính vào 36 UC. |
| Enum `refunded` không có luồng refund tự động | `PaymentStatus`; `src/app/api/orders/[id]/route.ts` | Không vẽ chuyển hoàn tiền đã triển khai; thiết kế refund như hướng phát triển. |
| `OrderItem.productId` có index nhưng không có FK Product; CartItem không có FK Variant | `prisma/schema.prisma` | Giữ ERD vật lý đúng schema; phân biệt liên hệ logic/snapshot. |
| `created`/`rejected` tồn tại ở TryOnStatus nhưng route tạo phiên ở `processing` | schema; `src/app/api/tryon/route.ts` | Sơ đồ trạng thái chỉ nêu chuyển đã xác minh; enum còn lại ghi chú riêng. |
| `failed` tồn tại ở PaymentStatus nhưng webhook unmatched không chuyển Order sang failed | schema; `src/lib/server/payment-processor.ts` | Ghi unmatched ở PaymentTransaction, giữ Order pending. |
| Smart Fit chủ yếu theo bảng cỡ/quy tắc phía client | `src/lib/body-shape.ts` | Tránh gọi là mô hình AI do đồ án tự huấn luyện. |
| Chốt đơn trong chat hiện dùng `checkoutMode: "cart"` | `src/components/chat-widget.tsx`; `src/components/store-provider.tsx` | Xác nhận chính sách giỏ sau khi chốt một gợi ý; đồng bộ với Mua ngay nếu muốn giữ giỏ. |
| Feedback chat của khách truy cập không lưu bền vững | `src/app/api/chat/feedback/route.ts` | Nêu rõ `persisted=false` ở tài liệu và thử với tài khoản đăng nhập. |

## 6. Thông tin còn cần bổ sung

1. Tên trường/khoa, sinh viên, mã sinh viên, lớp/khóa, giảng viên hướng dẫn, địa điểm và năm học cho bìa.
2. Ảnh trang quản trị từ một môi trường demo có tài khoản admin và dữ liệu thử phù hợp.
3. Môi trường triển khai/kiểm thử chính thức, biến cấu hình dịch vụ (không cần cung cấp secret trong báo cáo), log E2E, webhook và AI; dữ liệu đo hiệu năng/đánh giá nếu muốn công bố.
4. Mở báo cáo trong Word và cập nhật toàn bộ trường để tạo lại mục lục, danh mục hình/bảng và số trang sau khi bổ sung thông tin/ảnh. Bản xem trước PDF từ trình kết xuất thử không hiển thị dấu tiếng Việt và hướng trang ngang chính xác; cần kiểm tra dàn trang cuối cùng trong Word trên máy sẽ nộp.

## 7. Tài liệu nguồn chính

- [Mã nguồn tại commit chốt](https://github.com/Loccao102/BanHang/tree/f9f0df76b1ccaa1360ab515d10096e8d29158171)
- [Danh sách use case](https://github.com/Loccao102/BanHang/blob/f9f0df76b1ccaa1360ab515d10096e8d29158171/docs/USE_CASES.md)
- [Prisma schema](https://github.com/Loccao102/BanHang/blob/f9f0df76b1ccaa1360ab515d10096e8d29158171/prisma/schema.prisma)
- [Đặt hàng](https://github.com/Loccao102/BanHang/blob/f9f0df76b1ccaa1360ab515d10096e8d29158171/src/app/api/orders/route.ts) và [xử lý đơn](https://github.com/Loccao102/BanHang/blob/f9f0df76b1ccaa1360ab515d10096e8d29158171/src/app/api/orders/%5Bid%5D/route.ts)
- [Try-On](https://github.com/Loccao102/BanHang/blob/f9f0df76b1ccaa1360ab515d10096e8d29158171/src/app/api/tryon/route.ts) và [đối soát thanh toán](https://github.com/Loccao102/BanHang/blob/f9f0df76b1ccaa1360ab515d10096e8d29158171/src/lib/server/payment-processor.ts)
- [Feedback chat](https://github.com/Loccao102/BanHang/blob/f9f0df76b1ccaa1360ab515d10096e8d29158171/src/app/api/chat/feedback/route.ts) và [giao diện chat](https://github.com/Loccao102/BanHang/blob/f9f0df76b1ccaa1360ab515d10096e8d29158171/src/components/chat-widget.tsx)
