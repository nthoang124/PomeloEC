---
id: TS-CATALOG-01
type: test-suite
module: Catalog
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[UC-01]], [[UC-10]], [[UC-11]], [[UC-17]]
---

# Bộ Kiểm Thử (Test Suite): Catalog & Nền Tảng Tìm Kiếm

Kiểm thử luồng tương tác với Elasticsearch và sự toàn vẹn của Ma trận biến thể (Matrix SKUs).

## 1. Test Cases: Quản lý Hình Thái Sản Phẩm (Matrix SKUs - UC-11)
*Dựa trên Hệ thống Data Entity Model (ERD)*

- **TC-CAT-01 (Thuật toán):** Tạo sản phẩm áo với Nhóm Màu (Đỏ, Đen) và Nhóm Size (S, M).
  - *Kỳ vọng:* Backend trích xuất (Cartesian) ra vừa đúng 4 SKUs con với chuỗi ID tự động sinh rời rạc. Mỗi mã bắt buộc phải nhận số lượng giá tiền/tồn kho riêng theo chuẩn DB.
- **TC-CAT-02 (Data Integrity):** Xóa 1 nhóm biến thể đã phát sinh giao dịch.
  - *Kỳ vọng:* Database Soft-Delete SKU, Elasticsearch ngừng index, nhưng trên Hóa Đơn cũ vẫn giữ nguyên vẹn lịch sử text hiển thị (Không lỗi NULL pointer).

## 2. Test Cases: Máy tìm kiếm tốc độ cao (UC-01)
*Dựa trên luồng Search Datafly Sequence*

- **TC-CAT-03 (Happy Path):** Tìm kiếm text "áo thun".
  - *Kỳ vọng:* Backend route thẳng query xuống Elasticsearch Cluster, bỏ qua PostgreSQL, trả kết quả HTTP 200 dưới 100ms.
- **TC-CAT-04 (Fallback & Resilience - Hoạt động đứt gãy):** Tắt giả lập cụm Elasticsearch (Simulate ES Shutdown). Bắn lệnh tìm kiếm lại.
  - *Kỳ vọng:* Backend văng lỗi Timeout Elastic. Ngay lập tức tự chuyển (Fallback) gửi Query "LIKE %áo thun%" tới Database Postgres Replica Read-only để hệ thống không sập toàn diện.

## 3. Test Cases: Đánh giá Review (UC-10)

- **TC-CAT-05:** Review sản phẩm chưa mua.
  - *Kỳ vọng:* API Block ngay lập tức HTTP 403 Forbidden (Logic `VerifyPurchaseStatus` thất bại).
- **TC-CAT-06:** Tính toán Avg Ratings.
  - *Kỳ vọng:* Khi Insert 1 Record Review (5 sao), BullMQ Background Worker thức dậy tự tính TBC = 5, Cập nhật Cache Redis, Update ES Document.

## 4. Test Cases: Product Recommendation (UC-17)

- **TC-CAT-07:** Clickstream Tracking.
  - *Kỳ vọng:* Gọi liên tục API Get_Product_Detail 10 lần cùng 1 tag (Giày). Trả về Recommend Feed mới 100% là giày. Đảm bảo response bị cache lên Redis theo `user_id`.
