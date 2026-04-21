---
id: IMPL-003
type: product-backlog
status: approved
project: PomeloEC
owner: "@product-manager"
linked-to: [[02-sprint-plan]]
created: 2026-04-22
updated: 2026-04-22
---

# Master Sprint Backlog: Phân rã Task Cấp Độ Micro

Tài liệu này tuân thủ nguyên lý **Deep Task Decomposition**. 22 Use Cases được băm nhỏ thành các "Vertical Slices" (Lát cắt dọc tính năng), mỗi Task có khối lượng ước lượng từ 2-8 giờ, phân định đích danh Frontend, Backend, Database.

---

## 🏃 SPRINT 1: Nền tảng Định danh & Danh mục (Foundation & Catalog)

### Epic: Quản Lý Khách Hàng (UC-00A)
*Lát cắt 1.1: Trụ sở Nhận diện (Keycloak IAM)*
- `[TASK-1.1.1-DB]`: Thiết lập cấu hình Keycloak. Tạo Realm `PomeloEC` và Clients cho Frontend, Backend.
- `[TASK-1.1.2-BE]`: Dựng Module `IAM` bằng `nest-keycloak-connect`. Setup KeycloakGuard để Verify JWT, phân quyền Admin/Seller/Buyer theo Role của Keycloak.
- `[TASK-1.1.3-BE]`: Đồng bộ User Profile (Webhook hoặc Kafka từ Keycloak) vào Supabase Postgres lưu thông tin Profile `public.Users`.
- `[TASK-1.1.4-FE]`: Tích hợp thư viện `next-auth` (KeycloakProvider). Xử lý luồng Redirect Login ra màn hình Keycloak, lấy Token về Cookie mượt mà.

*Lát cắt 1.2: Quản lý SSO (No-code)*
- `[TASK-1.2.1-IAM]`: Cấu hình SSO Google/Facebook trực tiếp trên Keycloak Admin Console (Không cần code backend).

### Epic: Danh mục & Sinh Điểm Bán Hàng (UC-11)
*Lát cắt 1.3: Khởi tạo dữ liệu Product Core*
- `[TASK-1.3.1-DB]`: Prisma Schema phức hợp Bảng `Product`, `ProductCategory`, `Brand`, `Variant` (Size, Màu), `VariantOption`. 
- `[TASK-1.3.2-BE]`: Viết Thuật toán Ma trận tổ hợp chập sinh ra n-SKUs. (Ví dụ: Sản phẩm A -> Xanh/S, Xanh/M...). API POST `/api/catalog/products`. Đi kèm Unit Test bẫy lỗi trùng mã.
- `[TASK-1.3.3-FE]`: Dựng Trang Seller UI "Thêm Sản phẩm". Thiết kế Component nhập phân loại hàng động (Dynamic Field Array).
- `[TASK-1.3.4-BE]`: Cấu trúc GraphQL/REST lấy danh sách ngành hàng động, hỗ trợ cơ chế Tree Caching bằng RAM.

---

## 🏃 SPRINT 2: Siêu Tốc Độ Tìm Kiếm & Tồn Kho Cơ Sở

### Epic: Tìm kiếm Elasticsearch (UC-01)
*Lát cắt 2.1: Bộ đồng bộ hóa CDC (Cầu nối Data)*
- `[TASK-2.1.1-DB]`: Cấu hình Debezium cắm vào Supabase Postgres bắt sự kiện biến động dữ liệu bảng `Product`. Đẩy sự kiện qua Kafka Topic tên `dbserver.public.Product`.
- `[TASK-2.1.2-BE]`: Cấu hình Kafka Connect Sink tự động kéo Msg từ Kafka nhồi chỉ mục lên ElasticSearch mà không tốn 1 dòng code cập nhật ở Backend.
*Lát cắt 2.2: Luồng Trải nghiệm Người dùng (UX)*
- `[TASK-2.2.1-BE]`: Xây dựng Endpoint `/search?q=...` với Elastic Query DSL cho thanh tìm kiếm thông minh phân tích vỡ chữ (Fuzzy & Edge N-gram).
- `[TASK-2.2.2-FE]`: Phân trang Vô cực (Infinite Scroll) ở Homepage hoặc Search Result cho luồng Catalog.

### Epic: Nền Móng Sổ Kho Phụ (UC-04)
*Lát cắt 2.3: Ghi nhận Tồn kho Hệ thống*
- `[TASK-2.3.1-DB]`: Khởi tạo Schema `InventoryLedger` (Ghi âm/dương nợ tồn kho).
- `[TASK-2.3.2-BE]`: API Import Goods (Nhập hàng). Bắn Total Available Stock lên Redis thay vì để ở SQL (Pre-warm Cache).

### Epic: Luồng Giỏ Hàng (UC-02)
*Lát cắt 2.4: Giỏ hàng Tốc độ chớp mắt*
- `[TASK-2.4.1-BE]`: Xây dựng `Cart Module`. Code logic bọc Redis `HGETALL` và `HSET` lưu Items của KH theo định dạng {UserID: {SKU_ID: Qty}}. Hoàn toàn không đụng DB.
- `[TASK-2.4.2-FE]`: Xây UI Floating Cart Drawer. Viết thuật toán gom nhóm sản phẩm theo từng Shop (Seller).

---

## 🏃 SPRINT 3: Giao Dịch & Trừ Kho (The Golden Path)

### Epic: Cơ chế Block Out-of-Stock (UC-03_L)
*Lát cắt 3.1: Vũ khí Tối thượng (Redis Lua)*
- `[TASK-3.1.1-BE]`: Design & Test Đoạn mã `check_and_deduct_inventory.lua` nguyên tử. Chặn đúp bán âm 100%. Lock tạm tồn kho vào 1 Hash map ẩn.
- `[TASK-3.1.2-BE]`: Tích hợp Lua Script vào Pipeline của Checkout Service.

### Epic: Lõi Giao Dịch Postgre (UC-03_W)
*Lát cắt 3.2: Chốt đơn (Checkout Flow)*
- `[TASK-3.2.1-DB]`: Tạo Schema siêu kỹ `Order`, `SubOrder`, `OrderItem`, `Payment`.
- `[TASK-3.2.2-BE]`: Logic Tách đơn (1 Giỏ có 3 SP của 3 Seller -> 3 SubOrder tách biệt tiền vận chuyển). Áp dụng Mẫu thiết kế Outbox Pattern Transaction.
- `[TASK-3.2.3-BE]`: Sau khi DB Commit thành công, Publis Event `ORDER_CREATED` vào Kafka topic.
- `[TASK-3.2.4-FE]`: Trang Checkout Final: UI Nhập địa chỉ, Tóm tắt Đơn, Các Phương thức thanh toán.

### Epic: Thanh toán An toàn (UC-07)
*Lát cắt 3.3: Integraton VNPay*
- `[TASK-3.3.1-BE]`: Config mã Bí Mật, Viết hàm sinh Chữ ký HMAC256 tạo deep-link QR Code rớt về FE.
- `[TASK-3.3.2-BE]`: Thiết kế Webhook/IPN URL. **Nhiệm vụ then chốt:** Viết khóa chống lặp chữ ký (Idempotency Key) bằng Redis. Xác nhận gạch nợ thành công (`PAYED`).
- `[TASK-3.3.3-FE]`: Trang Màn Hình Success "Thanh Toán Thành Công" & Fail.

---

## 🏃 SPRINT 4: Bàn Đạp Bán Hàng (Fulfillment Edge)

### Epic: Nhà Bán Hàng Tham chiến (UC-00B)
- `[TASK-4.1.1-FE]`: Màn hình "Đăng ký thành Seller". Form phức hợp tải lên (CCCD, GPKD).
- `[TASK-4.1.2-BE]`: Schema `SellerProfile`. API nộp biên bản. API Admin Duyệt/Từ chối.

### Epic: Thông Quan Vận Chuyển (UC-12 & UC-08)
- `[TASK-4.2.1-BE]`: Code Tích Hợp GHTK/ViettelPost. Sinh Object Mapping để lấy Mã Vận Đơn thật. Trả về mã Tracking.
- `[TASK-4.2.2-FE]`: Giao diện Dashboard Quản lý Đơn hàng cho Nhà Bán. Button "Chuẩn bị hàng & In đơn".
- `[TASK-4.2.3-BE]`: Webhook Tracking: Update State Machine của `Order` từ `READY` -> `SHIPPED` -> `DELIVERED`.

### Epic: Đối Khoát Hạn Chế Phí (UC-05)
- `[TASK-4.3.1-DB]`: Cấu hình Sổ kế toán Ví `EscrowWallet` (Giữ tiền Tạm cư) và `AvailableWallet` (Cho Rút). 
- `[TASK-4.3.2-BE]`: Dòng tiền chảy: Khi đơn chạm `DELIVERED` -> Chuyển số dư. Khấu trừ phí giao dịch (vd 3.5%) đẩy sang Doanh Thu Sàn. 

---

## 🏃 SPRINT 5: Tự Động Hóa Chống Thất Thoát

### Epic: Background Workers (UC-13)
- `[TASK-5.1.1-BE]`: Setup `BullMQ` cluster. Cứ có Event `ORDER_CREATED_PENDING` thì schedule delay 15 phút.
- `[TASK-5.1.2-BE]`: Viết Job Processor: Lục lại ID xem đã trả tiền chưa. NẾU CHƯA = Chạy hàm Nhả Lua Script hoàn trả Tồn Kho ảo + Cancel Order.

### Epic: Siêu Động Cơ Khuyến Mãi (UC-06)
- `[TASK-5.2.1-DB]`: Schema Voucher (Giảm cứng/Phần trăm, Số tiền tối đa/Tối thiểu, Số lượt xài).
- `[TASK-5.2.2-BE]`: Tích hợp Logic Prorating Math (Băm % giảm rải đều xuống dòng OrderItem để tránh rủi ro hoàn trả tiền bị hớ lệch).
- `[TASK-5.2.3-FE]`: Modal Áp dụng mã Voucher tại trang Checkout. State Re-validation Realtime.

### Epic: Phân giải Sổ Địa Chỉ (UC-00C)
- `[TASK-5.3.1-BE]`: Data Seeding 10.000 dòng mã hành chính (Tỉnh/Huyện/Xã) khớp hệ thống Viettelpost chuẩn Json.
- `[TASK-5.3.2-FE]`: Combobox phụ thuộc (Tỉnh -> xổ Huyện -> xổ Xã) bằng Shadcn Popover.

---

## 🏃 SPRINT 6: Nâng Niu Trải Nghiệm (Enhancements)

### Epic: Loyalty Systems (UC-16)
- `[TASK-6.1.1-DB]`: Bảng `CoinTransaction`.
- `[TASK-6.1.2-BE]`: Tính toán rớt Xu (X% Giá trị) khi Đơn chạm mốc `COMPLETED`. API Trừ xèng trực tiếp và Tính Checkout.

### Epic: Flash Sale Framework (UC-18)
- `[TASK-6.2.1-BE]`: Cấu trúc Node-Cron job. Quét lúc 23h59 để tải Toàn bộ Data bảng Flash Sale ngày mai nạp vô Cache (Hạn chế read DB lặp lại tỷ lần).
- `[TASK-6.2.2-FE]`: Đồng hồ đếm ngược (Countdown Timer Hook SSR an toàn, tránh lệch Hour).

### Epic: Tranh cháp & Hoàn Trả (UC-09, UC-14, UC-10)
- `[TASK-6.3.1-BE]`: Tích hợp API Cổng Thanh toán 1-Click Reverse Refund. State Machine chuyển sang `DISPUTED`. Đóng băng Wallet Escrow.
- `[TASK-6.3.2-BE]`: Cronjob: Tự động chạy hàng ngày dò qua mốc 3 ngày mà KHÔNG phàn nàn -> Tự chuyển từ `DELIVERED` -> `COMPLETED`.
- `[TASK-6.3.3-FE]`: Upload đánh giá & Video vào Object Storage (Supabase Storage). Lấy link Supabase CDN hiển thị Gallery FE.

---

## 🏃 SPRINT 7: Tối Ưu Bằng Máy Cuối (Long tail)

### Epic: Siêu Trí Tuệ Phân Tích OLAP & Dashboard (UX-17)
- `[TASK-7.1.1-DB]`: Cấu hình ClickHouse Kafka Engine (Bảng Materialized View) trực tiếp nuốt trọn Dữ liệu Giao dịch từ Kafka topic do Debezium nhả ra.
- `[TASK-7.1.2-BE]`: Xây dựng module `AnalyticsService` chạy câu truy vấn SQL siêu tốc trên ClickHouse để sinh báo cáo Doanh Thu, Tồn kho realtime trả về biểu đồ Dashboard.

### Epic: Chăm sóc KH và Anti-Fraud (UC-15, UC-22, UC-19)
- `[TASK-7.2.1-BE]`: Init NestJS WebSocket (Socket.io Gateway). Lưu luồng tin nhắn Chat KH-Seller trong MongoDB (hoặc Postgres partition riêng).
- `[TASK-7.2.2-BE]`: Dựng Rate-limit 5 requests/sec với Redis `RateLimiter`. Đưa mã bảo vệ IP Banning.
- `[TASK-7.2.3-BE]`: Kết dính hàng loạt HTML Order Template sang PDFKit để In bill với mã vạch siêu khủng, load lười tải Stream PDF trả cho Frontend thay vì Buffer.

---
> Mức độ độ ưu tiên hoàn hảo. Document sẵn sàng để đưa cho Team Thực chiến (Implement). Ngôn ngữ sử dụng thuần việt kỹ thuật để bóc lột bản chất phần mềm. Cấm đi chệch khỏi trục kế hoạch này.
