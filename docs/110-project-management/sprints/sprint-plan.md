---
id: IMPL-002
type: agile-plan
status: approved
project: PomeloEC
owner: "@product-manager"
linked-to: [[01-execution-roadmap]]
created: 2026-04-21
updated: 2026-04-21
---

# PomeloEC: Kế Hoạch Sprint Chi Tiết (Sprint Master Plan)

Đóng vai trò **Product Manager**, Sprint Plan này được thiết kế dựa trên nguyên tắc *Outcome over Output* và ưu tiên giải quyết các *bottleneck* kiến trúc sớm nhất (Risk-Driven). Từ tài liệu Roadmap (`01-execution-roadmap.md`), 22 Use Case được chia thành mạch phát triển tuyến tính 7 Sprints. 

**Cấu hình Team giả định:** 1 Tech Lead, 2 Backend, 2 Frontend, 1 QA.
**Độ dài Sprint:** 2 Tuần (10 working days).

---

## 🎯 Giai đoạn Mốc 1: MVP Core Backbone (Tối quan trọng)

Giai đoạn này tập trung hoàn thiện toàn bộ tính năng **P0**. Tiêu chí nghiệm thu là một luồng (Flow) thông suốt từ lúc User Đăng nhập -> Bỏ giỏ -> Trừ kho -> Trả tiền thành công dưới áp lực tải lớn.

### Sprint 1: Nền tảng Định danh & Danh mục (Foundation & Catalog)
**Mục tiêu (Goal):** Người dùng có thể Đăng ký tài khoản, và Admin có quyền định nghĩa chuẩn xác Ma trận Sản phẩm đa biến thể (Size/Độ tuổi/Màu) phức tạp.
- **UC-00A (P0):** Xây dựng Authentication (JWT + Refresh Token Cookie), SSO Google cho Khách hàng.
- **UC-11 (P0):** Thiết lập Data Model cho Danh mục & Sản phẩm, Validate logic chống trùng lặp SKU Variant.

### Sprint 2: Siêu Tốc Độ Tìm Kiếm & Tồn Kho Cơ Sở
**Mục tiêu:** Cắt đứt sự phụ thuộc vào Database khi duyệt web. Khách hàng có thể tìm đồ trong nháy mắt và bỏ vào Giỏ hàng được lưu bằng RAM.
- **UC-01 (P0):** Đồng bộ tự động toàn bộ Product Catalog lên `Elasticsearch`. Viết DSL Query cho thanh tìm kiếm và bộ lọc (Bộ lọc Brand, Giá, Star).
- **UC-04 (P0):** Khởi tạo Inventory Ledger (Sổ phụ kho). Cấp phát số lượng gốc (Base Stock).
- **UC-02 (P0):** Viết logic API Add-to-Cart (Cart Service) đẩy thẳng vào Redis Hash (Không chạm Postgres). Tính Ship cơ bản cực nhanh.

### Sprint 3: Trái Tim Hệ Thống - Giao Dịch & Trừ Kho (The Golden Path)
**Mục tiêu:** Xử lý bài toán sinh tử: 10,000 người mua cùng 1 sản phẩm mà không bị bán âm (Overselling) và tiền nạp vào an toàn tuyệt đối.
- **UC-03_L (P0 - Tối Cao):** Viết `Redis Lua Script` để trừ kho nguyên tử (Atomic Lock) & tạm giữ < 2ms.
- **UC-03_W (P0 - Tối Cao):** Setup Postgres Transaction. Tách đơn hàng lớn thành Sub-order theo từng gian hàng. Bắn Event `OrderCreated` lên Kafka.
- **UC-07 (P0):** Lắng nghe Webhook VNPay. Sử dụng logic Idempotency chống lặp giao dịch & kiểm tra chữ ký HMAC. Dời trạng thái sang `PAYED`.

> [!CAUTION]
> **Điểm Chặn Kỹ Thuật (Risk Gate):** Cuối Sprint 3 BẮT BUỘC phải Load-Test bằng JMeter/K6. Nếu Redis Lua script chạy sai phân vùng hoặc Kafka bị thắt cổ chai, phải sửa ngay lập tức, cấm qua Sprint 4.

---

## 🚀 Giai đoạn Mốc 2: Vận Hành Gian Hàng (Seller Operations)

Giai đoạn đánh vào Nhóm tính năng **P1**. Bất cứ mô hình E-commerce nào cũng không thể chạy nếu Seller không vớt được đơn báo cho Đv Vận Chuyển.

### Sprint 4: Bàn Đạp Bán Hàng (Fulfillment Edge)
**Mục tiêu:** Seller chính thức lên sàn, được xác thực rõ ràng, In được vận đơn và nhận tiền.
- **UC-00B (P1):** Chức năng KYC (Xác minh giấy tờ) + Mở khóa quyền Seller Role.
- **UC-12 (P1):** Push API sang ViettelPost/GHTK lấy mã vạch theo thời gian thực. (Single Fulfillment).
- **UC-08 (P1):** Lắng nghe Webhook của hãng Vận chuyển, chuyển State (`SHIPPED` -> `DELIVERED`).
- **UC-05 (P1):** Logic Khấu trừ phí sàn (X%), dời tiền từ Escrow Wallet qua Available Wallet cho Seller rút.

### Sprint 5: Tự Động Hóa Chống Thất Thoát (Automations)
**Mục tiêu:** Sàn tự dọn dẹp các đơn rác (treo giỏ không thanh toán) trả lại tồn kho, đồng thời nhả Khuyến Mãi cho user.
- **UC-13 (P1):** Sử dụng `BullMQ Delay Worker`, canh đúng 15 phút không trả tiền thì Hủy Đơn -> Rollback phục hồi tồn kho.
- **UC-06 (P1):** Engine Khuyến Mãi (Voucher) có prorating (Bẻ tỷ lệ giảm giá chia đều cho từng món trong giỏ để đối soát khi Refund 1 phần).
- **UC-00C (P1):** Quản lý sổ địa chỉ (Mapping Ward/District/Province chuẩn bộ CSDL Quốc gia).

---

## 🎨 Giai đoạn Mốc 3: Nâng Niu Trải Nghiệm (Enhancements)

Tập trung vào các tính năng đẩy mạnh Doanh Thu (Growth & Retention) - Ưu tiên **P2**.

### Sprint 6: Giữ Chân Người Dùng (Loyalty & FlashSale)
**Mục tiêu:** Kích thích mua lại (Retention) và Xử lý sự cố lỗi hỏng (Tranh chấp).
- **UC-16 (P2):** Hệ thống tích lũy Tiền Xèng (Shopee Xu/Pomelo Coin). Có audit log ghi có/ghi nợ.
- **UC-18 (P2):** Setup Flash Sale Campaigns (CRON job tự Pre-warm cache tải giá Khuyến mãi lên Redis trước khung giờ 0h).
- **UC-10 (P2):** Viết review Text + Upload ảnh Video lên Supabase/S3 Storage. Update điểm sao trung bình Async qua Worker.
- **UC-09 (P2) & UC-14 (P2):** Refund tranh chấp + CRON job dọn dẹp biến đơn Delivered thành Completed khi hết 3 ngày trả hàng.

---

## 🪐 Giai đoạn Mốc 4: Tối Ưu Bằng Máy Cuối (Long tail)

Các tính năng gia tăng **(P3)** có thể dời lại nếu Out of Budget hoặc trễ hạn.

### Sprint 7: Data & Marketing Tooling
**Mục tiêu:** Đấu trực tiếp với Đối thủ cạnh tranh bằng sự mượt mà và cá nhân hóa. Tối ưu vận hành ngầm.
- **UC-17 (P3):** Gợi ý Feed Homepage theo lịch sử (Elastic Recommendation DSL).
- **UC-19 (P2):** Bulk in đơn hàng loạt ra 1 file PDF (Cho Seller bán quá nhiều).
- **UC-20 (P3) & UC-21 (P2):** Affiliate tracking (Đọc Cookie rớt hoa hồng) và Script Đối soát file CSV hàng nghìn dòng rớt từ cước vận chuyển.
- **UC-15 (P2) & UC-22 (P3):** Chat Socket CSKH. Dựng Rate-limit chống Ddos / Tấn công lấy OTP hàng loạt.
