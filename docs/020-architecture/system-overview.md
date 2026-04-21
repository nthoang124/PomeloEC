---
id: ARCH-001
type: architecture
status: approved
project: PomeloEC
owner: "@solution-architect"
linked-to: [[prd]], [[use-cases]], [[user-stories]]
created: 2026-04-17
updated: 2026-04-22
---

# Tổng quan Kiến trúc Hệ thống (Enterprise System Overview)

Tài liệu này mô tả bức tranh vĩ mô của sàn thương mại điện tử **PomeloEC** bằng C4 Model. Kiến trúc đã được nâng cấp lên chuẩn **Enterprise Modular Monolith + Decoupled Infrastructure**, định tuyến rõ ràng giữa hệ thống Giao dịch (OLTP) và Phân tích (OLAP), hướng đến mục tiêu chịu tải 10K TPS.

## 1. C4 - Context Diagram (Mức Ngữ cảnh)

Sơ đồ mô tả sự tương tác giữa Người dùng cuối với Hệ thống PomeloEC và khối Identity Provider riêng biệt (Keycloak).

```mermaid
C4Context
  title System Context diagram for PomeloEC Enterprise

  Person(buyer, "Buyer", "Khách hàng mua sắm, tìm kiếm sản phẩm và thanh toán")
  Person(seller, "Seller", "Nhà bán hàng, theo dõi dashboard realtime")
  
  System_Ext(keycloak, "Keycloak (IAM)", "Identity Provider: Quản lý Xác thực, SSO, OIDC, User Pool")
  
  System(pomeloEC, "PomeloEC Platform", "Hệ thống sàn Thương mại Điện tử lõi (Giao dịch & Thống kê)")

  System_Ext(paymentGateway, "Payment Gateway", "VNPay / MoMo xử lý giao dịch")
  System_Ext(logistics, "Logistics Partners", "GHTK / ViettelPost cung cấp phí ship và vận chuyển")

  Rel(buyer, keycloak, "Đăng nhập / Đăng ký / SSO", "OIDC/HTTPS")
  Rel(seller, keycloak, "Đăng nhập / 2FA", "OIDC/HTTPS")

  Rel(buyer, pomeloEC, "Giao dịch bằng OIDC Token", "HTTPS/WSS")
  Rel(seller, pomeloEC, "Đăng sản phẩm, Đọc Dashboard Analytics", "HTTPS")

  Rel(pomeloEC, keycloak, "Xác thực JWT Signature (Verify)", "JWKS/HTTPS")
  Rel(pomeloEC, paymentGateway, "Tạo link thanh toán & nhận Webhook", "HTTPS")
  Rel(pomeloEC, logistics, "Lấy biểu phí & Pushing Vận đơn", "HTTPS")
```

## 2. C4 - Container Diagram (Luồng dữ liệu cấp Hạ tầng)

Sơ đồ kiến giải Data Pipeline và Event-Driven Architecture. NestJS đóng vai trò API Gateway & Business Logic, Supabase hứng dữ liệu hạt nhân, CDC bắt Log thời gian thực đẩy qua Kafka và chốt trạm tại ClickHouse.

```mermaid
C4Container
  title Container diagram for PomeloEC Infrastructure

  Person(user, "Người dùng", "Buyer / Seller")
  System_Ext(keycloak, "Keycloak Server", "Identity Management")
  
  System_Boundary(c1, "PomeloEC Application Layer") {
    Container(webApp, "Pomelo Web/App", "Next.js", "SSR/CSR, Tích hợp Next-Auth")
    Container(coreBackend, "Core Monolith", "NestJS", "API Gateway & Business Logic (Cart, Order, Payment)")
    Container(analyticsService, "Analytics Service", "NestJS/Go", "Tiếp nhận query báo cáo, Dashboard từ Seller/Admin")
  }

  System_Boundary(c2, "PomeloEC Data Layer") {
    ContainerDb(postgres, "Primary DB", "Supabase Postgres", "OLTP: Chứa Order, Catalog, Escrow")
    ContainerDb(storage, "Object Storage", "Supabase Storage", "CDN File (Avatar, Video, Images)")
    ContainerDb(redis, "In-memory Engine", "Redis 7", "Cache, Rate-limit, Lua Script Khóa Tồn kho")
    ContainerDb(clickhouse, "Analytics DB", "ClickHouse", "OLAP: Tính tổng doanh thu, lượt view")
  }

  System_Boundary(c3, "PomeloEC Event Streaming Layer") {
    Container(debezium, "CDC Engine", "Debezium", "Cắm mút WAL (Write-Ahead Log) của Postgres")
    ContainerDb(kafka, "Event Stream", "Apache Kafka", "Message Bus chịu tải cao")
  }

  Rel(user, webApp, "Sử dụng")
  Rel(webApp, keycloak, "Lấy Token (Next-Auth)")
  Rel(webApp, coreBackend, "API calls (Kèm Token)", "HTTPS")
  Rel(webApp, analyticsService, "Xem biểu đồ (Dashboard)", "HTTPS")
  Rel(webApp, storage, "Upload/Download trực tiếp (SDK)", "HTTPS")

  Rel(coreBackend, keycloak, "Xác nhận tính hợp lệ Token")
  Rel(coreBackend, postgres, "Giao dịch ACID (Prisma)", "TCP/5432")
  Rel(coreBackend, redis, "Gọi Lua Script (Khóa tồn kho)", "TCP/6379")
  
  Rel(postgres, debezium, "Streaming WAL (Row changes)", "Replication")
  Rel(debezium, kafka, "Biến đổi thành Domain Events", "TCP")
  
  Rel(analyticsService, kafka, "Consume Events (Orders, Clicks)", "TCP")
  Rel(analyticsService, clickhouse, "Ghi/Đọc data OLAP", "TCP")
```

## 3. Kiến trúc Luồng Dữ liệu Đặc Thù (CDC & CQRS)

Theo yêu cầu chuẩn Enterprise:
* **Chống Dual-Write**: Không còn tình trạng NestJS gọi `await db.save()` xong gọi tiếp `kafka.emit()`.
* Mọi hành động làm thay đổi CSDL tại Supabase Postgres sẽ được **Debezium (CDC)** bắt trọn ở tầng hệ điều hành (Log file) và vứt vào **Kafka** với tốc độ mili-giây.
* **CQRS ngầm định**: 
  - Lệnh **Write** (Tạo đơn, Trừ tiền) gọi thẳng vào NestJS ➔ Supabase Postgres.
  - Lệnh **Read báo cáo** (Xem doanh thu tuần, Phân tích Clickstream) gọi vào **Analytics Service** ➔ **ClickHouse** (Đã được đồng bộ từ Kafka). Đảm bảo tách bạch 100% Performance giữa việc Mua hàng và Xem báo cáo.

## 4. Quản lý Modules Chức Năng Cốt Lõi

1. **[IAM & Identity]:** ỦY QUYỀN TOÀN BỘ cho Keycloak.
2. **[Catalog Module]:** Quản lý Danh mục, SKU Matrix. Gắn Supabase Storage.
3. **[Inventory Module]:** Redis Lua Script nguyên tử đóng vai trò Thần giữ cửa (Gatekeeper).
4. **[Order & Payment Layer]:** Postgres Transaction. Hứng IPN VNPay/MoMo.
5. **[Analytics & Feed]:** Dịch vụ hoàn toàn cô lập, consume Kafka đẩy vô ClickHouse. Dùng cho trang Admin và Dashboard Thống kê Gian hàng.
