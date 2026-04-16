---
id: TS-IAM-01
type: test-suite
module: IAM
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[UC-00A]], [[UC-00B]], [[UC-00C]]
---

# Bộ Kiểm Thử (Test Suite): IAM Module

Bộ test này chuyên biệt cho quy trình quản trị người dùng, xác thực (Authentication), phân quyền (Authorization) và KYC.

## 1. Test Cases: Đăng ký & Đăng nhập (UC-00A)
*Dựa trên luồng Authentication Sequence Diagram*

- **TC-IAM-01 (Happy Path):** Đăng nhập bằng Google SSO hợp lệ.
  - *Kỳ vọng:* Trả về Access_Token (JWT, TTL 15m), Set-Cookie `refresh_token` (HTTPOnly, Secure, TTL 7d).
- **TC-IAM-02 (Security/Edge):** Tấn công Brute Force Password.
  - *Kỳ vọng:* Sau 5 lần nhập sai, trả về HTTP 429 Too Many Requests và Lock IP tạm thời thông qua Redis Rate Limiter.
- **TC-IAM-03 (Security):** Tấn công giả mạo JWT.
  - *Kỳ vọng:* Gửi request với JWT đã hết hạn hoặc sửa đổi chuỗi Signature. Server phải trả về HTTP 401 Unauthorized, chặn không cho đi qua API Gateway.
- **TC-IAM-04:** Dùng Refresh Token để lấy Access Token mới.
  - *Kỳ vọng:* Gửi request chứa Cookie hợp lệ. Token mới được phát hành, token cũ trong Redis Rotation List bị vô hiệu hóa.

## 2. Test Cases: KYC Người bán (UC-00B)

- **TC-IAM-05 (Happy Path):** Upload file CMND hợp lệ (< 5MB, .jpg).
  - *Kỳ vọng:* File lưu thành công vào S3 Bucket, Record KYC chuyển sang `PENDING_REVIEW`.
- **TC-IAM-06 (Edge):** Upload file Shell Script độc hại hoặc file MP4 khổng lồ (1GB).
  - *Kỳ vọng:* API Gateway/Multer chặn 100% dựa trên Mime-Type và Max-size (HTTP 413 Payload Too Large / 415 Unsupported Media Type).
- **TC-IAM-07:** Thẩm định vai trò truy cập (RBAC).
  - *Kỳ vọng:* Dùng User có KYC thất bại gọi vào API `POST /seller/products`. Hệ thống phải trả về HTTP 403 Forbidden, `RequireRole(SELLER)`.

## 3. Test Cases: Bộ địa chỉ giao hàng (UC-00C)

- **TC-IAM-08:** Tạo mới địa chỉ với Tỉnh/Thành/Quận/Huyện bị lệch chuẩn việt nam.
  - *Kỳ vọng:* Hệ thống Validation (Zod/Pydantic) báo HTTP 400 Bad Request, bắt buộc Map ID từ JSON Tree của GHTK.
