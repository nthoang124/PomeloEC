---
id: LLD-ARCH
type: specs
status: approved
project: PomeloEC
owner: "@solution-architect, @technical-architect"
created: 2026-04-17
updated: 2026-04-17
---

# Modular Monolith & Mẫu Thiết Kế Mức Thấp (Architecture Patterns)

Tài liệu này xác định cách thức tổ chức mã nguồn, chia tách các module và các mẫu thiết kế (Design Patterns) áp dụng cho hệ thống lõi **PomeloEC** dựa trên kiến trúc Modular Monolith.

## 1. Mẫu Kiến Trúc Dữ Liệu (Data Architecture Patterns)

Để đạt được mục tiêu 10,000 TPS, PomeloEC áp dụng 3 mẫu kiến trúc chính:

1. **CQRS (Command Query Responsibility Segregation) Trọng Lượng Nhẹ**
   - **Command (Ghi):** Luồng tạo đơn hàng, thanh toán sẽ đi trực tiếp qua API -> PostgreSQL.
   - **Query (Đọc):** Các thao tác xem Catalog, Lọc danh mục, Lấy thông tin sản phẩm sẽ được định tuyến sang Elasticsearch hoặc Redis, giảm tối đa tải trên DB chính.

2. **Transactional Outbox Pattern (Ngăn rớt sự kiện)**
   - **Vấn đề:** Khi tạo Đơn hàng vào DB xong nhưng tiến trình gửi message qua Kafka bị sập, dẫn đến thiếu nhất quán.
   - **Giải pháp:** Ghi `Order` và ghi một record vào bảng `Outbox` chung một giao dịch (ACID Transaction) PostgreSQL. Một Worker ngầm (`Kafka Connect` hoặc `CDC Debezium`) sẽ quét bảng `Outbox` để đưa message lên Kafka.

3. **Strangler Pattern (Tương lai mở rộng)**
   - Hệ thống được code toàn bộ trong 1 repo Monolith, nhưng giới hạn chặt chẽ sự phụ thuộc chéo. Khi module `Orders` bị quá tải và cần mở rộng, chúng ta có thể dễ dàng tách thư mục `orders/` thành 1 Microservice riêng biệt (Strangler Fig).

## 2. Ranh Giới Giao Tiếp Nền Tảng (Cross-Module Communication)

Các Module trong PomeloEC **nghiêm cấm** việc "require" chéo Services của nhau.

- **Đồng bộ (Synchronous):** Nếu Module A cần data từ Module B, Module B phải cung cấp một `Facade/Interface` nội bộ hoặc gọi qua một `gRPC/TCP` layer nội bộ.
- **Bất đồng bộ (Asynchronous):** Mọi sự kiện lớn ảnh hưởng tới các quy trình chéo sẽ sử dụng **Domain Events** thông qua event bus nội bộ hoặc Kafka. 

> [!WARNING]
> Ví dụ Code cấm lạm dụng: Module `Payment` tuyệt đối KHÔNG được Inject `OrderService` và cập nhật trực tiếp `order.status = 'PAID'`. 
> Phương pháp đúng: Module `Payment` gửi sự kiện `"PaymentConfirmed"` -> Module `Order` hứng sự kiện và tự cập nhật trạng thái của chính nó.

## 3. Cấu Trúc Mã Nguồn Tiêu Chuẩn (Hexagonal/Clean Architecture Layout)

Mọi Bounded Context (Module) đều tuân thủ nguyên tắc Clean Architecture. 

```text
src/
├── api-gateway/            # Cổng chuyển tiếp và giới hạn yêu cầu, rate-limiting
└── modules/
    ├── identity/           # Bounded Context 1: Users, Auth, KYC
    ├── catalog/            # Bounded Context 2: Products, SKU, Brands
    ├── inventory/          # Bounded Context 3: Stock Lua Scripts
    ├── checkout/           # Bounded Context 4: Carts, Pricing, Vouchers
    ├── orders/             # Bounded Context 5: Order State Machine, Logistics
    └── payments/           # Bounded Context 6: VNPAY, Escrow Ledger
```

Bên trong 1 Module luôn giữ cấu trúc Hexagonal:

```text
modules/orders/
├── core/                   # Tầng Domain (Luật kinh doanh)
│   ├── entities/           # Class Order, Value Objects
│   └── exceptions/         # BusinessException (Không mang thư viện ngoài)
├── application/            # Tầng Sử Dụng (Use Cases)
│   ├── use-cases/          # CreateOrderUseCase, CancelOrderUseCase
│   └── ports/              # interfaces: IOrderRepository, IMessageBroker
└── infrastructure/         # Tầng Hạ Tầng (Framework, CSDL)
    ├── controllers/        # HTTP REST (Fastify/NestJS)
    ├── databases/          # Prisma Repositories implementation
    └── messaging/          # Kafka Producers/Consumers
```

## 4. Design Patterns Ứng Dụng Trong Code

| Khái niệm nghiệp vụ | Mẫu thiết kế (Design Pattern) | Mô tả |
|---|---|---|
| **Luật Tính Giá Voucher** | `Strategy Pattern` | Mỗi loại Voucher (Freeship, % Giảm, Giảm thẳng) triển khai 1 Strategy riêng biệt. |
| **Bắn Sự Kiện** | `Observer Pattern` / `PubSub` | Order Module là Publisher, Logistics/Notification/Payment là Subscribers. |
| **Logic Checkout** | `Facade Pattern` | Lớp CheckoutUseCase bọc lại quá trình gọi Cart, gọi Inventory, gọi Payment. |
| **Tạo SKU Matrix** | `Builder Pattern` | Xây dựng động các biến thể (Đỏ-M, Đỏ-L) dựa vào Cartesian product. |
| **Chống Race Condition** | `Pessimistic Lock (Lua)` | Sử dụng Redis Lua Scripts thay vì SQL Locks để phân giải xung đột mua hàng. |
