---
id: DIAG-STATE
type: design
project: PomeloEC
owner: "@system-analyst"
---

# Sơ đồ Trạng thái Đa mảng (State Machine Diagrams)

Tài liệu này thâu tóm biểu đồ vòng đời các thực thể cốt lõi, bao phủ toàn vẹn các nhánh rẽ và Use Cases hệ thống.

## 1. Vòng đời Đơn hàng (Cốt lõi E-Commerce) - Bao phủ UC03, UC07, UC09, UC12, UC13, UC14

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : UC03 - Đặt hàng (Khóa kho)
    
    PENDING_PAYMENT --> CANCELED : UC13 - Quá 15p (Auto nhả kho)
    PENDING_PAYMENT --> PAID : UC07 - Webhook VNPay
    
    PAID --> PROCESSING : UC12 - Seller Đóng gói
    PROCESSING --> SHIPPED : Partner quét lấy hàng
    SHIPPED --> DELIVERED : Partner giao thành công
    SHIPPED --> RETURN_TO_SELLER : Giao thất bại
    
    DELIVERED --> COMPLETED : UC14 - [Auto] 7 ngày không khiếu nại
    DELIVERED --> DISPUTE_OPENED : UC09 - Khách ấn Trả Hàng (Tạm giữ tiền)
    
    DISPUTE_OPENED --> REFUNDED : Admin xử Seller thua
    DISPUTE_OPENED --> COMPLETED : Admin xử Khách thua
    
    CANCELED --> [*]
    REFUNDED --> [*]
    COMPLETED --> [*]
    RETURN_TO_SELLER --> [*]
```

## 2. Vòng đời Gian hàng (Store KYC) - Bao phủ UC00B
Quản trị vòng đời người bán để chống lừa đảo trên sàn giao dịch.

```mermaid
stateDiagram-v2
    [*] --> PENDING_APPROVAL : Gửi Giấy Phép ĐKKD (Chứa URL S3)
    
    PENDING_APPROVAL --> REJECTED : Admin reject (Lý do báo qua Email)
    REJECTED --> PENDING_APPROVAL : Cập nhật lại giấy tờ
    
    PENDING_APPROVAL --> VERIFIED : Admin duyệt

    VERIFIED --> SUSPENDED : AI Quét thấy vi phạm / Lượt Report cao
    SUSPENDED --> VERIFIED : Phục hồi tài khoản
    SUSPENDED --> BANNED : Cấm vĩnh viễn, khóa tiền Escrow

    BANNED --> [*]
```

## 3. Vòng đời Khuyến mãi / Sốc giá (Seller Promotion) - Bao phủ UC18
Hạt nhân cho bài toán chịu tải Flash Sale (Caching tự động).

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Seller tạo nhưng chưa kích hoạt
    
    DRAFT --> SCHEDULED : Hẹn lịch (Ví dụ: 8PM)
    
    SCHEDULED --> PRE_WARMING : Vài phút trước giờ G, nạp Cache Cứng Redis
    
    PRE_WARMING --> ACTIVE : Đến giờ G
    
    ACTIVE --> DEPLETED : Hết số lượng ngân sách giữ giá Sốc
    ACTIVE --> ENDED : Hết thời gian sự kiện
    
    DEPLETED --> ENDED : Chờ chốt kết quả
    
    ENDED --> [*]
```

## 4. Vòng đời Xử lý Rút tiền Ví Escrow (Payout Request) - Bao phủ UC05
Quản trị rủi ro thất thoát tiền tệ.

```mermaid
stateDiagram-v2
    [*] --> REQUESTED : Gọi API xin rút (Trừ Available_Balance)
    
    REQUESTED --> PROCESSING : Gửi lệnh sang Bank Gateway (IBFT)
    
    PROCESSING --> TRANSFERRED : Ngân hàng trả mã giao dịch thành công
    
    PROCESSING --> REJECTED : Thất bại do lỗi Bank (Cộng hoàn Available_Balance)
    
    TRANSFERRED --> [*]
    REJECTED --> [*]
```
