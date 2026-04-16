---
id: GL-001
type: document
status: approved
project: PomeloEC
owner: "@system-analyst"
created: 2026-04-16
updated: 2026-04-16
---

# Bảng Thuật Ngữ (Project Glossary)

Từ điển này định nghĩa các thuật ngữ kỹ thuật và quy trình nội bộ dùng tại dự án **PomeloEC**, đảm bảo sự đồng bộ về Communication giữa Product, Dev và Vận hành.

## 1. Domain Thương mại & E-Commerce

- **B2B2C (Business to Business to Consumer):** Mô hình kinh doanh nơi Sàn (Platform) cung cấp nền tảng để Nhà bán (Brand/Wholesaler) tiếp hệ thống tới Người dùng cuối.
- **SKU (Stock Keeping Unit):** Đơn vị phân loại hàng hóa tồn kho nhỏ nhất. (Ví dụ: Áo thun Đen size M là 1 SKU, Áo thun Đen size L là 1 SKU khác).
- **Escrow (Giao dịch bảo chứng):** Số tiền khách hàng thanh toán sẽ được giữ trung gian tại Ví Sàn, không tới ngay tay Người bán cho đến khi có xác nhận hoàn thành (tránh lừa đảo).
- **Overselling (Bán âm):** Hành vi rủi ro khi số lượng người đặt mua lớn hơn số lượng tồn kho thực tế do nghẽn cổ chai ghi chép (Race condition).

## 2. Kỹ Thuật (Architecture & Tech)

- **Modular Monolith:** Kiến trúc một Repo / một Server duy nhất, nhưng mã code giữa các thành phần (Catalog, Inventory, Order) bị cô lập vật lý như Microservices.
- **Event-Driven:** Thiết kế phân tán dùng sự kiện. Module A làm xong việc thì "hét lên" (emit event), module B lắng nghe và chạy tiếp, không gọi trực tiếp qua hàm.
- **Lua Script (Redis):** Ngôn ngữ kịch bản siêu nhẹ chạy bên trong RAM của Redis. Được sử dụng để bọc các thao tác kiểm tra tồn kho & trừ số lượng vào một Block "Atomic" (Không bao giờ bị race condition).
- **Idempotency Key:** Một mã Token duy nhất gắn kèm mọi Request từ Frontend (giao dịch tiền bạc). Nếu khách vô tình bấm 2 lần vào nút "Thanh toán", Server chỉ trừ tiền 1 lần dựa trên mã này.
- **KRaft Mode:** Cơ chế quản lý tập trung nội bộ của Kafka (hoạt động không cần cồng kềnh thêm cổng Zookeeper), giúp tối ưu hóa ổ cứng và RAM khi chạy trên localhost.

---
*Ghi chú: Nếu thêm một thuật ngữ mới, yêu cầu kỹ sư/BA phải giải nghĩa rõ Cả Khái Niệm lẫn Ngữ Cảnh ứng dụng trong PomeloEC.*
