---
id: LLD-API
type: specs
status: approved
project: PomeloEC
owner: "@technical-architect"
created: 2026-04-16
updated: 2026-04-16
---

# Thiết Kế Chi Tiết API (API Contracts & Conventions)

Tài liệu này đóng vai trò Hợp Đồng (Contract) giữa Frontend và Backend. Tuân thủ định dạng chuẩn Zero-Trust Security và Error Handling Error Tracking chuẩn ngân hàng.

## 1. Tiêu Chuẩn Phản Hồi (Global Response Format)

Mọi Endpoint (kể cả thành công hay thất bại) **BẮT BUỘC** phải trả về có chứa mã `traceId` để truy xuất Log Elasticsearch Kibana/Pino.

**Thành công (200 OK / 201 Created):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "traceId": "req_a7d8e9f0..."
}
```

**Thất bại (400 / 401 / 403 / 500):**
Tuyệt đối loại bỏ StackTrace ra khỏi môi trường Production.
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_INVENTORY",
    "message": "Sản phẩm hiện tại không đủ số lượng trong kho.",
    "details": ["variant_id: 12345"]
  },
  "traceId": "req_b8e9f0a1..."
}
```

## 2. Danh Mục Endpoint Chuyên Sâu (End-to-End API Specs)

Dựa trên 22 Use Cases cốt lõi, danh sách API được phân mảnh theo Domain để đảm bảo tuân thủ Modular Monolith.

### Nhóm 0: IAM (Identity & Access Management)
| Phương thức | Endpoint | Use Case | Mô tả / Payload | Security |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/sso/google` | UC-00A | Nhận `id_token` từ Google, Upsert tài khoản, trả về JWT Access (Body) & Refresh Token (HttpOnly Cookie). | Public |
| `POST` | `/api/v1/users/kyc/presigned-url` | UC-00B | Cấp quyền upload file CMND/CCCD/GPKD lên AWS S3. | Bearer |
| `POST` | `/api/v1/users/kyc` | UC-00B | Gửi S3 URL đã upload để đăng ký mở gian hàng (Seller). | Bearer |
| `POST` | `/api/v1/users/addresses` | UC-00C | Thêm sổ địa chỉ. Tự động kiểm tra GeoCode qua API GHTK/GHN. | Bearer |

### Nhóm 1: Buyer (Người Mua & Trải Nghiệm)
| Phương thức | Endpoint | Use Case | Mô tả / Payload | Security |
|---|---|---|---|---|
| `GET` | `/api/v1/products/search` | UC-01 | Tìm kiếm Elasticsearch. Params: `q`, `sort`, `limit`. | Public |
| `POST` | `/api/v1/cart/items` | UC-02 | Thêm sản phẩm vào giỏ. Ghi mảng Hash vào Redis `cart:{user_id}`. | Bearer |
| `POST` | `/api/v1/orders/shipping-fee` | UC-02 | Ước tính phí vận chuyển từ địa chỉ Buyer. | Bearer |
| `POST` | `/api/v1/orders/checkout` | UC-03/06 | Gọi Redis Lua Script trừ tồn kho, tính Voucher, sinh URL VNPay. Đòi hỏi `Idempotency-Key` nghiêm ngặt theo HLD. | Bearer |
| `POST` | `/api/v1/orders/{id}/refund` | UC-09 | Mở phiên RMA (Hoàn tiền rủi ro) khi phát sinh sự cố. Lock tiền quỹ Seller. | Bearer |
| `POST` | `/api/v1/products/{id}/reviews` | UC-10 | Gửi đánh giá (Text, Rating). Đính kèm Video/Hình ảnh lên S3 bằng Presigned URL. | Bearer |
| `GET` | `/api/v1/feed` | UC-17 | Recommendation Query. Load sản phẩm theo Lịch sử Click/Mua của User. | Bearer |
| `WS` | `/api/v1/chat` | UC-15 | Channel kết nối Socket.io 2 chiều Buyer - Seller. | Bearer |

### Nhóm 2: Seller (Vận Hành & Sản Xuất)
| Phương thức | Endpoint | Use Case | Mô tả / Payload | Security |
|---|---|---|---|---|
| `POST` | `/api/v1/seller/products` | UC-04/11 | Tạo bảng sản phẩm & SKU Matrix. Phát Kafka Event `ProductUpserted`. | Seller |
| `POST` | `/api/v1/seller/payouts` | UC-05 | Tạo lệnh rút tiền từ Escrow Wallet qua cổng Payout Ngân hàng. | Seller |
| `POST` | `/api/v1/seller/orders/{id}/fulfill` | UC-12 | Xin mã Vận đơn Tracking Code để gửi GHTK. | Seller |
| `POST` | `/api/v1/seller/promotions/flash-sales` | UC-18 | Cấu hình mã Flash Sale. Khởi tạo Schedule Job đẩy cấu hình vào Redis. | Seller |
| `POST` | `/api/v1/seller/orders/bulk-print` | UC-19 | Nối chuỗi file PDF 500 Vận đơn. Trả HTTP 202 (Accepted), chạy tác vụ Push Notification. | Seller |

### Nhóm 3: System & Webhooks (Hệ Thống)
| Phương thức | Endpoint | Use Case | Mô tả / Payload | Security |
|---|---|---|---|---|
| `POST` | `/api/v1/webhooks/payment/vnpay` | UC-07 | Cổng nhận tín hiệu thanh toán. Check chữ ký HMAC. Lua Idempotency check. | HMAC |
| `POST` | `/api/v1/webhooks/logistics/ghtk` | UC-08 | Hứng trigger Shipping Lifecycle. Kích hoạt Push Notification. | Secret |

## 3. Kiến Trúc Bảo Mật API (Security Envelope)

- **Input Validation**: Dùng ValidationPipe của NestJS với DTO class (`class-validator`). Cài setting `whitelist: true, forbidNonWhitelisted: true` để Drop các trường rác từ Client (Mass Assignment).
- **CORS**: Chỉ Allow các Domain Frontend của dự án (Ví dụ: `*.pomelo.vn`, `localhost:3000`). Trừ Endpoint Webhook.
- **Data Masking Log**: Middleware chặng Request/Response sẽ biến `password`, `ssn`, `bank_account` thành `***` trước khi xuất console.
