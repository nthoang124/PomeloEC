---
id: PRD-001
type: document
status: review
project: PomeloEC
owner: "@product-manager"
created: 2026-04-16
updated: 2026-04-16
---

# Product Requirements Document (PRD) - PomeloEC Marketplace

## 1. Tầm nhìn & Mục tiêu (Vision & Goals)
**PomeloEC** là nền tảng thương mại điện tử đa nhà bán (B2B2C Marketplace) được thiết kế để chịu tải cực lớn (High TPS/Flash Sales). Hệ thống nhắm tới việc kết nối người bán (Sellers) và người mua (Buyers) thông qua một nền tảng tốc độ cao, minh bạch về tài chính và tích hợp tự động hóa vận chuyển.

**Mục tiêu Kỹ thuật Cốt lõi:**
- **Kiến trúc:** Modular Monolith tinh gọn, giao tiếp nội bộ qua Event-Driven. Ranh giới các module độc lập tuyệt đối (DDD chuẩn).
- **Chống chịu (Resilience):** Không bao giờ rớt đơn, không bán âm (Zero-Overselling) ngay cả khi có hàng chục nghìn lượt truy cập đồng thời.
- **Tính toán thời gian thực (Real-time):** Tự động truy xuất biểu phí vận chuyển thực tế từ bên thứ 3 (GHN, ViettelPost) ngay trong trải nghiệm Giỏ hàng.

## 2. Đối tượng Người dùng (Personas)
1. **Khách hàng (Buyer):** Người tìm kiếm, so sánh giá, bỏ giỏ hàng và thanh toán. Kỳ vọng thao tác mua hàng mượt mà, tốc độ tải trang cực nhanh.
2. **Nhà bán hàng (Seller):** Cá nhân/Doanh nghiệp mở gian hàng. Quản lý Tồn kho, Theo dõi Đơn hàng và Rút tiền doanh thu (Payout).
3. **Quản trị viên (Admin):** Nhân sự sàn. Quản lý chính sách nền tảng, xét duyệt cửa hàng, xử lý tranh chấp và phân bổ hoa hồng.

## 3. Các Module Nghiệp Vụ Chính (In-Scope)

### 3.1. Auth & Users
- Hệ thống JWT (Access/Refresh Token).
- RBAC đa cấp độ: Buyer, Seller, SuperAdmin.
- Sổ địa chỉ (Address Book): Hỗ trợ tọa độ/phân cấp Hành chính chuẩn Việt Nam để tính phí vận chuyển chính xác.

### 3.2. Catalog & Search
- Phân tách cấu trúc Product và SKU.
- Khớp dữ liệu từ PostgreSQL đồng bộ sang **Elasticsearch** (sử dụng Logstash hoặc CDC Debezium) để tìm kiếm full-text, lọc giá/thuộc tính nhanh.

### 3.3. Inventory (Tồn kho)
- **Cực kỳ quan trọng**: Giải quyết bài toán Overselling bằng sự kết hợp của **Redis Lua Script** (khóa và trừ kho Atomic trên RAM) kết hợp bắn sự kiện dọn dẹp hàng ngưng đọng.
- Tách bạch kho của từng Seller.

### 3.4. Cart & Logistics Integrations (Giỏ hàng & Vận chuyển)
- **Caching**: Giỏ hàng lưu trữ 100% bằng Redis JSON/Hash.
- **Dynamic Shipping**: Khi ở trang Checkout, hệ thống sẽ thực thi API Real-time kết nối ViettelPost/GHN để tính tiền ship cho Seller A đến Buyer B. (Xử lý gộp đơn/chia đơn nếu khách mua từ 2 Sellers khác nhau).

### 3.5. Order & Event Bus (Kafka)
- State Machine chặt chẽ cho Vòng đời đơn hàng.
- **Messaging (High TPS)**: Do mục tiêu High Load lớn, **Apache Kafka** chính thức được sử dụng thay BullMQ làm trục xương sống Event-Streaming. Đảm bảo Transaction Outbox pattern khi chốt xong đơn trong DB thì đẩy thông điệp đi.

### 3.6. Payments & Ledger (Thanh toán đa bên)
- Tích hợp Gateway: VNPay, MoMo, Stripe.
- **Idempotency Key Validation** qua Redis để chống nạp đúp webhook.
- **Escrow Ledger (Tính năng Sàn):** Hệ thống tiền ký quỹ. Tiền thanh toán sẽ được hệ thống tạm giữ (Hold). Sàn chỉ giải ngân (Payout trừ đi Commission) vào Ví Seller sau khi đơn hàng được đánh dấu "Giao thành công".

## 4. Yêu cầu Phi Kỹ Thuật (NFR/Observability)
- **High Load Setup:** PostgreSQL Read/Write Split (1 Master, 2+ Replicas). Redis Cluster, Kafka Cluster. Stateless Containerized NestJS instances.
- **Monitoring:** nestjs-pino cho Logging, Sentry cho Exception Tracking. Prometheus xuất metrics về số lượng Event lỗi, Grafana vẽ báo cáo chịu tải.

---
*Tài liệu này được sinh ra từ quá trình Brainstorm. Vui lòng tham chiếu chi tiết tại [[use-cases]] và [[architecture-decisions]]*.