---
id: TC-INT-INVENTORY-01
type: test-case
module: Integration
feature: Inventory Lock
priority: P0
status: draft
project: PomeloEC
owner: "@qa-tester"
linked-to: [[UC-03_L]]
---

# TC-INT-INVENTORY-01: Chống Race-Condition (Overselling) với Redis Lua Script

## 1. Mô tả Kịch bản (Scenario)
Kiểm tra tính nhất quán (ACID-like) của quá trình Khóa Tồn Kho thông qua Redis Lua Script khi hệ thống phải chịu tải cao với hàng loạt Request cực nhanh gọi vào đồng thời (Mô phỏng đợt truy cập Flash Sale khốc liệt).

## 2. Tiền điều kiện (Pre-conditions)
1. Setup Local Môi trường với Jest và Testcontainers `@testcontainers/redis`.
2. Khởi tạo 1 Instance Redis trắng.
3. Bơm giá trị tồn kho ban đầu: `SET stock:sku_101:qty 5`. Tức là hệ thống hiện tại CHỈ CÓ SẴN 5 Sản phẩm.

## 3. Các bước thực hiện (Steps / Implementation in Jest)

| Step | Hành động của Automation Code | Ý nghĩa Test |
| :--- | :--- | :--- |
| **S1** | Chuẩn bị mảng 10 user giả lập muốn mua SKU `sku_101`, mỗi đứa mua số lượng `1`. | Chuẩn bị Request đồng thời (Concurrent Request). |
| **S2** | Dùng `Promise.all([user1, user2, ... user10])` để bắn cùng lúc 10 lệnh gọi API Lock Inventory xuyên qua Lua Script vào Redis. | Kích hoạt Race-Condition (Xung đột trạng thái). Cố tình mua 10 món khi kho chỉ có 5. |
| **S3** | Chờ đợi Execution xong. Kiểm tra mảng kết quả Array Trả về. | Verify tính phân loại đúng sai của Engine. |
| **S4** | Đọc lại biến `GET stock:sku_101:qty` ngay trên Redis để thẩm định số cuối. | Xác minh Tồn kho không bị thủng. |

## 4. Kết quả mong đợi (Expected Results / Assertions)
1. **Assertion 1 (Mảng Kết quả):**
   - Phải có Rất Rất Chính Xác **5 kết quả SUCCESS** (Tương đương 5 thằng mua thành công, Redis lock được).
   - Phải có Rất Rất Chính Xác **5 kết quả FAILED (Overselling)** (Tương đương 5 thằng tới trễ bị đá ra).
2. **Assertion 2 (Giá trị Tồn Kho cuối cùng):**
   - `GET stock:sku_101:qty` mong đợi trả về đúng bằng **`0`**. Tuyệt đối không được rớt vào số âm như `-1` hoặc `-5`.
3. **Assertion 3 (Performance Check):** 
   - Toàn bộ thời gian chạy qua `Promise.all` của 10 operations này KHÔNG vượt quá `50ms`.

## 5. Đoạn mã gợi ý (Automation Guide line)

```javascript
// Test logic mô phỏng (Jest)
it('should accurately block overselling with Lua script when 10 buyers concurrent attack 5 items', async () => {
    await redisClient.set('stock:sku_101:qty', 5);
    
    // Tạo 10 lời hứa gọi Redis đồng thời
    const concurrentRequests = Array.from({length: 10}).map(() => 
         inventoryService.lockStock('sku_101', 1) 
    );
    
    // Thực thi
    const results = await Promise.allSettled(concurrentRequests);
    
    const successes = results.filter(r => r.status === 'fulfilled');
    const rejections = results.filter(r => r.status === 'rejected');
    
    // Assert 5 pass, 5 reject
    expect(successes.length).toBe(5);
    expect(rejections.length).toBe(5);
    
    // Assert không âm
    const finalStock = await redisClient.get('stock:sku_101:qty');
    expect(finalStock).toBe('0');
});
```
