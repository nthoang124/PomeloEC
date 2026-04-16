---
id: LLD-SEQ
type: specs
status: approved
project: PomeloEC
owner: "@technical-architect"
created: 2026-04-17
updated: 2026-04-17
---

# LLD Biểu Đồ Trình Tự Lõi (Core Sequences)

Tài liệu này xác định các quy trình sống còn của nền tảng (Critical Paths) thông qua các Biểu đồ tuần tự (Sequence Diagrams), đảm bảo kỹ sư lập trình hiểu rõ luồng xử lý và chống bế tắc/race-condition.

## 1. UC-03: Luồng Checkout & Khóa Tồn Kho Bằng Redis (Flash Sale)

Quy trình này mô tả việc một người dùng gửi yêu cầu Checkout. Mục tiêu tối thượng của hệ thống là không được phép gọi CSDL PostgreSQL để kiểm tra tồn kho (Nút thắt cổ chai), mà phải xử lý nguyên tử qua Redis Lua Script.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer
    participant Frontend
    participant API_Gateway
    participant Checkout_Service
    participant Redis_LUA
    participant Postgres_DB
    participant Kafka_Bus

    Buyer->>Frontend: Bấm "Thanh toán" (Submit Cart)
    Frontend->>API_Gateway: POST /api/v1/orders/checkout (Payload, Idempotency-Key)
    API_Gateway->>API_Gateway: Rate Limiting & Auth Check
    API_Gateway->>Checkout_Service: Xử lý Đơn hàng
    
    activate Checkout_Service
    Checkout_Service->>Redis_LUA: Gọi EVAL SCRIPT [Khóa Tồn Kho + Trừ Voucher]
    Note right of Redis_LUA: Script chạy Atomic: Kiểm tra SL Tồn -> Nếu đủ -> Trừ SL -> Trả về OK. Nếu thiếu -> Trả về Lỗi.
    
    alt Redis trả về Thất bại (Code -1)
        Redis_LUA-->>Checkout_Service: Lỗi "Hết hàng hoặc Voucher quá tải"
        Checkout_Service-->>API_Gateway: 400 Bad Request
        API_Gateway-->>Frontend: Báo lỗi hết SKU
    else Redis trả về Thành công (Code 1)
        Redis_LUA-->>Checkout_Service: Đã trừ khóa trên RAM thành công
        
        Checkout_Service->>Postgres_DB: Mở ACID Transaction
        Checkout_Service->>Postgres_DB: INSERT Order (PENDING_PAYMENT)
        Checkout_Service->>Postgres_DB: INSERT Order_Items
        Checkout_Service->>Postgres_DB: Commit Transaction
        
        Checkout_Service->>Kafka_Bus: Publish Event "Order.Created"
        Checkout_Service-->>API_Gateway: 201 Created (Tạo đơn thành công + Link VNPay)
        API_Gateway-->>Frontend: Điều hướng sang cổng VNPay
    end
    deactivate Checkout_Service
```

## 2. UC-07: Xử Lý Webhook Lũy Đẳng (Idempotency Payment)

Do bản chất mạng lưới, Webhook của VNPay/MoMo có thể bắn về 2 lần cho cùng một giao dịch. Hệ thống bắt buộc phải chặn lại ở tầng Gate để tránh việc nhân đôi tiền, trạng thái sai lệch.

```mermaid
sequenceDiagram
    autonumber
    participant Payment_Gateway as VNPay / MoMo
    participant API_Webhook
    participant Redis_Cache
    participant Payment_Service
    participant Postgres_DB
    participant Kafka_Bus

    Payment_Gateway->>API_Webhook: POST /api/v1/webhooks/payment (Txn_ID, Sign)
    
    API_Webhook->>API_Webhook: Kiểm tra Chữ ký bảo mật (HMAC)
    
    API_Webhook->>Redis_Cache: SETNX transaction:{Txn_ID} "PROCESSING" EX 300
    Note right of Redis_Cache: Nếu Key đã tồn tại -> Trả về 0 -> Nghĩa là Webhook trùng.
    
    alt Redis trả về 0 (Key Tồn Tại)
        Redis_Cache-->>API_Webhook: Giao dịch đang/đã được xử lý
        API_Webhook-->>Payment_Gateway: 200 OK (Báo nhận rồi để VNPay ngừng bắn)
    else Redis trả về 1 (Giao dịch mới)
        Redis_Cache-->>API_Webhook: Đã Set Lock Khóa
        API_Webhook->>Payment_Service: Cập nhật Trạng Thái Đơn Hàng
        
        activate Payment_Service
        Payment_Service->>Postgres_DB: UPDATE Order SET status = 'PAID'
        Payment_Service->>Postgres_DB: Ghi log giao dịch (Ledger)
        Payment_Service->>Kafka_Bus: Publish Event "Payment.Confirmed"
        Payment_Service-->>API_Webhook: Xử lý thành công
        deactivate Payment_Service
        
        API_Webhook->>Redis_Cache: SET transaction:{Txn_ID} "DONE" TTL (7 days)
        API_Webhook-->>Payment_Gateway: 200 OK
    end
```

## 3. UC-13 & UC-14: Vòng Đời Tự Động Hóa (Auto-Cancel/Auto-Complete)

Trình tự thể hiện hệ thống Worker nền (BullMQ) quản lý các Task bị Delay (Hẹn giờ) cho các nghiệp vụ mà User không can thiệp.

```mermaid
sequenceDiagram
    autonumber
    participant Order_Service
    participant BullMQ_Delay
    participant Worker_Daemon
    participant Inventory_Service
    participant Escrow_Service
    participant Postgres_DB

    Note left of Order_Service: UC-13: Khách tạo Đơn (Chưa trả)
    Order_Service->>BullMQ_Delay: Push Job "CancelOrder" (Delay 15 phút)
    
    loop Đợi 15 Phút
        BullMQ_Delay->>BullMQ_Delay: ...
    end
    
    BullMQ_Delay->>Worker_Daemon: Kích hoạt Job "CancelOrder"
    Worker_Daemon->>Postgres_DB: Kiểm tra DB xem Đơn đã PAID chưa?
    
    alt Đơn vẫn là PENDING_PAYMENT
        Worker_Daemon->>Postgres_DB: UPDATE status = 'CANCELED'
        Worker_Daemon->>Inventory_Service: Emit "Order.Canceled"
        Inventory_Service->>Inventory_Service: Rollback Refund Tồn Kho (Lệnh Cộng lại vô Redis & DB)
    end
    
    Note left of Postgres_DB: UC-14: Đơn đã giao xong 7 ngày (DELIVERED)
    Worker_Daemon->>Postgres_DB: Cronjob 02:00 AM quét DB (status = DELIVERED, updated_at < 7 ngày)
    Worker_Daemon->>Postgres_DB: UPDATE status = 'COMPLETED'
    Worker_Daemon->>Escrow_Service: Kích hoạt giải ngân
    Escrow_Service->>Postgres_DB: Tính Phí Sàn (Ủy thác) - Cộng Tiền vào Available_Balance (Seller)
```
