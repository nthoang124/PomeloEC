---
id: ARCH-002
type: architecture
status: approved
project: PomeloEC
owner: "@lead-architect"
created: 2026-04-17
updated: 2026-04-17
---

# Lựa chọn Công nghệ (Tech Stack)

Dựa trên yêu cầu của PRD và các tiêu chuẩn bảo mật/kỹ thuật khắt khe, đây là bộ công cụ định hình cho việc phát triển dự án. 

## 1. Hệ Sinh Thái Phát Triển Tập Trung

| Lớp | Công nghệ | Lý do lựa chọn (Trade-offs & ROI) |
|---|---|---|
| **Ngôn ngữ** | **TypeScript (Strict Mode)** | An toàn kiểu tĩnh (Type safety) tuyệt đối với Interface. Loại bỏ 80% bug runtime (đặc biệt trong E-commerce tiền bạc). |
| **Gói quản lý** | **pnpm (Monorepo)** | Tốc độ cài đặt x3 npm. Tiết kiệm ổ cứng. Khả năng cô lập Workspace (Frontend, Backend, Packages) trơn tru hoàn hảo. |
| **Framework** | **NestJS 10+** | Architecture mặc định rất sạch. Tự ép khuôn kiến trúc Modular/Dependency Injection, chặn Dev code rác so với Express js trần. |

## 2. Hạ Tầng Dữ Liệu (Database & Middleware)

| Component | Công nghệ | Bối cảnh sử dụng |
|---|---|---|
| **Relational DB** | **PostgreSQL 16** | Chứa data tĩnh, ACID. (Orders, Users, Ledgers). An toàn tiền bạc trên hết. Dùng Partitioning nếu bảng Orders quá lớn. |
| **ORM** | **Prisma** | Code Type-Safe tuyệt đối. Sinh Migration tốt. (Dự định tương lai nếu Query phức tạp có thể bóp Kysely nhưng hiện do tốc độ Go-to-market nên ưu tiên Prisma). |
| **In-Memory Store** | **Redis 7** | Backbone của FlashSale. Quản lý Cache, Session, Lua Script (Chống bán âm Overselling) và Rate-Limit ở cồng Gateway. |
| **Message Broker** | **Apache Kafka (KRaft)** | Thông lượng cực cao. Tránh tình trạng sập nghẽn, đảm bảo mất điện cúp cầu dao không mất message (Persistent log). |
| **Search Engine** | **Elasticsearch** | Phân tích Filter Text, Phân trang nhạy cảm, Fulltext-Search mạnh mẽ, hỗ trợ Boost Rank / Recommendation Feed. |
| **Job Queue** | **BullMQ** | Quản lý Delay Queue cho hủy đơn (15 phút), Retry Exponential Backoff khi API GHTK lỗi 500. Trực quan. |

## 3. DevOps & Quan Sát (Observability)

- **Containerization**: **Docker** & **Docker Compose** (Cho Local/Staging). 
- **CI/CD**: TBD (Dự kiến GitHub Actions / Jenkins).
- **Log Management**: **Pino** (Sinh log định dạng JSON trực tiếp cho máy đọc, nhanh gấp 5 lần Winston).
- **Tracing**: Tương lai chuẩn bị đục lỗ **OpenTelemetry**. Code cần attach Trace-ID/Correlation-ID vào từng HTTP Request (Bắt buộc theo rule Error-Handling).

Ràng buộc (Constraint): Mọi công nghệ nếu không có tên trong danh sách này BẮT BUỘC phải viết 1 bản `architecture-decisions` (ADR) xin trình duyệt trước khi gài vào Source Code.
