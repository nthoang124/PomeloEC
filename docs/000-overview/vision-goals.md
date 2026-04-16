---
id: okrs-q3-2026
title: PomeloEC - Objectives and Key Results
type: okr
context: "Mục tiêu (Focus) của Development Team và Product Team trong Giai đoạn Launch."
---

# 🎯 Nhắm Mục Tiêu Quý & OKRs (PomeloEC)

Đây là tài liệu gắn kết mục tiêu (Alignment) giữa Business và Engineering, đảm bảo hệ thống không bị over-engineering mà tập trung vào các Key Results sống còn.

## 🏆 Objective 1: Trở thành Sàn Thương mại B2B2C vận hành với tốc độ chớp nhoáng
_Chúng ta muốn PomeloEC có trải nghiệm mua sắm nhanh gấp 2 lần các đối thủ nội địa, không bị "nghẽn" lúc Flash Sale._

* **KR 1.1:** Đạt được thời gian phản hồi (P95 Response Time) của API Checkout `< 150ms`.
* **KR 1.2:** Hệ thống chịu tải được `10,000 TPS` (Transactions Per Second) trong đợt Sale mà không bị crash Database.
* **KR 1.3:** Tỷ lệ Overselling (Bán âm số lượng kho thực tế) là `0.00%` (Zero Tolerance).

## 🏆 Objective 2: Xây dựng hệ sinh thái Automation Vận Chuyển mạnh mẽ
_Kho vận và Logistics là "nút cổ chai" của Sàn TMĐT. Hệ thống phải chủ động tính và chia đơn gọn gàng._

* **KR 2.1:** Hoàn thành tích hợp (Full Sandbox & Prod) 2 đơn vị Giao Hàng Nhanh (GHN) và ViettelPost.
* **KR 2.2:** Tự động tách đơn mua thuật toán (Split-Order Routing) đạt độ chính xác `100%` (chia nhỏ đơn nếu khách mua từ 3 nhà bán khác nhau).

## 🏆 Objective 3: Developer Experience (Kỹ Thuật Xây Nền Tảng Mở)
_Chúng ta muốn PomeloEC Marketplace có thể vươn tầm thành Super App trong 3 năm tới nhờ Modular Monolith architecture._

* **KR 3.1:** 100% Core Domains (Catalog, Inventory, Order, Payment) được decouple thông qua Event-Streaming (Apache Kafka), không gọi chéo Database.
* **KR 3.2:** Đạt > `85%` Test Coverage cho Service lớp Logic theo quy tắc tại `tests.md`.
