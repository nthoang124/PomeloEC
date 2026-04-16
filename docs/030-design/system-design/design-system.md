---
id: LLD-UIUX
type: specs
status: approved
project: PomeloEC
owner: "@ui-ux-designer"
created: 2026-04-16
updated: 2026-04-16
---

# UI/UX Design System & Specifications (Shopee Clone)

Từ bỏ định hướng "Kén chọn mượt mà", PomeloEC đã chuyển chiến lược sang dạng **Mass-Market E-commerce** với giao diện giống hệt Shopee. Mục tiêu tối thượng của kiểu kiến trúc UI này là: "Bán Rẻ - Bán Cực Nhiều - Mức độ cạnh tranh hiển thị khốc liệt".

## 1. Core Visual Tokens (Hệ Thống Màu Sắc Đại Chúng)

Hệ thống màu này được thiết kế để kích thích sự hối thúc mua hàng, cực kỳ nổi bật.

### Color Palette (Light Mode Bắt Buộc)

- `--shopee-orange`: `#EE4D2D` (Màu cam chói lóa - Call To Action, Sale Badge).
- `--bg-body`: `#F5F5F5` (Xám tro nhạt, mục đích để làm nổi thẻ sản phẩm màu trắng).
- `--card-bg`: `#FFFFFF` (Trắng tinh).
- `--text-primary`: `rgba(0,0,0,0.87)` (Đen chữ chính).
- `--text-secondary`: `rgba(0,0,0,0.54)` (Xám cho lượt thích, số đã bán).
- `--border-color`: `rgba(0,0,0,0.09)`.

### Typography (Cổ điển và Nhỏ)
- Chữ không cần quá đẹp, nhưng khoảng cách dòng phải hẹp (`1.2` - `1.4`) để nhồi được nhiều text vào 1 diện tích nhỏ.
- Dùng `Helvetica`, `Arial`, `Roboto`.

## 2. Breakdown Thành Phần Giao Diện (Components Specification)

### A. Navbar Truyền Thống 2 Tầng
Thay vì Navbar trượt mỏng của Apple:
- Tầng Trên Cùng (rất mỏng): Hiện đường links Đăng ký, Cài app, Thông báo chuông.
- Tầng Main (dày, nền Cam): Logo Bự bên trái. Ở giữa là **Thanh Tìm Kiếm cực lớn** nền trắng, nút kính lúp màu cam nhỏ. Bên phải là Giỏ hàng icon xe đẩy gọn gàng.

### B. Mật Độ Điểm Ảnh Khủng (High-Density Product Grids)
Cấu trúc Thẻ Sản Phẩm Shopee:
- **Kích thước Card**: Chuẩn `190px x Xpx`. Hàng ngang chèn được ngót 6 sản phẩm ở màn `1200px`.
- Lớp ranh giới 1px mỏng tang. Nhấc chuột (hover) sẽ hiện box-shadow, và thẻ nhúc vào trong 1px.
- Thumbnail: Hình vuông tỷ lệ chặt chẽ 1:1.
- Footer Product: 2 dòng title. Ở dưới phải chia làm hai cực: Cực trái là Giá Cam Đậm, Cực Phải là Đã Bán Xk cỡ nhỏ li ti màu xám.

### C. Nút Action Bếp Lò (Warm Buttons)
Các trang Checkout hay Product Detail không xài màu lạnh như xanh lá/xanh biển. Nút bấm Mua Ngay luôn là Solid Orange (`#EE4D2D`) để đánh vào cảm xúc bốc đồng của người mua.
