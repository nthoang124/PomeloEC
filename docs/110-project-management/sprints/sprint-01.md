---
id: sprint-01
title: Sprint 1 - Core Foundation
type: sprint
context: "Sprint đầu tiên thiết lập móng nhà."
---

# 🏃 Sprint 1: Core Foundation (Móng Nhà Hệ Thống)

**Mục tiêu Sprint (Sprint Goal):** Hoàn tất toàn bộ thiết lập Boilerplate với Base Architecture (NestJS + Prisma) và kéo được các Services hạ tầng (Postgres, Redis, Kafka) lên Docker trên môi trường Local.

## 📋 Sprint Backlog
1. **[Task 1]:** Khởi tạo `pnpm workspace` và bộ cấu trúc Monorepo. (✅ *Hoàn tất*)
2. **[Task 2]:** Khởi tạo Backend Project bằng NestJS CLI. (✅ *Hoàn tất*)
3. **[Task 3]:** Vẽ và cài đặt cấu hình `docker-compose.yml` tích hợp Postgres, Redis, Kafka (KRaft mode). (✅ *Hoàn tất*)
4. **[Task 4]:** Cài đặt `@prisma/client`, thiết lập schema trống kết nối Postgres. (✅ *Hoàn tất*)
5. **[Task 5]:** Cấu hình Logger định dạng JSON chuẩn (Sử dụng `nestjs-pino`).
6. **[Task 6]:** Cấu hình Security Layer cơ bản (Cors, Helmet, Rate Limiter).

---
*Ghi chú: Tất cả các Task từ 1-4 đã được Code Agent hoàn thiện trong Phase 1.*
*Tiếp tục theo dõi các Task còn lại trong Pipeline.*
