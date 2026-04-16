---
id: TC-E2E-BUYER-01
type: test-case
module: E2E
feature: Mua sắm
priority: P0
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[UC-02]], [[UC-03_W]]
---

# TC-E2E-BUYER-01: Happy Path Mua Hàng Thanh Toán COD

## 1. Mô tả Kịch bản (Scenario)
Kiểm tra luồng Người mua thực hiện mua sắm một sản phẩm từ đầu đến cuối bằng phương thức thanh toán trả tiền sau (Thanh toán khi nhận hàng - COD). Kịch bản bao gồm qua tất cả các trang web và tương tác Backend.

## 2. Tiền điều kiện (Pre-conditions)
1. User (Buyer) đã đăng nhập thành công. Lấy được Access_Token ở Cookie.
2. Browser ở trạng thái Clear Cache.
3. Trong Database / Elasticsearch đã có Product SKU "Sneaker Trắng Cổ Điển" (ID: 100) tồn kho = 10.
4. Môi trường Staging (hoặc Môi trường Tự động hóa Playwright) đang hoạt động.

## 3. Các bước thực hiện (Steps)

| Step | Hành động (Action) | Dữ liệu Đầu vào (Data Type) | Hành vi Backend Mong đợi (Expected Backend Call) |
| :--- | :--- | :--- | :--- |
| **S1** | Mở trang Trang chủ (`home.html`).  | - | API Gateway HTTP 200. Load UI components. |
| **S2** | Click thanh Search, gõ "Sneaker trắng". | Keypress "Sneaker trắng" | API `/catalog/search?q=Sneaker+trắng` gọi vào Elasticsearch. Trả ra list 10 sản phẩm. |
| **S3** | Click vào sản phẩm đầu tiên. | Product ID = 100 | Load trang `pdp.html`. Data trả về HTTP 200. |
| **S4** | Chọn Size 41, Số lượng = 1. Click "Thêm Vào Giỏ Hàng". | Size ID=41, QTY=1 | Cập nhật bộ nhớ `Redis (Cart Hash)`. Trả về Pop-up Success. Cập nhật Icon giỏ hàng = 1. |
| **S5** | Chuyển đến trang `checkout.html`. | Header Cookie | Lấy được giỏ hàng từ Redis. Gắn UC-02 gọi API GHTK để lấy Cước Vận chuyển. |
| **S6** | Màn Thanh Toán: Điền địa chỉ HCM, chọn Phương thức = COD, Click Đặt hàng. | Address="HCM", Payment="COD" | Bắn API sang luồng Order (UC-03_W). Chạm cụm Lock Tồn Kho (UC-03_L). |

## 4. Kết quả mong đợi (Expected Results)
1. **Frontend**: Hiển thị bảng Alert "Cảm ơn bạn đã đặt hàng". Chuyển hướng sang trang chi tiết đơn mua `buyer-orders.html` và hiển thị trạng thái "Chờ Xác Nhận".
2. **Backend Database**:
   - `Orders` table tạo ra 1 Record với trạng thái `PENDING_CONFIRMATION`, sub-total đúng.
   - `Orders_Payment` table có method `COD`.
   - Bảng Tồn kho (Database vật lý) và Redis (Runtime) cho SKU ID=100 giảm xuống còn 9.
3. **Queue**: Kafka phải có message `OrderCreated` với `{ order_id: xxx }` đang chờ để đẩy thông báo qua Firebase Notification.

## 5. Teardown (Dọn dẹp môi trường)
Bắt buộc sau mỗi kịch bản E2E Test tự động Playwright phải thực hiện:
- Khôi phục tồn kho sản phẩm ID=100 lại thành 10 (Direct Update vào Database).
- Cập nhật record Test Order thành trạng thái `DELETED`.
