---
id: ARCH-002
type: architecture
status: approved
project: PomeloEC
owner: "@lead-architect"
created: 2026-04-17
updated: 2026-04-22
---

# Lựa chọn Công nghệ (Enterprise Tech Stack)

Dựa trên yêu cầu của PRD và các tiêu chuẩn bảo mật/kỹ thuật khắt khe (Zero-Trust), đây là bộ công cụ định hình cho việc phát triển dự án. Hạ tầng đã được nâng cấp lên mô hình Enterprise với khả năng chia nhỏ trách nhiệm (Decoupled Architectures).

## 1. Hệ Sinh Thái Phát Triển Tập Trung & Ứng Dụng

| Lớp | Công nghệ | Lý do lựa chọn (Trade-offs & ROI) |
|---|---|---|
| **Ngôn ngữ** | **TypeScript (Strict Mode)** | An toàn kiểu tĩnh (Type safety) tuyệt đối với Interface. Loại bỏ 80% bug runtime (đặc biệt trong E-commerce tiền bạc). |
| **Gói quản lý** | **pnpm (Monorepo)** | Tốc độ cài đặt x3 npm. Tiết kiệm ổ cứng. Khả năng cô lập Workspace (Frontend, Backend, Packages) trơn tru hoàn hảo. |
| **Backend API** | **NestJS 10+** | Đóng vai trò Business Logic Gateway. Nhận Token, kiểm tra quyền và điều phối logic giao dịch phức tạp. Ép khuôn kiến trúc Modular/Dependency Injection. |
| **Mặt tiền (Frontend)** | **Next.js 15 (App Router)** | Tối ưu SEO, Web Vitals và UX. Sử dụng thư viện `next-auth` tích hợp giao diện liền mạch. |

## 2. Hạ Tầng Dữ Liệu Tối Cao (BaaS & Database)

| Component | Công nghệ | Bối cảnh sử dụng |
|---|---|---|
| **Relational DB** | **Supabase PostgreSQL** | Lưu trữ cốt lõi ACID. Tận dụng sức mạnh BaaS của Supabase, tự động có sãn connection pooling (Supavisor) và backup chuyên nghiệp. |
| **Object Storage**| **Supabase Storage** | Thay thế AWS S3 để tiết kiệm chi phí tích hợp. Chứa Avatar, Video, Hình ảnh sản phẩm. Client upload trực tiếp qua SDK. |
| **ORM** | **Prisma** | Mapping Model 1-1 với DB Supabase. Sinh Migration Type-Safe. Ép logic kết nối an toàn. |

## 3. Quản Trị Trọng Yếu & Phân Tích (IAM & Analytics)

| Component | Công nghệ | Bối cảnh sử dụng |
|---|---|---|
| **Identity / SSO** | **Keycloak** | Máy chủ Ủy quyền (Identity Provider) độc lập. Xử lý chuẩn OIDC/OAuth2, tự lo form Đăng nhập, MFA, và Federation. Cắt bỏ gánh nặng build Auth ở NestJS. |
| **Analytics (OLAP)**| **ClickHouse** | Cơ sở dữ liệu cột (Column-oriented DB) chuyên biệt cho Time-Series & Khối lượng dữ liệu khổng lồ. Phục vụ tính nhanh Doanh thu Seller, Lượt xem SP. |
| **Change Data Capture**| **Debezium** | Gắn thẳng vào WAL (Write-Ahead Log) của Postgres Supabase. Tự động mót từng Record thay đổi ở bảng Orders đẩy qua Kafka -> ClickHouse mà không cần code Dual-Write. |
| **Message Broker**| **Apache Kafka (KRaft)**| Trái tim của sự kiện (Event-Bus). Nạp dữ liệu Streaming siêu tốc từ Debezium để chia luồng tin nhắn đi các Modules và Sync Data. |

## 4. Tốc Độ, DevOps & Quan Sát (Cache & Observability)

- **In-Memory Store**: **Redis 7** (Luôn bật). Cứu cánh lưu Giỏ Hàng tạm, Rate Limit, Khóa Tồn Kho bằng Lua Script nguyên tử và Pre-warm Cache FlashSale.
- **Containerization**: **Docker** & **Docker Compose** (Dành cho việc boot cụm Kafka, Redis, Keycloak, Clickhouse ở dưới Local).
- **Log Management**: **Pino** (Sinh log JSON cho máy đọc, nhanh gấp 5 lần Winston).
- **Tracing**: Sẽ đục lỗ OpenTelemetry. Bắt buộc attach Trace-ID vào mỗi luồng xử lý.

---
> [!CAUTION]  
> Mọi thư viện/tool nào không nằm trong danh sách này bị NGHIÊM CẤM đưa vào Codebase (cắm flag `npm install`) nếu chưa có văn bản ADR trình qua Lead Architect phê duyệt (Chuẩn YAGNI).
