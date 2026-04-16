---
id: DIAG-IAM
type: design
project: PomeloEC
owner: "@system-analyst"
---

# Sequence & Activity - Nhóm 0: IAM

## UC-00A: Đăng nhập/Đăng ký SSO
**Activity Diagram**
```mermaid
flowchart TD
    A[Bấm Đăng Nhập SSO] --> B{Đã từng Đăng ký?}
    B -- Chưa --> C[Tạo mới User Postgres] --> D[Tạo Access/Refresh Token]
    B -- Có --> D
    D --> E[Lưu Refresh Cookie] --> F[Trả AccessToken lên App]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor U as Buyer
    participant API as IAM_Gateway
    participant DB as Postgres
    U->>API: Gửi SSO Token (Google)
    API->>API: Verify Google Token
    API->>DB: Upsert User (Email/SSO_ID)
    DB-->>API: Trả ID User
    API->>U: Trả HttpOnly Cookie (Refresh_Token) + JWT (Access)
```

## UC-00B: Đăng ký KYC Gian Hàng
**Activity Diagram**
```mermaid
flowchart TD
    A[Upload CMND] --> B[Ghi DB `status: PENDING`] --> C[Admin Nhận Cảnh Báo]
    C --> D{Admin Duyệt?}
    D -- Từ Chối --> E[Gửi Email Cảnh Báo]
    D -- Chấp Nhận --> F[Update Role: SELLER] --> G[Kích hoạt Cửa Hàng]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor U as Seller
    participant API as IAM_Gateway
    participant Admin as Admin Portal
    U->>API: Upload File KWYC (Presigned S3)
    API->>API: Nhận S3 URL, Lưu `PENDING` Store
    Admin->>API: Xem KYC
    Admin->>API: Approve
    API->>API: Edit Role -> SELLER
    API-->>U: Push Notification: "Chúc mừng lên Gian hàng"
```

## UC-00C: Quản lý Sổ Địa Chỉ
**Activity Diagram**
```mermaid
flowchart TD
    A[Nhập Tỉnh/Thành/Quận/Huyện] --> B{Phân cực GHN / ViettelPost?}
    B -- Valid --> C[Lưu Lat/Long (Nếu có GPS)] --> D[Thêm Address DB]
    B -- Invalid --> E[Báo lỗi địa chỉ]
```
**Sequence Diagram**
```mermaid
sequenceDiagram
    actor U as Buyer
    participant API as User_Service
    participant Map as GHN/VNPOST Database
    U->>API: Chọn Tỉnh: Thành Phố HCM, Quận 1
    API->>Map: Validate GeoCode
    Map-->>API: OK (Code: 10000)
    API->>API: Insert Address
    API-->>U: Thành Công
```
