---
id: TS-SYSTEM-01
type: test-suite
module: Background & System Automation
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[UC-13]], [[UC-15]], [[UC-20]], [[UC-22]]
---

# Bộ Kiểm Thử: Background Jobs & An Toàn Hệ Thống Cốt Lõi

Khảo thí vòng đời của các Công nhân Bóng đêm (Background Workers) và kiểm chứng năng lực Phản ứng Rủi ro (Risk Engine) trước các luồng Gian lận.

## 1. Test Cases: Bộ Máy Hủy Đơn Treo (BullMQ - UC-13)

- **TC-SYS-01 (Happy Path Job Execution):** Tạo mới Order trạng thái `PENDING_PAYMENT`. Cài đặt Fake Timer (Jest) trôi qua 15 phút.
  - *Kỳ vọng:* BullMQ Queue Trigger `cancelUnpaidOrder` Worker. State đơn hàng thành `CANCELED`. Quan trọng nhất: Gọi Redis Lua `refundQuota()` trả tồn kho và trả Voucher Quota về lại hệ thống.
- **TC-SYS-02 (Worker Crash Resilience):** Trong lúc Worker đang chuẩn bị Hủy đơn, giả lập tắt nóng tiến trình Node.js (Power off/Kill -9).
  - *Kỳ vọng:* Do hệ thống dùng Redis/Postgres Transactions, cái Job này sẽ bị gán cờ STALLED (đình trệ). Sau khi bật Server lại, Job phải tự động Resume và xử lý tiếp (At-least-once Delivery).

## 2. Test Cases: Kênh Trò Chuyện (Socket.io - UC-15)

- **TC-SYS-03 (Stateful Connection Scale):** Khởi chạy 2 instances Node.js để test môi trường Microservices/Scaled. User A kết nối Node 1, User B kết nối Node 2.
  - *Kỳ vọng:* Dù không chung tiến trình, Socket.io đi qua Redis Pub/Sub Adapter vẫn phải truyền tin nhắn mượt mà (Không bị kẹt phòng - Sticky Session Fault).
- **TC-SYS-04 (Offline Push Notification):** Gửi tin nhắn đến Cửa hàng đang Offline.
  - *Kỳ vọng:* Hook sang Firebase Cloud Messaging (FCM) gửi thông báo Push Alert.

## 3. Test Cases: Tracking Tự động & Affiliate KOC (UC-20)

- **TC-SYS-05 (Cookie Affiliate Passing):** User click link `?aff_id=KOC999`. 
  - *Kỳ vọng Frontend:* Trình duyệt lưu `document.cookie = "aff_id=KOC999; Max-Age=2592000"`.
  - *Kỳ vọng Backend:* Ngày hôm sau User vào mua đồ (Giỏ hàng không có URL param đó nữa), khi Create Order API vẫn đọc được Cookie từ Header gửi lên -> Cố định hoa hồng cho `KOC999`.
- **TC-SYS-06 (Hoàn tiền KOC khi Hủy Đơn):** Đơn của KOC999 bị khách Hủy.
  - *Kỳ vọng:* Điểm Affiliate Point (Đang ở chế độ PENDING) sẽ tự động bị giáng cấp hoặc Xóa bỏ theo Ledger sổ cái.

## 4. Test Cases: Bức Tường Chống Gian Lận (Risk Engine - UC-22)

- **TC-SYS-07 (Clone Account Hunt):** Gửi 100 HTTP Requests OTP Registration từ duy nhất 1 địa chỉ IP trong vòng 10 phút.
  - *Kỳ vọng:* API Gateway bắn HTTP 429 Too Many Requests sau lượt thứ 5. Tạm khóa IP 24h.
- **TC-SYS-08 (Voucher Fraud):** Thấy IP Address X đăng ký tài khoản 1 phút trước, áp ngay lập tức Voucher "Bạn Mới 100k" kèm trị giá lớn. Chặn Device Fingerprint.
  - *Kỳ vọng:* Gắn Cờ Rủi Ro (Flag: `FRAUD_SUSPECT`). Ngưng luồng Checkout lại và văng lỗi "Tài khoản của bạn chặn ưu đãi để bảo vệ an ninh. Vui lòng LH CSKH". (Không được phép nói ra lý do chính xác - An ninh Zero Trust).
