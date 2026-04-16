---
id: UIUX-SELLER
type: specs
status: approved
project: PomeloEC
owner: "@ui-ux-designer"
created: 2026-04-17
updated: 2026-04-17
---

# LLD Tương Tác: Seller & Admin Control Panel

Khác với Buyer cần trải nghiệm mua sắm mượt mà, Nhà Bán (Seller) và Quản Trị Viên (Admin) được thiết kế tập trung hoàn toàn vào khả năng xử lý Khối lượng Dữ Liệu lớn (Data-heavy interactions) thông qua Layout Tối (Dark SaaS Layout).

## 1. Flow Quản Trị Seller (Seller Flows)

```mermaid
graph TD
    A[Truy cập Seller Center] --> B{Chứng thực Auth}
    B -->|Thất bại| C[Login SSO / SMS OTP]
    B -->|Pass KYC| D[Trang Tổng Quan Dashboard]
    
    D --> E[Trình quản lý Sản Phẩm (Matrix SKU)]
    E -->|Upload hàng loạt| E1{Kiểm tra File CSV}
    
    D --> F[Trình quản lý Kho Hàng (Inventory)]
    
    D --> G[Lệnh Vận Đơn (Fulfillment)]
    G -->|Tích chọn 500 Đơn| G1[Tiến trình Nền Đẩy In]
    G1 --> G2(Tải file PDF Vận đơn)
    
    D --> H[Kế Toán & Đối Soát (Escrow Ledger)]
    H -->|Rút tiền| H1((Payout Gateway))
```

## 2. Wireframe Chi Tiết: Bảng Điều Khiển (Dashboard)

### 2.1 Dashboard KPI Section (Glass/Neon Widgets)
Vùng trên cùng bao gồm 4 khối Widget được mạ viền Neon (Led glow effect).
- **Tổng Doanh Thu Khả Dụng (Available Balance):** Số in to đậm màu Vàng Gold (`#FBBF24`). Nút "Rút Tiền" nằm cạnh nhỏ gọn.
- **Doanh Thu Đang Chờ (Escrow / Pending Hold):** Tông màu xám nhạt (`#94A3B8`).  
- **Đơn Hàng Cần Xử Lý:** Màu Xanh Ngọc (Emerald) kèm nhịp đập Pulse báo hiệu tình trạng cần đóng gói trong ngày.
- **Cảnh báo Tồn Kho:** Cảnh báo các SKU sắp chạm đáy (VD: dưới 5 sản phẩm). Màu Đỏ (`#EF4444`).

### 2.2 Trình Quản Lý Sản Phẩm (SKU Matrix Form)
Thiết kế theo dạng Accordion List (Danh sách thả xuống) để cấu hình biến thể (Variants).
- Header: Tên sản phẩm chính (Parent Object).
- Body: Từng dòng cấu hình cho (Màu, Size, Giá, Cân nặng, Cồn kho). Hỗ trợ Bulk Edit (nhập 1 lần áp dụng cho mọi Size).
- Input fields: Có Masking để tách hàng nghìn (VD: Nhập `150000` -> Hiển thị `150,000 ₫`).

### 2.3 Kanban/List Đơn Hàng (Fulfillment View)
Nhà bán xử lý Đơn trên UI này:
- **Tabs Phân Loại:** To Ship (Chờ giao) | Shipped (Đang giao) | Delivered (Đã giao) | Canceled (Đã hủy).
- **Data Table:** Hỗ trợ Sticky Header để cuộn xuống không bị mất tên cột.
- **Bulk Action Bar (Hành động Hàng Loạt):** 
  Khi user Checkbox nhiều đơn, một thanh Panel trượt từ dưới cạnh đáy lên chứa nút: "IN MÃ VẬN ĐƠN HÀNG LOẠT (Tự động trừ mã qua API)".
  
## 3. SEO & DOM Semantic Specs (Seller Specific)

Do panel ẩn đằng sau Authentication, SEO Bot bị chặn lập chỉ mục (Noindex, Nofollow). Tập trung Semantic vào Accessibility thay vì SEO.
- Form Elements bắt buộc phải có thẻ `<label>` gắn với ID của thẻ `<input>`.
- Các nút Paging, Next, Previous đều phải hỗ trợ thuộc tính `aria-label` và điều hướng hoàn toàn bằng phím `Tab` trên bàn phím phục vụ tốc độ rảnh tay.
