---
id: IMPL-001
type: roadmap
status: active
project: PomeloEC
owner: "@product-manager, @solution-architect"
linked-to: [[system-overview]], [[use-cases]]
created: 2026-04-17
updated: 2026-04-17
---

# Lộ trình Triển khai Chi tiết (Detailed Execution Roadmap)

Tài liệu này ánh xạ 100% các **Use Cases** (UC) vào 7 **Modules** cốt lõi của Kiến trúc Modular Monolith. Đây là kim chỉ nam cho Backend Developer biết chính xác chức năng nào nằm ở thư mục nào và có thứ tự ưu tiên (Priority) ra sao.

---

## M1. IAM Module (Identity & Access Management)
**Trách nhiệm:** Quản lý dữ liệu định danh, phiên đăng nhập, cấp quyền và địa chỉ vật lý.

| Mã UC | Tên Tính năng | Ưu Tiên | Chuẩn đầu ra (DoD) |
| :--- | :--- | :--- | :--- |
| **UC-00A** | Đăng ký & Đăng nhập Khách hàng | Cao (P0) | API SignIn/SignUp. SSO Google. Token lưu Cookie. |
| **UC-00B** | Đăng ký Mở Gian Hàng (Seller KYC) | Cao (P1) | Upload ảnh CMND. Bảng Admin xét duyệt phân quyền Role. |
| **UC-00C** | Quản lý Sổ Địa Chỉ (Address Book) | Cao (P1) | Tích hợp Master Data hành chính Việt Nam để mapping mã với GHTK. |

## M2. Catalog Module (Danh mục & Tìm kiếm)
**Trách nhiệm:** Trưng bày sản phẩm, cây danh mục đa cấp, phản hồi người dùng, phân tích hành vi.

| Mã UC | Tên Tính năng | Ưu Tiên | Chuẩn đầu ra (DoD) |
| :--- | :--- | :--- | :--- |
| **UC-11** | Quản trị Biến thể Sản phẩm (Matrix) | Cao (P0) | Logic thuật toán sinh Ma trận màu/size, check duplicate SKU. |
| **UC-01** | Tìm kiếm & Lọc Tốc độ cao | Cao (P0) | Auto-sync data lên Elasticsearch, viết High-performance Query DSL. |
| **UC-10** | Đánh giá Sản phẩm (Reviews) | Vừa (P2) | Logic Verify Order. Upload Video S3. Worker update Avg Rating. |
| **UC-17** | Gợi ý Cá nhân hóa (Recommend Feed) | Thấp (P3) | Bóc tách Clickstream, truy vấn Function Score trên ElasticSearch. |

## M3. Inventory Module (Kho Hàng Core)
**Trách nhiệm:** Đảm bảo tính nhất quán của Tồn kho, chống overselling lúc 10k người tranh mua 1 sản phẩm.

| Mã UC | Tên Tính năng | Ưu Tiên | Chuẩn đầu ra (DoD) |
| :--- | :--- | :--- | :--- |
| **UC-04** | Nhập/Xuất Tồn Kho (Ledger) | Cao (P0) | Ghi nhận thẻ kho, đối soát lệch kho, đồng bộ Total Stock lên Redis. |
| **UC-03_L**| **Lock Tồn Kho FlashSale** | **Tối Cao (P0)**| **Lua Script trên Redis**. Đảm bảo trừ kho <2ms, Lock tạm trong 15 phút. |

## M4. Cart & Checkout Module (Giỏ hàng & Khuyến mãi)
**Trách nhiệm:** Lưu tạm giỏ hàng, tính giá (Rule Engine) chống thất thoát.

| Mã UC | Tên Tính năng | Ưu Tiên | Chuẩn đầu ra (DoD) |
| :--- | :--- | :--- | :--- |
| **UC-02** | Giỏ hàng & Ước tính Ship | Cao (P0) | Dùng Redis Hash lưu giỏ. Tự gọi API GHTK lấy cước ước tính. |
| **UC-06** | Áp dụng Voucher (Stacking) | Cao (P1) | Rule Engine tính giá đa tầng. Khóa quota trên Redis. Thuật toán Prorating. |
| **UC-16** | Loyalty Shopee Xu | Vừa (P2) | Trừ điểm Point bằng Redis Script. Worker hoàn trả Point khi hủy. |
| **UC-18** | Seller Promotions (FlashSale) | Vừa (P2) | CRON kích hoạt giảm giá lúc 0h, Pre-warm cache lên Redis. |

## M5. Order & Fulfillment Module (Điều phối Đơn hàng)
**Trách nhiệm:** Trái tim giữ State Machine của đơn hàng, đẩy API đi các hãng vận chuyển.

| Mã UC | Tên Tính năng | Ưu Tiên | Chuẩn đầu ra (DoD) |
| :--- | :--- | :--- | :--- |
| **UC-03_W**| **Chốt Đơn (DB Write)** | **Tối Cao (P0)**| Mở Transaction Postgre. Tách Đơn đa Shop (Sub-order). Bắn Kafka Event. |
| **UC-12** | Single Fulfillment | Cao (P1) | Gọi API tạo bill ViettelPost. Lấy mã Barcode trả về App. |
| **UC-19** | Bulk Fulfillment (In Hàng Loạt) | Vừa (P2) | Gom 500 orders qua Queue. Nối PDF thành 1 cụm đầy đủ mã Vạch. |
| **UC-08** | Order Tracking State | Cao (P1) | Nhận Webhook trạng thái gói hàng và chuyển đổi State Machine. |

## M6. Payment Module (Tài chính & Đối soát)
**Trách nhiệm:** Giữ cục tiền của Buyer (Escrow), bắt chuẩn dòng tiền VNPay/MoMo về.

| Mã UC | Tên Tính năng | Ưu Tiên | Chuẩn đầu ra (DoD) |
| :--- | :--- | :--- | :--- |
| **UC-07** | Nhận Webhook VNPay | Cao (P0) | **Chống Idempotency (Lặp 2 lần)**. Chữ ký HMAC an toàn tuyệt đối. |
| **UC-05** | Payout & Escrow | Cao (P1) | Gom số dư Khả Dụng. Khấu trừ phí Sàn tự động. Bắn API về Bank Seller. |
| **UC-09** | Refund & RMA | Vừa (P2) | Đóng băng Escrow, Tạm khóa tiền tranh chấp, API đảo chiều VNPay. |
| **UC-14** | Tự động Chốt Tiền | Vừa (P2) | CRON quét các đơn DELIVERED quá hạn, chuyển sang COMPLETED. |
| **UC-20** | Affiliate KOC | Thấp (P3) | Đọc Cookie aff_id, khấu trừ hoa hồng đẩy vào ví KOC riêng. |
| **UC-21** | Gạch Nợ COD Vận chuyển | Vừa (P2) | Đọc Stream File CSV cực lớn, đối chiếu Tracking ID với số tiền sàn nhận. |

## M7. Background / Extra Module (Tự động hóa & Tooling)
**Trách nhiệm:** Hệ thống chạy ngầm, không cản luồng (non-blocking) Request User.

| Mã UC | Tên Tính năng | Ưu Tiên | Chuẩn đầu ra (DoD) |
| :--- | :--- | :--- | :--- |
| **UC-13** | Auto-Cancel Unpaid Orders | Cao (P1) | **BullMQ Delay Job (15p)**. Nếu đơn treo -> Quét -> Hủy -> Nhả Tồn Kho. |
| **UC-15** | Real-time Chat | Vừa (P2) | Socket.io 2 chiều, Kafka gom log tin nhắn bulk insert vào MongoDB/Postgres. |
| **UC-22** | Anti-Fraud (Chống Gian Lận) | Thấp (P3) | Quét ID giả mạo, Limit tốc độ. Chặn Device IP sinh quá nhiều mã OTP. |

---

> [!CAUTION]
> **Quy tắc Phát triển (The Blueprint Law)**
> 1. Xây dựng đúng tuyến tính Phase (P0 -> P1 -> P2 -> P3)
> 2. Các luồng UC có tag `(P0)` là Sinh - Tử (Nút thắt cổ chai kiến trúc), Bắt buộc phải được Implement bằng Redis Lua Script hoặc Event-Driven Queue, hoàn toàn cấm dùng vòng lặp For Database.
