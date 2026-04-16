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

    %% Relationships
    USER ||--o{ ADDRESS : "has_many"
    USER ||--o| STORE : "owns (If Seller)"
    USER ||--o{ ORDER : "places/buys"

    STORE ||--o{ PRODUCT : "sells"
    PRODUCT ||--|{ VARIANT : "has_variants (SKUs)"

    ORDER ||--|{ ORDER_ITEM : "contains"
    VARIANT ||--o{ ORDER_ITEM : "sold_as"
```

## Giải Thích Chỉ Tên Khóa Ngoại Ràng Buộc (Constraints Explanation)

1. **Khóa liên kết `USER` -> `STORE`:**
   Một User thông thường sẽ không có Store. Quy trình đăng ký KYC (UC-00B) sẽ sinh ra bản ghi `STORE` dựa trên User đó và ép role sang `SELLER`.

2. **Cấu trúc `PRODUCT` vs `VARIANT`:**
   Sản phẩm (Product - VD: Áo Thun) là dữ liệu Abstract (Khung sườn hiển thị). Việc Bán (Tồn kho, Số lượng, SKU, Mã vạch) bắt buộc phải thao tác trên bảng `VARIANT` (Biến thể).

3. **Cấu trúc Vô hướng (Denormalization) của `ORDER_ITEM`:**
   Bảng `ORDER_ITEM` lưu lại toàn bộ ảnh chụp (Snapshot) của sản phẩm trong khoảnh khắc khách đặt mua (`quantity`, `unit_price`). Tuyệt đối không query join ngược lại bảng `VARIANT.price` khi tính tiền hay hiển thị Bill, vì giá sản phẩm trên `VARIANT` sau này có thể bị Shop thay đổi.
