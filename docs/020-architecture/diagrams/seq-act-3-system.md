---
id: DIAG-SYSTEM
type: design
project: PomeloEC
owner: "@system-analyst"
---

# Sequence & Activity - Nhóm 3: System / Background Jobs

## UC-13: Hủy Đơn Auto & Trả Tồn Kho (15 phút)
**Activity Diagram**
```mermaid
flowchart TD
    A[Tạo Đơn Hàng] --> B[Push Delay Job 15m]
    B --> C(Chờ 15 phút) --> D{Khách đã trả tiền?}
    D -- Có --> E[Bỏ Qua Job]
    D -- Chưa --> F[Mark: CANCELED] --> G[Giải Phóng Redis Lua Kho]
```
**Sequence Diagram**
*(Đã có sẵn tại file `core-sequences.md` gốc)*

## UC-14: Tự động Settlement (2:00 Hàng Ngày)
**Activity Diagram**
```mermaid
flowchart TD
    A[Cron: 2 AM] --> B[Quét Order > 7 Ngày (DELIVERED)]
    B --> C{Có Đang Tranh Chấp?}
    C -- Có --> D[Bỏ Qua Đơn Này]
    C -- Không --> E[Đổi sang COMPLETED] --> F[Tính & Trừ Phí Sàn] --> G[Tiền chảy vào Tạm ứng Seller]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    participant CRON as NestJS Cron
    participant DB as Orders_DB
    participant Escrow as Wallet_DB
    CRON->>DB: UPDATE orders SET status='COMPLETED' WHERE status='DELIVERED' AND delivered_at < NOW-7d
    DB-->>CRON: Rows updated (VD: 50.000)
    CRON->>Escrow: Chuyển Balance(Hoàn tất) thành Available_Balance
```

## UC-20: Affiliate & KOC Tracking
**Activity Diagram**
```mermaid
flowchart TD
    A[Click Affiliate Link] --> B[Lưu HTTPOnly Cookie: aff_id] --> C[Khách Đặt Hàng]
    C --> D[Ghim aff_id vào Order] --> E[Đơn COMPLETED(UC14)] --> F[Chia % Hoa Hồng cho KOC_ID]
```

## UC-21: Auto COD CSV Reconciliation
**Activity Diagram**
```mermaid
flowchart TD
    A[GHTK Gửi CSV 50K dòng] --> B[NodeJs Streams Đọc Từng Dòng]
    B --> C{Max Amount khớp?}
    C -- Khớp --> D[Ghi CSDL: Thanh toán thành công]
    C -- Lệch --> E[Cảnh báo Discrepancy]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    participant VC as GHTK_SFTP
    participant W as Worker (Node Stream)
    participant DB as Payment_DB
    VC->>W: Push COD.csv
    W->>W: Read Stream Line-by-Line
    W->>DB: Bulk Upsert/Verify (1000 records/batch)
    DB-->>W: OK
```

## UC-22: Anti-Fraud Risk Engine
**Activity Diagram**
```mermaid
flowchart TD
    A[Khách Apply Voucher Sale 99K] --> B[Kéo Metadata (IP, GPS, Device Fingerprint)]
    B --> C{Logic Cày Mã?}
    C -- 10 Accounts Chung IP --> D[Mark FRAUD] --> E[Từ chối Order]
    C -- Normal --> F[Cho Phép Mua]
```
