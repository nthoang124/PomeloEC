---
id: TS-PAYMENT-01
type: test-suite
module: Payment
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[UC-05]], [[UC-07]], [[UC-09]], [[UC-14]], [[UC-21]]
---

# Bộ Kiểm Thử: Thanh Toán & Tạm Giữ Escrow

Nơi dòng tiền chảy. Tiêu chuẩn Test của module này vượt trên mức bình thường, cấm sai sót dù chỉ 1 đồng. Điển hình là Chống Lũy Đẳng (Idempotency) của rủi ro gọi Webhook trùng lặp.

## 1. Test Cases: Webhook Thanh toán VNPay/MoMo (UC-07)

- **TC-PAY-01 (Happy Path Webhook):** Cổng VNPay gọi Post Webhook trạng thái SUCCESS, dán mã chữ ký HMAC hợp lệ.
  - *Kỳ vọng:* Hệ thống update Order -> PAID. Sinh biến lai giao dịch (Ledger) ở DB.
- **TC-PAY-02 (Anti-Idempotency - Tuyệt mật):** Do lỗi mạng nên VNPay gọi POST Webhook gửi báo cáo TRẢ TIỀN THÀNH CÔNG cho Đơn `#123` liên tiếp 5 lần trong 1 giây.
  - *Kỳ vọng:* Server lưu mã Transaction_ID trên Redis (SetNX). Chỉ Request ĐẦU TIÊN lọt vào. 4 Request còn lại bị Drop và trả VNPay HTTP 200 OK ngay lập tức. Tiền User KHÔNG BỊ CỘNG/TRỪ 5 LẦN.
- **TC-PAY-03 (An Ninh - Man in The Middle):** Chỉnh sửa POST Webhook Amount từ 30,000 xuống thành 10,000 và thay đổi Hash.
  - *Kỳ vọng:* Tự động Verify Signature thất bại, throw Error `Invalid Webhook Signature`.

## 2. Test Cases: Escrow và Rút Tiền (UC-05, UC-14)

- **TC-PAY-04 (Auto Settle):** Chạy Cronjob 02:00 giả lập bằng Test Timer (Cron), quét tới các đơn Delivered 8 ngày trước.
  - *Kỳ vọng:* Đơn Order đổi state thành COMPLETED. Logic Kế toán trừ 2% Phí Chuyển Đổi + Tiền Ship. Tiền còn lại gán vô Cột `available_balance` của ví Seller.
- **TC-PAY-05:** Cố tình rút số tiền LỚN HƠN Số dư Khả Dụng (Ví dụ có 100k nhưng Rút 1 triệu).
  - *Kỳ vọng:* API quăng HTTP 400 Insufficient Funds, Check rào chắn kỹ thuật không bỏ qua bước này.

## 3. Test Cases: Refund (UC-09)

- **TC-PAY-06:** Mở Dispute cho Đơn hàng chưa hết thời gian bảo vệ.
  - *Kỳ vọng:* State Đơn hàng = `DISPUTE_OPENED`. Tiền bị ngưng đọng lại (Freeze Hold Amount = Giá Trị Đơn).
- **TC-PAY-07:** Admin phê duyệt Refund The Buyer.
  - *Kỳ vọng:* Trừ giá trị Hold, Gọi API VNPay / CreditCard Refund Command để trả lại gốc của luồng Tiền. Record vào sổ Tự Động Kế toán âm (Debit).

## 4. Test Cases: Auto COD (UC-21)

- **TC-PAY-08 (Stream Data Test):** Ép Node.js File Stream đọc File CSV dung lượng 10GB chứa mã vận đơn thu hộ cực lớn. Đảm bảo RAM process không được vượt quá độ dài chuẩn mực (Không Out of Memory OOM).
  - *Kỳ vọng:* RAM Node.js giữ ổn định ~200MB. Các Record được update chunk by chunk.
