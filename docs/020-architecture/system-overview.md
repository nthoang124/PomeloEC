---
id: ARCH-001
type: architecture
status: review
project: PomeloEC
owner: "@solution-architect"
linked-to: [[prd]], [[use-cases]], [[user-stories]]
created: 2026-04-17
updated: 2026-04-17
---

# Tổng quan Kiến trúc Hệ thống (System Overview)

Tài liệu này mô tả bức tranh vĩ mô của sàn thương mại điện tử **PomeloEC** bằng C4 Model. Kiến trúc chủ đạo là **Modular Monolith**, hướng đến mục tiêu chịu tải 10K TPS trong đợt kết hợp Flash Sale.

## 1. C4 - Context Diagram (Mức Ngữ cảnh)

Sơ đồ mô tả sự tương tác giữa Người dùng cuối (Buyer, Seller, Admin) với Hệ thống PomeloEC và các tích hợp phía bên ngoài (Cổng thanh toán, Hãng giao nhận).

```mermaid
C4Context
  title System Context diagram for PomeloEC Marketplace

  Person(buyer, "Buyer", "Khách hàng mua sắm, tìm kiếm sản phẩm và thanh toán")
  Person(seller, "Seller", "Nhà bán hàng, quản lý kho, in vận đơn")
  Person(admin, "Admin Sàn", "Kiểm duyệt KYC, đối soát nội bộ")

  System(pomeloEC, "PomeloEC Platform", "Hệ thống sàn Thương mại Điện tử B2B2C lõi")

  System_Ext(paymentGateway, "Payment Gateway", "VNPay / MoMo xử lý giao dịch")
  System_Ext(logistics, "Logistics Partners", "GHTK / ViettelPost cung cấp phí ship và vận chuyển")
  System_Ext(firebase, "Firebase Cloud Messaging", "Push Notifications")

  Rel(buyer, pomeloEC, "Tìm kiếm, Giỏ hàng, Mua sắm", "HTTPS/WSS")
  Rel(seller, pomeloEC, "Quản lý tồn kho, Fulfillment", "HTTPS")
  Rel(admin, pomeloEC, "Vận hành và Đối soát", "HTTPS")

  Rel(pomeloEC, paymentGateway, "Tạo link thanh toán & nhận Webhook", "HTTPS")
  Rel(pomeloEC, logistics, "Lấy biểu phí & Pushing Vận đơn", "HTTPS")
  Rel(pomeloEC, firebase, "Đẩy thông báo Realtime", "HTTPS")
```

## 2. C4 - Container Diagram (Mức Ứng dụng/Infrastructure)

Sơ đồ kiến giải cách mà Modular Monolith giao tiếp với CSDL Cơ bản và các bộ nhớ phân tán. Mặc dù là một Backend duy nhất (Node.js Process), nhưng bên dưới được chống lưng bởi dàn Data-store hạng nặng.

```mermaid
C4Container
  title Container diagram for PomeloEC Platform

  Person(buyer, "Buyer", "Khách mua")
  
  System_Boundary(c1, "PomeloEC Monolithic Context") {
    Container(webApp, "Pomelo Web/App", "Astro/React Native", "Client-side rendering & interactions")
    
    Container(apiGateway, "API Gateway / BFF", "NestJS", "Reverse proxy, Rate limiting, Authentication")
    
    Container(coreBackend, "Core Monolith", "NestJS", "Chứa toàn bộ logic các Domain: Identity, Catalog, Order, Loyalty")
    
    Container(workerQueue, "Background Workers", "NestJS + BullMQ", "Consumer xử lý Job bất đồng bộ")
  }

  ContainerDb(postgres, "Primary Database", "PostgreSQL (Prisma)", "Lưu trữ dữ liệu ACID: Auth, Ledger, Orders")
  ContainerDb(redis, "In-memory Engine", "Redis 7", "Chạy Lua Script cho Tồn kho, Session, Rate-limit, Idempotency")
  ContainerDb(kafka, "Event Stream", "Apache Kafka (KRaft)", "Message Bus nội bộ giãn cách gọi API giữa các Module")
  ContainerDb(elasticsearch, "Search Engine", "Elasticsearch", "Lập chỉ mục tìm kiếm SKU & Recommendation")
  ContainerDb(s3, "Object Storage", "Supabase Storage/S3", "Chứa File hình ảnh, Video review, PDF Vận đơn")

  Rel(buyer, webApp, "Sử dụng")
  Rel(webApp, apiGateway, "Gọi API", "JSON/HTTPS")
  Rel(apiGateway, coreBackend, "Điều hướng & Chặn đứng rủi ro")
  Rel(apiGateway, redis, "Rate-limit & Banned IP", "TCP")
  
  Rel(coreBackend, postgres, "Ghi SQL Transaction", "TCP/5432")
  Rel(coreBackend, redis, "Gọi Lua Script (Khóa tồn kho)", "TCP/6379")
  Rel(coreBackend, elasticsearch, "Query Search & Filter", "HTTP/9200")
  Rel(coreBackend, kafka, "Publish Domain Events (OrderCreated)", "TCP/9092")
  
  Rel(workerQueue, kafka, "Consume Events", "TCP/9092")
  Rel(workerQueue, postgres, "Reconciliation & Async Write", "TCP/5432")
```

## 3. Kiến trúc Core Module (Logical Architecture)

Theo quy tắc **Domain-Driven Design (DDD)**, thư mục của Backend sẽ chia theo các Bounded Context (Không chia theo `controllers/`, `services/` truyền thống).

### Mạng lưới Modules:
1. **[IAM Module]:** Quản lý Identity, SSO, JWT, RBAC, KYC, Địa chỉ.
2. **[Catalog Module]:** Quản lý Danh mục, SKU Matrix, Brand. (Đồng bộ Kafka sang Elastic).
3. **[Inventory Module]:** Sinh tử lõi. Nắm giữ Logic khóa Tồn Kho (Redis Lua Script).
4. **[Cart & Checkout Module]:** Tính giá Rule Engine, Prorating Voucher, Tính Ship đối tác.
5. **[Order & Fulfillment Module]:** Quản lý State Machine đơn hàng. Giao tiếp Bulk Vận chuyển.
6. **[Payment Module]:** Đối soát tiền Escrow. Quản lý Idempotency.
7. **[Communication Module]:** Đẩy Socket, SMS, Push Notification.

## 4. Non-Functional Requirements (NFR) Fulfillment

* Làm sao để đạt **10,000 TPS** trong FlashSale?
  -> Chặn toàn bộ Read Traffic vào DB bằng Redis Caching. Mọi tương tác Checkout Write Traffic bị ép quy về **1 lệnh Call Atom Lua Script** trên Redis để trừ Tồn kho/Voucher. Lợi dụng I/O Single-Thread của Redis để chống 100% Race Condition.
* Hệ thống có sập dây chuyền (Cascading Failure) không?
  -> Không. Giao tiếp qua *Kafka* (Event-Driven). Order thành công chỉ đẩy mảng JSON vô Kafka. Việc gửi Email, trừ % Hoa hồng Affiliate (chạy cực chậm) sẽ do BullMQ Worker gánh nền bất đồng bộ.
