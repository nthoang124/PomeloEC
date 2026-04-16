---
id: TS-SELLER-01
type: test-suite
module: Seller & Order
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[UC-03_W]], [[UC-04]], [[UC-12]], [[UC-19]]
---

# Bộ Kiểm Thử: Order Core & State Machine

Quản lý chuỗi trạng thái của Đơn hàng từ lúc Sinh ra (Write) cho tới lúc Fulfillment hàng chục nghìn đơn từ Seller.

## 1. Test Cases: Cố cốt Đơn hàng (Order Matrix - UC-03_W & UC-08)

- **TC-ORD-01 (DB Transaction):** Order chứa 1 Item hợp lệ, nhưng Insert vào bảng "Order_Payment" bị crash ngẫu nhiên.
  - *Kỳ vọng:* Database rollback toàn bộ transaction. Không có Order nào được sinh ra lẻ tẻ.
- **TC-ORD-02 (State Machine Enforcement):** Đơn hàng đang ở State `DELIVERED`. Bắn API cập nhật State ngược về `PENDING_CONFIRMATION`.
  - *Kỳ vọng:* Backend (Máy trạng thái hữu hạn - Finite State Machine) block lỗi. Một đơn hàng không thể đi ngược thời gian / trạng thái ảo như vậy.
- **TC-ORD-03 (Sub-Orders Splitting):** Đặt lệnh mua 1 Giỏ chứa 3 Áo từ "Shop X" và 2 Giày từ "Shop Y".
  - *Kỳ vọng:* Hệ thống sinh ĐÚNG 1 Parent_Order_ID cho Buyer dễ nhìn tiền tổng, và sinh ĐÚNG 2 Sub_Order_IDs chuyển về Seller_Dashboards của X và Y để vận chuyển độc lập.

## 2. Test Cases: Fulfillment Tập trung (UC-12 & UC-19)

- **TC-ORD-04:** Bấm In Vận Đơn (Single Order).
  - *Kỳ vọng:* Push gọi GHTK API `createOrder`, lấy Tracking Code trả về cho Web App render PDF Barcode.
- **TC-ORD-05 (Bulk Action Resilience):** Seller gom đánh dấu 500 Đơn -> "Xác Nhận & In Mã Vận Đơn".
  - *Kỳ vọng hệ thống:*
    1. HTTP 202 Trả về ngay lập tức để Website không bị đơ 10 phút.
    2. BullMQ Worker Consume mảng 500 ID.
    3. GHTK API Rate limit ở đơn thứ 100 HTTP 429 -> BullMQ Worker Pause ngay lập tức, sử dụng thuật toán *Exponential Backoff* đợi 30s sau kích hoạt xử lý đơn thứ 101. (Không để lọt hư đơn của seller).
    4. Gom thành cụm 500 PDFs nối đít nhau thành 1 file bự, Push Socket báo Web.

## 3. Test Cases: Tồn kho vật lý (UC-04)

- **TC-ORD-06:* Import tồn kho CSV.
  - *Kỳ vọng:* Tăng biến vật lý từ 5 lên 15. Push event Kafka `"InventoryRefreshed"` => Redis lắng nghe update cache. Đảm bảo RAM và DB nhất quán 100%.
