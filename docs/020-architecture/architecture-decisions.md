---
id: ADR-001
type: document
status: approved
project: PomeloEC
owner: "@solution-architect"
created: 2026-04-17
updated: 2026-04-17
---

# Architecture Decision Records (ADRs)

Quần thể quy tắc và quyết định kiến trúc xương sống cho dự án. Tuân thủ nghiêm ngặt theo mô hình Rule `architecture-governance.md`.

---

## ADR-001: Lựa chọn Kiến trúc Modular Monolith thay vì Microservices (Mặc định)

### 1. Bối cảnh (Context)
Dự án PomeloEC là hệ thống phục vụ B2B2C với định hướng kinh doanh có tốc độ phủ thị trường nhanh (Fast Go-To-Market), nhưng lại bao hàm chuỗi nghiệp vụ cực kì phức tạp (FlashSale, Voucher Stacking, Giao vận, Thanh toán, Loyalty).
Đội ngũ phát triển (Dev Team) cần tốc độ xây code nhanh, ít cồng kềnh hạ tầng DevOps, nhưng hệ thống vẫn phải chống chịu lượng tải đột biến trong đợt Sale và không bị trở thành "Spaghetti Code" (mã rác, module gọi chéo nhau tùy tiện).

### 2. Quyết định (Decision)
Chúng ta quyết định áp dụng Kiến trúc **Modular Monolith** sử dụng **NestJS** làm lõi, kết hợp cùng các giao thức thông báo bất đồng bộ (**Event-Driven**) qua **Apache Kafka**.

- Toàn bộ ứng dụng Backend sẽ nằm trong 1 Repo duy nhất (Monorepo), chạy trên 1 tiến trình Node.js duy nhất.
- Nhưng code Tách Khu Vực (Strict Bounded Context). Không bao giờ cho phép Module `Orders` trực tiếp query cái Bảng DB của module `Inventory` hay dùng hàm `InventoryService.deduct()`.
- Để tránh Bottleneck về kết nối CSDL, toàn bộ truy cập chéo sẽ được gỡ bỏ và dùng **Trạm phát sóng sự kiện (Event-driven)**. VD: Thanh toán xong -> Bắn Event -> Module giao vận tự bắt sóng và xử lý.

### 3. Đánh đổi (Trade-offs)
* **Kém linh hoạt về Hardware:** Không thể cấp riêng 1 Server siêu mạnh chỉ chuyên cho module Order, nếu ứng dụng cần scale, buộc phải nhân bản toàn bộ cục Monolith (Scale ngang).
* **Tuyệt vời về Khởi nguồn (Day-1 Value):** Không tốn công sức quản trị Network, K8s, Load-balancing nội bộ, Service Mesh phức tạp như Microservices.

### 4. Hệ quả tích cực (Consequences)
* Maintain nhánh Code cực dễ dàng vì nó nằm chung 1 chỗ. Typescript interface có thể chia sẻ (hoặc cô lập) rất trực quan.
* Tương lai có thể "tách khối": Nếu 1 năm sau công ty mở rộng thành 100 kĩ sư, module Order có thể được "Bốc gỡ" ra khỏi Monolith biến thành Microservice độc lập cực kì mịn, vì nó đã bị cô lập logic ngay từ ban đầu.

---

## ADR-002: Lựa chọn Redis Lua Script cho Flash Sale thay vì CSDL Lock

### 1. Bối cảnh (Context)
Yêu cầu hệ thống phải hỗ trợ Flash Sale không có rủi ro `Overselling` (Cấp phát quá số tồn kho thật - Bán âm).
Cách truyền thống: Dùng Transaction Lock (Pessimistic Lock) bằng truy vấn SQL như `SELECT ... FOR UPDATE` trên PostgreSQL. Cách này sẽ làm treo nghẽn hàng ngàn Connections vào Database nếu có quá nhiều Request Checkout dội vào cùng một giây, dẫn đến sập toàn CSDL.

### 2. Quyết định (Decision)
Mọi thao tác thay đổi số lượng tồn kho (Khóa mua hàng tạm thời) trong lúc giỏ hàng Checkout phải được xử lý cô lập trên vùng nhớ RAM của **Redis** bằng ngôn ngữ **Lua Script**. Kể cả Voucher Stacking.

### 3. Đánh đổi & Hệ quả (Trade-offs & Consequences)
* **Khó khăn:** Kĩ sư phải cứng tay để code kịch bản Lua chuẩn xác nhằm rollback (nhả tồn kho) nếu API Checkout bị lỗi hệ thống.
* **Lợi ích:** Tốc độ thần sầu. Redis đơn luồng (Single-Threaded), khi 1 kịch bản Lua khởi chạy, nó chặn hết các yêu cầu ghi đè khác theo thứ tự tuần tự tuyệt đối, giải quyết dứt điểm bài toán đồng thời (Race condition) mà thời gian phản hồi chỉ dưới 1 miligiây. SQL Server được giải cứu hoàn toàn khỏi các lệnh đếm rác.
