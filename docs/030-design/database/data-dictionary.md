---
id: LLD-DICT
type: specs
status: approved
project: PomeloEC
owner: "@technical-architect"
created: 2026-04-18
updated: 2026-04-18
---

# Từ Điển Dữ Liệu (Data Dictionary)

Tài liệu này cung cấp mô tả ngữ nghĩa, cấu trúc và quy tắc ràng buộc (Business Rules) cho từng cột trong toàn bộ CSDL PostgreSQL của dự án PomeloEC. Định dạng tài liệu này được sử dụng làm tham chiếu duy nhất nguồn chân lý (Single Source of Truth) cho DB Developers và QA.

> [!IMPORTANT]
> - Các khóa chính (PK) luôn sử dụng `UUID` V4 sinh tự động nhằm chống suy đoán URL (IDOR attacks).
> - Chuẩn Datetime luôn tuân thủ `UTC` và format `ISO 8601`.
> - Tiền tệ mặc định được cấu trúc bằng `Decimal(15,2)` để tránh sai số Floating Point phổ biến trong JS.

---

## I. Phân Hệ Người Dùng (Identity & CRM)

### 1. Bảng: `User`
Lưu trữ thông tin định danh và phân quyền của toàn bộ hệ thống.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Định danh người dùng. |
| `email` | VarChar(255) | UK | No | `UNIQUE` | Email đăng nhập, phải qua Verify. |
| `phone` | VarChar(20) | UK | Yes | `UNIQUE` | SĐT có thể bị khuyết nếu SSO qua Google. |
| `password_hash` | VarChar(255) | - | Yes | - | Chữ ký Bcrypt. NuII nếu login qua bên thứ 3 (OAuth2). |
| `role` | Enum `UserRole` | - | No | Default: `BUYER` | Định nghĩa mức quyền hạng của User. |
| `loyalty_coins` | Int | - | No | Default: `0` | Hệ thống Shopee Xu, Pomelo Coins. Kênh Loyalty. |
| `created_at` | DateTime | - | No | `now()` | Ngày tạo tài khoản. |

### 2. Bảng: `Address`
Sổ địa chỉ nhiều cấp của Buyer để tính cước vận chuyển linh hoạt. Mappings vởi API GHTK.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Khóa chính địa chỉ. |
| `user_id` | UUID | FK | No | Ref: `User.id` | Quản lý sổ địa chỉ thuộc về User nào. |
| `province` | VarChar(100) | - | No | - | Tỉnh / Thành Phố (Ánh xạ API Logistic). |
| `district` | VarChar(100) | - | No | - | Quận / Huyện. |
| `ward` | VarChar(100) | - | No | - | Phường / Xã. |
| `full_address` | VarChar(255) | - | No | - | Số nhà, Tên đường cụ thể. |
| `lat`, `lng` | Float | - | Yes | - | Vĩ độ - Kinh độ để ước tính khoảng cách giao hỏa tốc. |
| `is_default` | Boolean | - | No | Default: `false` | Chỉ có 1 địa chỉ được gán cờ `is_default = true` cho 1 User. |

### 3. Bảng: `Store`
Hồ sơ gian hàng (Seller) sinh ra sau quy trình KYC.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Định danh Gian hàng. |
| `owner_id` | UUID | FK(UK)| No | Ref: `User.id` | Mối quan hệ 1-1: Mỗi User chỉ sở hữu 1 Store. |
| `name` | VarChar(100) | - | No | - | Tên hiển thị của cửa hàng trước Buyer. |
| `available_balance` | Decimal(15,2) | - | No | Default: `0.0` | Dòng tiền đã được hạch toán và khả dụng để Rút (Payout). |
| `escrow_balance` | Decimal(15,2) | - | No | Default: `0.0` | Dòng tiền tạm giữ của sàn do đơn hàng đang giao (chưa cho rút). |
| `status` | Enum `StoreStatus` | - | No | Default: `PENDING`| Trạng thái xét duyệt KYC cửa hàng. |

---

## II. Phân Hệ Danh Mục Bán Hàng (Catalog)

### 4. Bảng: `Product`
Entity Trừu tượng (Abstract) mô tả khung xương của một sản phẩm để hiển thị chung.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Khóa định danh Product. |
| `store_id` | UUID | FK | No | Ref: `Store.id` | Cửa hàng quản lý sản phẩm này. |
| `name` | VarChar(255) | - | No | - | Tên hiển thị của sản phẩm (Ví dụ: "Áo Thun Polo"). |
| `base_price` | Decimal(15,2) | - | No | - | Giá trần cơ bản hiển thị bên ngoài listing (VD: 300K - 500K). |
| `category` | VarChar(100) | - | No | - | Phân loại Category path hoặc UUID. |
| `description` | Text | - | Yes | - | Đoạn Text/HTML mô tả dài của sản phẩm. |

### 5. Bảng: `Variant` (SKU)
Entity Vật lý (Physical). Khách hàng không mua Product, họ mua Variant. Nắm giữ Logic Tồn kho & Giá.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Khóa định danh Bản thể. |
| `product_id` | UUID | FK | No | Ref: `Product.id` | Rút trích từ Sản phẩm gốc nào. |
| `sku` | VarChar(50) | UK | No | `UNIQUE` | Mã Vạch/Mã định danh Lưu kho (Stock Keeping Unit). |
| `stock_quantity` | Int | - | No | Default: `0` | Số lượng tồn kho. **CRITICAL:** Khớp đồng bộ với Key trên Redis Cache để chống Overselling. |
| `price` | Decimal(15,2) | - | No | - | Giá bán chính xác của biến thể này. |
| `attributes` | JsonB | - | Yes | - | Lưu cấu trúc phân loại động (VD: `{"Màu":"Đỏ", "Size": "L"}`). |

---

## III. Phân Hệ Giao Dịch & Đơn Hàng (Order Engine)

### 6. Bảng: `Order`
Root entity nắm giữ State Machine tiến trình phân bổ vận chuyển và thanh toán.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Ticket ID (Mã Vận đơn nền tảng). |
| `buyer_id` | UUID | FK | No | Ref: `User.id` | Ai là người mua đơn này. |
| `status` | Enum `OrderStatus` | - | No | `PENDING_PAYMENT`| Chu trình State Machine ngặt nghèo ngăn chặn Rollback ngược. |
| `total_amount` | Decimal(15,2) | - | No | - | Tổng tiền Buyer PHẢI TRẢ (Sau khi đã trừ khuyến mãi/xu). |
| `shipping_tracking_code` | VarChar(100)| - | Yes | - | Mã Barcode lấy từ đối tác Vận chuyển (GHTK/ViettelPost). |
| `affiliate_id` | VarChar(100)| - | Yes | - | Dành cho Cookie affiliate / KOC Tracking hoa hồng. |
| `risk_score` | Int | - | No | Default: `0` | Hệ thống Fraud đánh giá độ khả nghi của đơn. |
| `is_fraud_suspect` | Boolean | - | No | Default: `false` | Nếu rủi ro cao -> Khóa thanh toán ngay. |
| `created_at` | DateTime | - | No | `now()` | Nút kích hoạt Count-down Hủy. Quá 15p chưa trả tiền -> CANCELED. |

### 7. Bảng: `OrderItem`
Ảnh chụp cắt ngang (Snapshot) chứa dữ liệu bất biến không bị ảnh hưởng bởi việc thay giá sản phẩm gốc sau này.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Khóa định danh Order Item. |
| `order_id` | UUID | FK | No | Ref: `Order.id` | Item này thuộc Bill nào. |
| `variant_id` | UUID | FK | No | Ref: `Variant.id` | Biến thể nào đã bị trừ (Cơ sở để chập Kho khi bị Return). |
| `quantity` | Int | - | No | `> 0` | Số lượng chốt mua. |
| `unit_price` | Decimal(15,2) | - | No | - | **SNAPSHOT:** Giá của sản phẩm MANG TÍNH THỜI ĐIỂM KHI CLICK NÚT MUA. |
| `discount_applied` | Decimal(15,2) | - | No | - | Số tiền Prorating trừ đi từ Voucher cho riêng item này. |

---

## IV. Phân Hệ Thanh Toán và Hậu Cần

### 8. Bảng: `PaymentTransaction`
Sổ phụ giao dịch kết nối Cổng thanh toán ngoại vi với vòng lặp đơn hàng. Bắt buộc chống Duplicate/Idempotency.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Khóa định danh của hệ thống bản địa. |
| `order_id` | UUID | FK | No | Ref: `Order.id` | Giao dịch này phục vụ thanh toán Hóa đơn nào. |
| `txn_ref` | VarChar(100) | UK | No | `UNIQUE` | Khóa Idempotency. Mã phản hồi nguyên bản của Bank/Ví điện tử trả về (TxnRef VNPay). |
| `amount` | Decimal(15,2) | - | No | - | Số tiền Cổng thanh toán công nhận (Nhằm đối soát lệch bill). |
| `provider` | Enum `Provider` | - | No | - | Kênh (VNPAY, MOMO, COD). |
| `status` | Enum `PaymentStatus`| - | No | Default: `PENDING` | Trạng thái ghi nhận dòng tiền (SUCCESS / FAILE). |
| `gateway_response`| JsonB | - | Yes | - | Lưu 100% Payload gốc từ Webhook để phục vụ truy vết tranh chấp đối soát sau này. |

### 9. Bảng: `InventoryLedger` (Lịch Sử Thẻ Kho Logs)
Ngăn cấm hoàn toàn thao tác Update âm thầm. Mọi lệnh chỉnh kho phải lưu Log (Sổ cái thẻ kho) phục vụ thanh tra. Bảng này phình to rất nhanh. Phân mảnh (Partition) mỗi 3 tháng.

| Tên Cột | Kiểu Dữ liệu | PK/FK | Null | Ràng buộc / Mặc định | Ý Nghĩa / Business Rule |
| :--- | :--- | :---: | :---: | :--- | :--- |
| `id` | UUID | PK | No | `uuid_generate_v4()` | Audit_ID. |
| `variant_id` | UUID | FK | No | Ref: `Variant.id` | Thao tác nhập/xuất trên SKU nào. |
| `type` | Enum Type | - | No | - | IN (Nhập tay), OUT (Bán hàng), RETURNED (Bom hàng kho hoàn). |
| `quantity_change` | Int | - | No | - | Số lượng thay đổi (VD: -5, +10). |
| `reason` | VarChar(255) | - | Yes | - | Lưu lại Webhook Event ID hoặc diễn giải vì sao kho thay đổi. |

---

## V. Metadata / Từ Điển Liệt Kê (Enum Dictionaries)

Hệ thống bắt buộc Frontend lẫn Backend phải Mapper theo Data chuẩn này:

| Enum Name | Options | Giải nghĩa Business Rule |
|---|---|---|
| **UserRole** | `BUYER` | Khách hàng cơ bản. |
| | `SELLER` | Khách mở cấu hình Admin Store. |
| | `ADMIN` | Quản trị nền tảng sàn (Staff/Root). |
| **StoreStatus** | `PENDING` | Mới khai báo KYC CMND, đăng bán bị ẩn trên Search. |
| | `VERIFIED` | Đã duyệt. Available For Sale. |
| | `BANNED` | Vi phạm chính sách, chặn toàn bộ luồng giao dịch/rút tiền. |
| **OrderStatus** | `PENDING_PAYMENT`| Giỏ hàng chuyển qua URL ngân hàng và đang đợi. (15 phút sẽ hủy bằng Back-Job). |
| | `PAID` | Trả tiền xong qua VNPay, hoặc Xác nhận mua nếu COD. Chờ shop bọc hàng. |
| | `SHIPPED` | Đã đẩy Data qua cổng GHTK/Logistic. Lấy mã Barcode giao cho shipper. |
| | `DELIVERED` | Webhook Logistic báo khách đã nhận. Bắt đầu bộ đếm 7 ngày cho phép Trả hàng. |
| | `COMPLETED` | Chốt qua 7 ngày hoặc khách bấm Đã nhận hàng. Rót tiền từ Escrow -> Available Balance cho Shop. End of Life. |
| | `CANCELED` | Hủy thủ công hoặc Bot hủy Timeout. |
| **PaymentProvider**| `VNPAY`, `MOMO`, `COD` | Cổng giải ngân/đầu vào. Cần bọc logic Adapter. |
| **PaymentStatus** | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`| State xác minh chéo giao dịch trên Cổng. |
| **InventoryType** | `IN`, `OUT`, `RETURNED` | Types bắt buộc trên Thẻ Kho. |
