---
id: UIUX-BUYER
type: specs
status: approved
project: PomeloEC
owner: "@ui-ux-designer"
created: 2026-04-17
updated: 2026-04-17
---

# LLD Tương Tác: Buyer Journey (Trải Nghiệm Người Mua)

Tài liệu này đặc tả luồng tương tác của khách hàng từ lúc vào trang chủ cho đến lúc chốt đơn hàng, tuân theo kiến trúc Apple Glassmorphism & Neo-brutalism.

## 1. Flow Điều Hướng (Navigation Flow)

```mermaid
graph TD
    A[Trang Chủ (Home)] -->|Bento Grids| B(Danh sách Sản phẩm)
    A -->|Tìm theo Từ Khóa| C(Trang Kết Quả Tìm Kiếm)
    B --> D[Trang Chi Tiết (PDP)]
    C --> D
    
    D -->|Hover Tương tác| E[Glass Card Micro-Animation]
    D -->|Ấn Thêm Giỏ Hàng| F[Drawer Slid-In Mở Từ Phải]
    
    F -->|Đóng Drawer| D
    F -->|Thanh Toán Ngay| G[One-Page Checkout]
    
    G --> H{Xác nhận Địa chỉ}
    H -->|Gọi ViettelPost API| I((Tải Dynamic Ship Fee))
    I --> J[Cổng thanh toán VNPay]
```

## 2. Wireframe Chi Tiết (Screen Configurations)

### 2.1 Trang Chủ (The Home Discovery)
- **Concept:** Loại bỏ các slide tĩnh truyền thống.
- **Bento Grid Layout:** 
  - Khối chính (Grid `col-span-2 row-span-2`): Banner Flash Sale nổi bật. Nằm ở trung tâm.
  - Các khối vệ tinh (Grid `col-span-1`): Các hộp Categories, Mini-Voucher lấp lánh (Emerald Green).
  - Nền mờ kính (Backdrop Blur 24px) giúp làm nổi bật sản phẩm.

### 2.2 Trang Chi Tiết Sản Phẩm (PDP - Product Detail Page)
Được tối ưu cho Mobile-First. 
- **Media Gallery:** Ảnh vuốt tay thay vì click thumbnail nhỏ. 
- **Purchase Ribbon (Cạnh dưới cùng cố định):**
  - Cấu trúc: [Giá Tiền To] + [Nút Mua Ngay Vàng Haptic]
  - Nút Mua thay đổi State: 
    - Màu xanh: Còn hàng.
    - Xám (Opacity 0.5): Hết hàng (Nội dung đổi thành: "Nhận thông báo khi Cửa hàng Nhập mới").

### 2.3 Checkout Drawer (Menu trượt Giỏ Hàng)
Thay vì load 1 trang `cart.html` truyền thống, việc mở Giỏ Hàng chỉ là 1 overlay trượt từ mép phải màn hình để giữ khách hàng nằm trong mạch xem sản phẩm.

- **Empty State (Trạng Thái Trống):**
  Hiển thị ảnh 3D Box Neo-brutalism (được render bởi AI). Kèm dòng chữ "Bạn chưa chọn gì cả, hãy lấp đầy nó!". 
- **Filled State:**
  - Danh sách Item: dạng row hẹp để nhồi được nhiều diện tích. 
  - Sub-total & Vouchers: Gộp dưới chân Drawer.

## 3. SEO & DOM Semantic Specs

- **Thẻ `<main>`:** Chỉ dùng duy nhất 1 thẻ này để bọc nội dung Product.
- **Heading 1 `<H1>`:** Bắt buộc là "Tên Sản Phẩm".
- **Structured Data (JSON-LD):** Được tiêm vào thẻ `<head>` để Google bot đọc giá và lượng Ratings trước khi hiển thị SEO.
