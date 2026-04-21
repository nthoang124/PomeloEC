---
id: DIAG-BUYER
type: design
project: PomeloEC
owner: "@system-analyst"
---

# Sequence & Activity - Nhóm 1: Buyer

## UC-01: Tìm & Xem Chi tiết SP
**Activity Diagram**
```mermaid
flowchart TD
    A[Gõ Từ Khóa] --> B[Gọi API Search] --> C{Cache Redis Còn?}
    C -- Có --> D[Trả Kết quả Cache]
    C -- Không --> E[Query Elasticsearch] --> F[Lưu Cache Redis 5p] --> D
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor U as Buyer
    participant API as Search_API
    participant R as Redis
    participant ES as ElasticSearch
    U->>API: GET /search?q=ao_thun
    API->>R: Lấy Cache "q:ao_thun"
    R-->>API: Miss
    API->>ES: Multi-Match Query
    ES-->>API: Hits
    API->>R: SETEX
    API-->>U: Trả 100 kết quả
```

## UC-02: Thêm Giỏ Hàng & Tính Ship
**Activity Diagram**
```mermaid
flowchart TD
    A[Bấm Thêm Giỏ Hàng] --> B[Lưu Redis Hash: Cart] --> C[Vào trang Checkout] --> D[Gọi API GHN tính khoảng cách] --> E[Trả Phí Ship]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor U as Buyer
    participant Cart as Cart_API
    participant Ship as Logistics_API
    U->>Cart: POST /cart/add (Item A)
    Cart->>Cart: HGETALL -> Update Redis
    U->>Cart: View Checkout
    Cart->>Ship: Request Phí Vận Chuyển (Lat, Long)
    Ship-->>Cart: 35.000 VNĐ
    Cart-->>U: Trả Dữ liệu Checkout
```

## UC-03 & UC-06: Mua Hàng & Áp Mã Giảm Giá
**Activity Diagram**
```mermaid
flowchart TD
    Start((Checkout)) --> GetCart[Lọc Giỏ Hàng & Tính Rule Voucher (UC06)]
    GetCart --> LuaRun[Gọi Lua Script (Khóa Kho + Khóa Lượt Voucher)]
    LuaRun --> CheckRes{Kết quả Lua?}
    CheckRes -- Fail --> Rollback[(Hết Hàng/Hết Code)]
    CheckRes -- OK --> OpenTx[Transaction SQL]
    OpenTx --> GhiDB[Lưu Orders & Items Rate]
    GhiDB --> Commit[Khởi tạo Kafka 'OrderCreated']
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    participant User as Buyer
    participant BE as Order_Service
    participant R as Redis
    participant DB as Postgres
    User->>BE: POST /checkout (Items, Voucher1)
    BE->>R: EVAL Lua_Reserve (Items, Voucher_IDs)
    R-->>BE: 1 (SUCCESS)
    BE->>DB: INSERT INTO orders
    DB-->>BE: Order_ID
    BE-->>User: Trực tiếp trả URL Payment VNPay
```

## UC-07: Webhook Thanh Toán Idempotency
**Activity Diagram**
```mermaid
flowchart TD
    A[Nhận Webhook từ MoMo/VNPay] --> B{Verify Chữ Ký HMAC}
    B -- Lỗi --> C[403 Forbidden]
    B -- Đúng --> D[Kiểm tra transaction_id ở Redis]
    D --> E{Có Chữ DONE?}
    E -- Có --> F[200 OK - Bỏ qua lặp mạng]
    E -- Không --> G[Tính Lũy Đẳng: Set DONE] --> H[Commit DB PAID]
```

## UC-08: Theo dõi Hành trình (Tracking) & Push Notification
**Activity Diagram**
```mermaid
flowchart TD
    A[GHTK Bắn Webhook Shipping Status] --> B[Ghi Database Lịch Trình Đơn Hàng]
    B --> C{Trạng Thái Cập Nhật Gì?}
    C -- Đang Giao/Đã Giao --> D[Push Notification Firebase xuống App Buyer]
    C -- Luân Chuyển Kho --> E[Bỏ qua, không làm phiền Khách hàng]
```

## UC-09: Request HOÀN TIỀN (RMA)
**Activity Diagram**
```mermaid
flowchart TD
    A[Đóng Băng Đơn Hàng] --> B[Tạm Khóa Ví Escrow Seller] --> C[Mở Cổng Chat Dispute]
    C --> D{Admin Giải quyết}
    D -- Buyer Thắng --> E[Refund qua API Payment]
    D -- Seller Thắng --> F[Mở khóa Escrow cho Seller rút tiền]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor U as Buyer
    participant BE as Order_Service
    participant Pay as VNPay_Refund API
    U->>BE: Request Hoàn Tiền (Rách áo)
    BE->>BE: Freeze Order Status
    BE->>Pay: POST /refund (Mã GD)
    Pay-->>BE: Transaction Hoàn Trả (T2)
    BE-->>U: Done
```

## UC-10: Đánh Giá Sản Phẩm (Text/Video)
**Activity Diagram**
```mermaid
flowchart TD
    A[Verify Mua Hàng Thực Tế?] --> B[Xin S3 Pre-Signed URL] --> C[App tải thẳng Video lên S3] --> D[Cập Nhật DB Review] --> E[Worker cập nhật Elastic điểm Rate Trung Bình Mới]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor U as Buyer
    participant BE as Review_Service
    participant S3 as AWS S3 Bucket
    U->>BE: Yêu cầu Up Video 100MB
    BE-->>U: Trả về URL Ký Tạm thời (10p)
    U->>S3: PUT Video (Cross-Origin)
    S3-->>U: 200 OK
    U->>BE: Báo Cáo Payload: [s3://video_link]
    BE->>BE: Lưu Bảng Review
```

## UC-15: Chat WebSocket
**Activity Diagram**
```mermaid
flowchart TD
    A[Nhắn Tin] --> B[Gửi Vào WebSocket Server] --> C{User B Có Online?}
    C -- Có --> D[Bắn Emit Message To User B]
    C -- Không --> E[Kích hoạt FCM Push Notification]
    D --> F[Lưu MongoDB Async]
    E --> F
```

## UC-16: Loyalty Coins
**Activity Diagram**
```mermaid
flowchart TD
    A[Đơn Hoàn Tất COMPLETED] --> B[Tính 1% Điểm Thưởng] --> C[Cộng Coin vào Ví Buyer]
    D[Khách Checkout Cần Xài Coin] --> E{Khảo sát: Đủ Điểm?}
    E -- Đủ --> F[Trừ Điểm Tạm Thời, Trảm Giá Bill]
    F --> G{Đơn bị Hoàn Tiền Canceled/RMA?}
    G -- Có --> H[Trả Lại Coin Cho Khách]
```

## UC-17: Gợi Ý Recommendation
**Activity Diagram**
```mermaid
flowchart TD
    A[Khách Cuộn Trang Xuống Cuối] --> B[Request Tải Thêm Sản Phẩm]
    B --> C[Đánh giá Lịch sử Mua, Click, Thẻ Tags]
    C --> D[Chọc Search Engine Query Vector/KNN]
    D --> E[Lọc Bỏ Các Sản phẩm đã Add_To_Cart]
    E --> F[Trả Khối Product Cards UI]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    participant FE as App
    participant BE as Recommendation_API
    participant ES as Elasticsearch
    FE->>BE: GET /feed?user_id=1
    BE->>ES: Vector Search / Cosine(User_Tags, Doc_Tags)
    ES-->>BE: List UUID
    BE-->>FE: Hiển thị Đề Xuất
```
