---
id: TS-CHECKOUT-01
type: test-suite
module: Cart & Checkout
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[UC-02]], [[UC-06]], [[UC-16]], [[UC-18]]
---

# Bộ Kiểm Thử: Shopping Cart & Rule Engine

Bao phủ các hành vi giá trị nhất của hệ thống mua sắm, kiểm tra các lỗ hổng gian lận khi chồng chất Mã Khuyến Mãi (Voucher Stacking) và phân chia tỷ lệ (Prorating).

## 1. Test Cases: Giỏ Hàng (UC-02)

- **TC-CHK-01 (Happy Path):** Add to cart thành công.
  - *Kỳ vọng:* Payload lưu dạng Hash Object vào Redis `cart:{user_id}`, không chạm Database. Thời gian TLL: 7 ngày.
- **TC-CHK-02 (External Contract):** Gọi API GHTK để ước lượng Ship cho giỏ hàng 0.5kg và 5kg.
  - *Kỳ vọng:* Response trả về tiền cước khác nhau.
- **TC-CHK-03 (Third-party Failure):** Tắt Fake API GHTK. Load giỏ hàng.
  - *Kỳ vọng:* Trả Client thông báo "Lỗi từ nhà cung cấp vận chuyển, thử tải lại sau phút chốc" => Không sập sảnh Checkout.

## 2. Test Cases: Động Cơ Chống Thất Thoát Khuyến Mãi (Rule Engine - UC-06 & UC-18)
*Luồng trọng điểm bảo vệ tiền của doanh nghiệp.*

- **TC-CHK-04 (Voucher Quota Lock):** Mã FLASH100 có đúng `2` lượt dùng. Có 3 người áp dụng Voucher cùng lúc vào giao diện Checkout.
  - *Kỳ vọng:* Bằng sức mạnh Redis Lua Lock, chỉ có 2 người bấm thanh toán đầu tiên giữ được mã. Người thứ 3 sẽ văng lỗi HTTP 409 "Voucher đã hết ngân sách".
- **TC-CHK-05 (Prorating Math):** Đơn có 2 sp (Sản phẩm A giá 100k, sản phẩm B giá 200k). Áp voucher giảm 30k.
  - *Kỳ vọng tính toán:* Không được giảm 30k gộp một cục. Bộ máy phải chia tỷ lệ (Prorating) theo giá trị sản phẩm:
    * Giảm SP A = (100k/300k) * 30k = 10k giảm. Giá ròng sp A = 90k.
    * Giảm SP B = (200k/300k) * 30k = 20k giảm. Giá ròng sp B = 180k.
    => Lưu record xuống Table Order_Items chính xác tới từng cent.
- **TC-CHK-06:** Hack dữ liệu đầu vào.
  - *Kỳ vọng:* Gửi Body API Checkout chứa `totalPrice: 1000VND` ghi đè giá hệ thống -> API từ chối, Hệ thống tự lấy Giá DB nhân số lượng + Trừ Voucher.

## 3. Test Cases: Loyalty Point (UC-16)

- **TC-CHK-07 (Double Spend):** Người dùng dùng 500 Pomelo Xu, mở 2 cửa sổ, ấn Thanh toán cùng lúc 2 đơn khác nhau.
  - *Kỳ vọng:* Redis Lua Script khóa luồng. Một cửa sổ chốt hoàn thành đơn trừ hết 500 Xu. Cửa sổ thứ hai bị chặn do không đủ Xu, đơn bị Fail.
