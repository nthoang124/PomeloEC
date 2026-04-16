---
id: MTP-001
type: test-plan
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[system-overview]], [[execution-roadmap]]
created: 2026-04-17
updated: 2026-04-17
---

# Kế Hoạch Thử Nghiệm Chủ Đạo (Master Test Plan) - PomeloEC

Tài liệu này xác định chiến lược kiểm thử toàn diện cho hệ thống PomeloEC dựa trên bản vẽ C4 Diagram (`system-overview.md`) và Lộ trình thực thi (`01-execution-roadmap.md`).

## 1. Mục Tiêu Kiểm Thử (Testing Objectives)
- Đảm bảo tính nhất quán dữ liệu (Data Integrity) trên các giao dịch tài chính và khóa tồn kho.
- Đạt mức độ bao phủ mã nguồn (Code Coverage): **≥ 85%** cho các Core Modules.
- Đáp ứng khả năng chịu tải phi phím: Chịu được rơ-le **10.000 TPS** vào Endpoint Checkout (UC-03).
- Chống thảm họa: Xác minh Idempotency chống loop webhook VNPay.

## 2. Các Cấp Độ & Phương Pháp Thử Nghiệm

Hệ thống được chia thành 4 cấp độ Test Pipeline dựa trên tháp kiểm thử (Testing Pyramid).

### 2.1 Unit Testing (Cấp độ hàm / Phương thức)
- **Công cụ:** Jest
- **Phạm vi (Scope):** Code Logic tính toán. Không chạm đến DB.
- **Trọng tâm Module:**
  - `Cart & Checkout Module`: Hàm `PricingRuleEngine().calculateProration()` - Test chia đều tỉ lệ voucher vào từng sản phẩm con.
  - `Catalog Module`: Hàm `CartesianProduct()` - Test thuật toán sinh Matrix 12 SKUs có sinh trùng lặp không.
  - `Payment Module`: Hàm xác minh `VerifyHMAC(x-vnpay-signature)`.

### 2.2 Integration Testing (Cấp độ giao thức giữa các thành phần)
- **Công cụ:** Jest + Testcontainers (Docker tự động bưng Redis/Postgres lên khi chạy test)
- **Phạm vi:** Kiểm tra việc liên kết giữa Code và Database/Queue.
- **Trọng tâm Module:**
  - **M3 - Inventory Module:** Kịch bản kiểm thử trực tiếp file Lua Script trên 1 môi trường Redis thật. Dùng `Promise.all` giả lập 10 req vào cùng 1 lúc xem Redis có trừ thủng 0 không.
  - **M5 - Order Module:** Transaction SQL. Đảm bảo nếu lưu OrderItems bị lỗi thì bảng Orders phải CANCELED (Rollback ACID).
  - **M7 - Background Module:** Kiểm tra BullMQ worker có bốc được Job khỏi Queue sau 15 phút (Fake Timer) để Hủy đơn ảo (UC-13).

### 2.3 System Integration / Contract Testing
- **Công cụ:** Pact / MSW (Mock Service Worker)
- **Phạm vi:** Giao tiếp với các bên thứ 3 (Hệ thống ngoại vi nằm ở C4 Context).
- **Trọng tâm Module:**
  - Mock API của GHTK/ViettelPost (Lỗi `500 Internal Server Error`, `429 Too Many Requests`). Đảm bảo hệ thống bật backoff retry chuẩn xác.
  - Sinh Webhook VNPay giả định để Test Idempotency (Gửi cùng 1 payload 2 lần, mong đợi nhận statusCode 200 nhưng DB chỉ cập nhật 1 lần).

### 2.4 End-to-End (E2E) & Acceptance Testing
- **Công cụ:** Playwright / Cypress
- **Phạm vi:** Kịch bản hành vi Người dùng (Buyer/Seller Flow) xuyên suốt mọi Tầng Frontend -> API Gateway -> Monolith -> DB.
- **Trọng tâm Flows:**
  - `TC-E2E-01: Happy Path Mua Hàng`: Từ `home.html` -> Search -> `pdp.html` Thêm vào giỏ -> `checkout.html` Thanh toán Giao hàng COD.
  - `TC-E2E-02: Seller Luồng chốt`: Từ `seller-dashboard.html` -> Vận đơn -> Bulk xác nhận -> Kiểm tra Đã Giao.

### 2.5 Performance & Load Testing
- **Công cụ:** k6 / Artillery
- **Phạm vi:** Đánh giá điểm rớt dịch vụ (Break-point) theo NFR.
- **Kịch bản:**
  - **Stress Test Checkout:** Gửi 10.000 requests/s vào Redis Lock Endpoint.
  - **Spike Test Search:** Gửi đột ngột 5.000 query vào Elasticsearch lúc 0h đêm.

## 3. Quản lý Môi trường Kiểm thử (Environments)

1. `Local / Dev`: Môi trường của DEV (Testcontainers bọc sẵn).
2. `Staging / UAT`: Bản copy 1:1 của Production nhưng data được masking (Mã hóa). Phục vụ QC Manual Test và Beta Testing cho Seller thật.
3. `Production`: Môi trường giao dịch thật.

## 4. Rào chắn Chất lượng (Quality Gate)
- Mọi nhánh Git `feat/*` hoặc `fix/*` khi tạo PR (Pull Request) phải chạy qua Github Actions Pipeline:
  - Nếu `npm run lint` Lỗi -> Cấm Merge.
  - Nếu `npm test` Lỗi hoặc Tụt Coverage dưới 85% -> Cấm Merge.
  - Bắt buộc phải có 1 QA hoặc Tech Lead review logic Lua Script / SQL Transaction.

## 5. Tổ chức Kho lưu trữ Test Cases
*Chi tiết các kịch bản test sẽ được viết thành các file riêng ở thư mục:* `docs/050-testing/test-cases/`
- `TC-IAM-*.md`
- `TC-INVENTORY-*.md`
- `TC-PAYMENT-*.md`
