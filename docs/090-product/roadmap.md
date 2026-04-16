---
id: product-roadmap
title: PomeloEC Product Roadmap
type: roadmap
context: "Lộ trình ra mắt sản phẩm chia theo các cột mốc Now-Next-Later."
---

# 🚀 PomeloEC Product Roadmap (Now, Next, Later)

Đây là lộ trình (Product Roadmap) định hướng tính năng dựa trên Khung giá trị Agile (Outcome-based). Chúng ta tập trung giải quyết vấn đề của Buyer và Seller thay vì chỉ giao Feature thô.

## 🟢 Thời điểm hiện tại (NOW - Q2.2026)
**Trọng tâm:** Xây dựng lõi chịu tải (Foundation & Core Shopping Flow).
- **Core Platform:** Khởi tạo kiến trúc NestJS Modular Monolith, CI/CD pipelines, Docker hóa Postgres + Redis + Kafka.
- **Gian hàng (Catalog):** Cho phép Nhà Bán (Seller) tạo sản phẩm thuần (Không biến thể) và có biến thể (SKUs). Tích hợp search tĩnh (Text-Search) qua API.
- **Giỏ hàng & Cổng Checkout (High-TPS):** Cơ chế bỏ giỏ hàng vào Redis Cache. Khóa trừ tồn kho an toàn bằng Engine Lua Script.
- **Logistics (V1):** Tích hợp tĩnh API Giao Hàng Nhanh (GHN) để tính phí vận chuyển real-time lúc lên đơn.

## 🟡 Thời điểm tiếp theo (NEXT - Q3.2026)
**Trọng tâm:** Tăng trải nghiệm mượt mà, quản lý dòng tiền và Onboard User.
- **Ví Điện Tử Sàn (Ledger & Escrow):** Tích hợp cổng Thanh toán VNPay/Momo. Giữ tiền khách hàng (Escrow), chỉ giải ngân cho Seller khi khách xác nhận "Đã nhận hàng thành công".
- **Hệ thống Search Nâng cao:** Tích hợp **Elasticsearch**, đồng bộ liên tục bằng Logstash từ PostgreSQL sang để tăng tốc độ tìm kiếm danh mục hàng hóa (Facet Search, Typo Tolerance).
- **Automation Notification:** Đẩy Events qua Kafka bắn thông báo Email/SMS (Real-time) cho User trạng thái đơn hàng.

## 🔴 Tương lai (LATER - Q4.2026)
**Trọng tâm:** Tối ưu hóa Big Data, AI và Tăng cường Hệ sinh thái.
- **Công cụ Marketing cho Seller:** Voucher, Flash Sale Engine (Giảm giá chớp nhoáng chịu tải khổng lồ).
- **Recomendation Engine (Dữ Liệu Lớn):** AI Gợi ý sản phẩm liên quan dựa trên thói quen mua hàng.
- **Hệ thống Admin & Dispute:** Quản lý tranh chấp giữa User và Seller, xử lý trả hàng hoàn tiền (Return & Refund).

---
> [!TIP]
> **Product Note:** 
> Lộ trình có thể thay đổi linh hoạt theo 피드백 (feedback) sớm từ bản MVP. Development Team sẽ cắt những Features lớn từ đây thành các User Stories theo INVEST framework đưa vào Backlog.