---
id: DIAG-SELLER
type: design
project: PomeloEC
owner: "@system-analyst"
---

# Sequence & Activity - Nhóm 2: Seller

## UC-04: Quản trị Tồn kho & Đăng Sản Phẩm
**Activity Diagram**
```mermaid
flowchart TD
    A[Tạo Mới Sản Phẩm] --> B[Upsert SQL Database] --> C[Đẩy Event Kafka 'ProductUpserted'] --> D[Worker: Sink To ElasticSearch] --> E[Worker: Sync Stock to Redis]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor S as Seller
    participant API as Catalog_Service
    participant DB as Postgres
    participant KF as Kafka Bus
    S->>API: POST /products { data }
    API->>DB: Ghi Catalog SQL
    DB-->>API: 200 OK
    API->>KF: Emit [Product.Created]
    API-->>S: Trả Báo Cáo
```

## UC-05: Rút tiền Ví Payout
**Activity Diagram**
```mermaid
flowchart TD
    A[Yêu Cầu Rút] --> B{Check Số Dư Avaliable}
    B -- Đủ -> C[Lưu DB Lịch Sử Yêu Cầu] --> D[Trừ Tiền Khả Dụng Ví] --> E[Payout Bank Transfer GateWay]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor S as Seller
    participant BE as Kế_Toán_Service
    participant Bank as Bank Payout API
    S->>BE: Xin rút 10.000.000 VNĐ
    BE->>BE: Verify Available > 10M
    BE->>Bank: Chuyển khoản Tự động IBFT
    Bank-->>BE: Success
    BE->>BE: Cập nhật Escrow Transaction (Hoàn tất)
```

## UC-11: Quản Trị Matrix SKUs
**Activity Diagram**
```mermaid
flowchart TD
    A[Nhập Tên Nhóm Thuộc Tính: \nMàu sắc, Kích cỡ] --> B[Khai Báo Tags: \nĐỏ/Đen, S/M]
    B --> C[Backend Tính Tích Đề-các Combinations]
    C --> D[Sinh Ra Ma Trận: \nĐỏ-S, Đỏ-M, Đen-S, Đen-M]
    D --> E[Tự Thiết Lập Giá Trị, Mã Vạch, Khối Lượng Từng Ô]
    E --> F[Upsert Variant List JSON sang SQL Store]
```

## UC-12: Xử Lý Đóng Gói (Fulfillment)
**Activity Diagram**
```mermaid
flowchart TD
    A[Nhấn Đóng Gói Đơn A] --> B[Gọi API Đối tác GHTK] --> C{API Có Lỗi 500?}
    C -- Có --> D[Backoff Retry (10s, 30s)]
    C -- Không --> E[Nhận Tracking Code] --> F[Sinh file PDF Base64] --> G[Trả Lại Web]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor S as Seller
    participant BE as Fulfillment_API
    participant GHTK as GHN/GHTK Base
    S->>BE: Chuẩn bị Hàng (Order X)
    BE->>GHTK: POST /orders
    GHTK-->>BE: 200 OK + Mã Vận Đơn ABC
    BE->>BE: Lưu Tracking Code
    BE-->>S: Cho phép In Vận Đơn PDF
```

## UC-18: Thiết Lập Promotions (Sốc Giá)
**Activity Diagram**
```mermaid
flowchart TD
    A[Tạo Khuyến Mại \n(Ex: 8h tối)] --> B[Ghi DB \nStatus PENDING] --> C(Đợi Đến 7h45) --> D[Pre-warming Job chạy: \nĐẩy Cấu Hình Vào Redis] --> E(Đến 8h) --> F[Mở Bán Cache Giá Mới ở Redis]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    participant S as Seller
    participant API as Promo_API
    participant Q as Redis Schedule Queue
    S->>API: Set FlashSale SP_A giá 1k (Lúc 8PM)
    API->>API: Save DB status = PENDING
    API->>Q: Đặt Báo Thức 7:45 PM
    Q->>Q: Ringing (Đến giờ)
    Q->>API: Load Mọi Promo -> Cache Redis. Set Flag = OPEN
```

## UC-19: In Vận Đơn Hàng Loạt (Bulk)
**Activity Diagram**
```mermaid
flowchart TD
    A[Chọn 500 Đơn] --> B[Bấm In Hàng Loạt] --> C[Trả về 202 Accepted Cấp Tốc] --> D[Job Worker quét lệnh & Gọi Tải Từng Tracking PDF GHTK] --> E[Render Merge Nối Dây 500 PDF] --> F[Đẩy 1 file Tổng Khổng Lồ S3] --> G[Bắn Socket 1 Cục Báo Tải Xuống Hoàn Tất]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor S as Seller
    participant Web as Web_Controller
    participant W as PDF_Worker
    participant S3 as S3 Bucket
    S->>Web: Request 500 Orders Print
    Web-->>S: HTTP 202 (Processing...)
    Web->>W: Push Job "Merge_PDF"
    W->>W: Ghép 500 Tracking Codes
    W->>S3: Upload File
    S3-->>W: URL S3
    W->>S: Bắn WebSocket (Xong! Mời Click Tải)
```
