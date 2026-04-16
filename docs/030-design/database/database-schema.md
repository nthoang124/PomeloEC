---
id: LLD-DB
type: specs
status: approved
project: PomeloEC
owner: "@technical-architect"
created: 2026-04-16
updated: 2026-04-16
---

# Thiết Kế Cơ Sở Dữ Liệu LLD (Database Schema & NoSQL Maps)

Dựa trên ERD đã chốt ở Phase `020`, tài liệu này ánh xạ mô hình thực thể xuống thiết kế bảng vật lý (Prisma Schema) và Cấu trúc Key-Value trên Redis. Đảm bảo tuân thủ thiết kế khóa ngoại, Indexing và Partitioning để tải 10,000 TPS.

## 1. PostgreSQL Schema (Lõi ACID)
Tập trung vào tính toàn vẹn dữ liệu. Bảng `orders` và `order_items` sẽ là nút thắt cổ chai, cần đánh index chính xác.

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique @db.VarChar(255)
  phone         String?   @unique @db.VarChar(20)
  password_hash String?   @db.VarChar(255)
  role          UserRole  @default(BUYER)
  loyalty_coins Int       @default(0)
  created_at    DateTime  @default(now())
  
  // Relations
  addresses     Address[]
  orders        Order[]
  store         Store?
}

enum UserRole {
  BUYER
  SELLER
  ADMIN
}

model Store {
  id                String      @id @default(uuid()) @db.Uuid
  owner_id          String      @unique @db.Uuid
  owner             User        @relation(fields: [owner_id], references: [id])
  name              String      @db.VarChar(100)
  available_balance Decimal     @default(0.0) @db.Decimal(15, 2)
  escrow_balance    Decimal     @default(0.0) @db.Decimal(15, 2)
  status            StoreStatus @default(PENDING)
  
  products          Product[]
}

enum StoreStatus {
  PENDING
  VERIFIED
  BANNED
}

model Product {
  id          String   @id @default(uuid()) @db.Uuid
  store_id    String   @db.Uuid
  store       Store    @relation(fields: [store_id], references: [id])
  name        String   @db.VarChar(255)
  base_price  Decimal  @db.Decimal(15, 2)
  
  // Relations
  variants    Variant[]
  
  @@index([store_id])
}

model Variant {
  id             String      @id @default(uuid()) @db.Uuid
  product_id     String      @db.Uuid
  product        Product     @relation(fields: [product_id], references: [id])
  sku            String      @unique @db.VarChar(50)
  stock_quantity Int         @default(0)
  price          Decimal     @db.Decimal(15, 2)
  
  order_items    OrderItem[]
  
  @@index([product_id])
}

model Order {
  id              String      @id @default(uuid()) @db.Uuid
  buyer_id        String      @db.Uuid
  buyer           User        @relation(fields: [buyer_id], references: [id])
  status          OrderStatus @default(PENDING_PAYMENT)
  total_amount    Decimal     @db.Decimal(15, 2)
  created_at      DateTime    @default(now())
  
  items           OrderItem[]
  
  // Partitioning strategy: In native Postgres, index created_at for time-series partitioning
  @@index([buyer_id, created_at])
  @@index([status])
}

enum OrderStatus {
  PENDING_PAYMENT
  PAID
  SHIPPED
  DELIVERED
  COMPLETED
  CANCELED
}

model OrderItem {
  id          String  @id @default(uuid()) @db.Uuid
  order_id    String  @db.Uuid
  order       Order   @relation(fields: [order_id], references: [id])
  variant_id  String  @db.Uuid
  variant     Variant @relation(fields: [variant_id], references: [id])
  quantity    Int
  unit_price  Decimal @db.Decimal(15, 2)
  
  @@index([order_id])
}
```

## 2. Redis Key Structure (RAM Engine cho Flash Sale)
Do SQL quá chậm để Handle Race Condition, đây là danh sách Cấu trúc Data trên bộ nhớ RAM.

| Key Pattern | Cấu trúc Core | Mô tả & TTL |
|---|---|---|
| `inventory:lock:{variant_uuid}` | `String (Int)` | Lưu số lượng hàng đang còn thực tế thời gian thực. Bị trừ/cộng bằng Lua Script. Bền vững. |
| `cart:{user_uuid}` | `Hash` | Lưu giỏ hàng chưa chốt (Key: variant_id, Value: quantity). TTL: 30 ngày. |
| `voucher:{code}:quota` | `String (Int)` | Giới hạn số lượt dùng còn lại của 1 mã (Ví dụ: 100). |
| `transaction:{vnpay_txn_id}` | `String` | Khóa chống trùng lặp Webhook lũy đẳng. Giá trị: `PROCESSING` hoặc `DONE`. TTL: 15 phút. |
| `ratelimit:ip:{ip_address}` | `String (Int)` | Đếm số request để chống DDoS ở cổng Gateway. TTL: 1 phút. |
| `promo:flashsale:{date}` | `Sorted Set (ZSET)` | Lưu danh sách Product ID đang tham gia Sale, score là giá bán. Pre-warm trước 15p. |

## 3. Elasticsearch Mapping (Công cụ Lọc siêu tốc)
Loại bỏ bài toán `LIKE %...%` bằng Index Inverted.

```json
PUT /products-index
{
  "mappings": {
    "properties": {
      "product_id": { "type": "keyword" },
      "name": { 
        "type": "text", 
        "analyzer": "vietnamese", 
        "fields": { "keyword": { "type": "keyword" } }
      },
      "category_name": { "type": "keyword" },
      "price": { "type": "double" },
      "avg_rating": { "type": "float" },
      "total_sold": { "type": "integer" }
    }
  }
}
```
