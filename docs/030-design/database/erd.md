---
id: LLD-ERD
type: specs
status: approved
project: PomeloEC
owner: "@technical-architect"
created: 2026-04-17
updated: 2026-04-17
---

# Biểu Đồ Thực Thể Quan Hệ (ERD)

Tài liệu này cung cấp biểu diễn đồ họa của hệ thống cơ sở dữ liệu PostgreSQL cho PomeloEC, được sử dụng để hiểu sự liên kết ngữ nghĩa giữa các nhóm bảng.

```mermaid
erDiagram
    %% IAM & Auth
    USER {
        uuid id PK
        string email UK
        string phone UK
        string password_hash
        enum role "BUYER | SELLER | ADMIN"
        int loyalty_coins
        datetime created_at
    }

    ADDRESS {
        uuid id PK
        uuid user_id FK
        string province
        string district
        string ward
        string full_address
        float lat
        float lng
        boolean is_default
    }

    %% Seller & Catalog
    STORE {
        uuid id PK
        uuid owner_id FK
        string name
        decimal available_balance "Tiền có thể rút"
        decimal escrow_balance "Tiền tạm giữ cọc"
        enum status "PENDING | VERIFIED"
    }

    PRODUCT {
        uuid id PK
        uuid store_id FK
        string name
        decimal base_price
        string description
        string category
    }

    VARIANT {
        uuid id PK
        uuid product_id FK
        string sku UK
        int stock_quantity "Khớp với Redis Lock"
        decimal price
        string attributes "JSON: {color: red, size: L}"
    }

    %% Order & Operations
    ORDER {
        uuid id PK
        uuid buyer_id FK
        enum status "PENDING_PAYMENT | PAID | SHIPPED | DELIVERED"
        decimal total_amount
        string shipping_tracking_code
        string affiliate_id "KOC id"
        int risk_score "Fraud score"
        boolean is_fraud_suspect
        datetime created_at
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid variant_id FK
        int quantity
        decimal unit_price
        decimal discount_applied
    }

    %% Extended Modules
    REVIEW {
        uuid id PK
        uuid user_id FK
        uuid order_item_id FK "UK (1 item -> 1 review)"
        uuid variant_id FK
        int rating_star
        string comment
        string media_urls "JSON Array"
        datetime created_at
    }

    INVENTORY_LEDGER {
        uuid id PK
        uuid variant_id FK
        enum type "IN | OUT | RETURNED"
        int quantity_change
        string reason
        datetime created_at
    }

    VOUCHER {
        uuid id PK
        string code UK
        enum discount_type "PERCENTAGE | FIXED"
        decimal max_discount
        int quota
        datetime expiry_date
    }

    PAYMENT_TRANSACTION {
        uuid id PK
        uuid order_id FK
        string txn_ref UK
        decimal amount
        enum provider "VNPAY | MOMO | COD"
        enum status "PENDING | SUCCESS | FAILED | REFUNDED"
        string gateway_response "JSON Log"
        datetime created_at
    }

    %% Phase 2 Modules
    RETURN_REQUEST {
        uuid id PK
        uuid order_id FK
        string reason
        string media_urls "JSON Array"
        enum status "PENDING | ACCEPTED | REJECTED"
        decimal refund_amount
        datetime created_at
    }

    LOYALTY_LEDGER {
        uuid id PK
        uuid user_id FK
        uuid order_id FK "Nullable"
        decimal amount
        enum type "EARNED | SPENT | REFUNDED"
        datetime created_at
    }

    CHAT_MESSAGE {
        uuid id PK
        uuid sender_id FK
        uuid receiver_id FK
        string content
        string attachment_url
        boolean is_read
        datetime created_at
    }

    ORDER_VOUCHER {
        uuid order_id FK
        uuid voucher_id FK
    }

    PROMOTION_CAMPAIGN {
        uuid id PK
        uuid store_id FK
        string name
        enum status "PENDING | ACTIVE | ENDED"
        datetime start_time
        datetime end_time
    }

    PROMOTION_ITEM {
        uuid campaign_id FK
        uuid variant_id FK
        decimal promo_price
    }

    %% Relationships
    USER ||--o{ ADDRESS : "has_many"
    USER ||--o| STORE : "owns (If Seller)"
    USER ||--o{ ORDER : "places/buys"

    STORE ||--o{ PRODUCT : "sells"
    PRODUCT ||--|{ VARIANT : "has_variants (SKUs)"

    ORDER ||--|{ ORDER_ITEM : "contains"
    VARIANT ||--o{ ORDER_ITEM : "sold_as"

    %% Extended Relationships
    USER ||--o{ REVIEW : "writes"
    ORDER_ITEM ||--o| REVIEW : "can_be_reviewed"
    VARIANT ||--o{ REVIEW : "has_reviews"

    VARIANT ||--o{ INVENTORY_LEDGER : "has_stock_history"
    ORDER ||--o{ PAYMENT_TRANSACTION : "paid_via"

    %% Phase 2 Relationships
    ORDER ||--o| RETURN_REQUEST : "has_RMA"
    USER ||--o{ CHAT_MESSAGE : "sends/receives"
    USER ||--o{ LOYALTY_LEDGER : "has_coin_history"

    ORDER ||--o{ ORDER_VOUCHER : "uses"
    VOUCHER ||--o{ ORDER_VOUCHER : "applied_to"

    STORE ||--o{ PROMOTION_CAMPAIGN : "runs"
    PROMOTION_CAMPAIGN ||--|{ PROMOTION_ITEM : "includes"
    VARIANT ||--o{ PROMOTION_ITEM : "discounted_in"
```

## Giải Thích Chỉ Tên Khóa Ngoại Ràng Buộc (Constraints Explanation)

1. **Khóa liên kết `USER` -> `STORE`:**
   Một User thông thường sẽ không có Store. Quy trình đăng ký KYC (UC-00B) sẽ sinh ra bản ghi `STORE` dựa trên User đó và ép role sang `SELLER`.

2. **Cấu trúc `PRODUCT` vs `VARIANT`:**
   Sản phẩm (Product - VD: Áo Thun) là dữ liệu Abstract (Khung sườn hiển thị). Việc Bán (Tồn kho, Số lượng, SKU, Mã vạch) bắt buộc phải thao tác trên bảng `VARIANT` (Biến thể).

3. **Cấu trúc Vô hướng (Denormalization) của `ORDER_ITEM`:**
   Bảng `ORDER_ITEM` lưu lại toàn bộ ảnh chụp (Snapshot) của sản phẩm trong khoảnh khắc khách đặt mua (`quantity`, `unit_price`). Tuyệt đối không query join ngược lại bảng `VARIANT.price` khi tính tiền hay hiển thị Bill, vì giá sản phẩm trên `VARIANT` sau này có thể bị Shop thay đổi.
