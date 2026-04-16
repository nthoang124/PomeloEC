---
id: UC-001
type: document
status: draft
project: PomeloEC
owner: "@product-manager"
created: 2026-04-16
updated: 2026-04-16
---

# Use Cases - PomeloEC Marketplace

Tài liệu rã băng các tương tác chính của người dùng dựa trên Yêu cầu nghiệp vụ (PRD).

## Nhóm 0: Định danh & Tài khoản (IAM)

### UC-00A: Đăng ký & Đăng nhập Khách hàng (Buyer)
- **Trigger:** Người dùng mở App/Web lần đầu hoặc chọn Login.
- **Hành vi hệ thống:**
  1. Hỗ trợ Đăng nhập qua mạng xã hội (Google SSO / Facebook) để giảm rào cản tham gia.
  2. Hỗ trợ Đăng nhập bằng SMS OTP qua số điện thoại.
  3. Cấp một cặp `Access_Token` (quẹt API liên tục) và `Refresh_Token` (Lưu HttpOnly Cookie để giữ phiên đăng nhập an toàn).

### UC-00B: Đăng ký Mở Gian Hàng (Seller KYC)
- **Trigger:** Người dùng đã có tài khoản Buyer, chọn "Đăng ký bán hàng".
- **Hành vi hệ thống:**
  1. Yêu cầu tải lên mặt trước/sau CMND hoặc Giấy Phép Kinh Doanh.
  2. Quản trị viên (Admin) sẽ duyệt tay các tài khoản này (Kích hoạt role `seller`).
  3. Nếu không vượt qua KYC, tài khoản chỉ được phép mua hàng, không được phép đăng sản phẩm.

### UC-00C: Quản lý Sổ Địa Chỉ (Address Book)
- **Trigger:** Khách hàng vào trang cá nhân lưu địa chỉ giao nhận (Phục vụ UC-02 tính ship).
- **Hành vi hệ thống:**
  1. Yêu cầu chọn Tỉnh/Thành, Quận/Huyện, Phường/Xã từ Database chuẩn quốc gia gộp theo GHN/ViettelPost. (Bắt buộc để API Ship gán đúng mã bưu cục).
  2. Map tọa độ Lat/Long nếu khách chia sẻ vị trí qua GPS.

## Nhóm 1: Dành cho Khách hàng (Buyer)

### UC-01: Tìm kiếm & Lọc Sản phẩm tốc độ cao
- **Trigger:** Người dùng gõ từ khóa vào thanh tìm kiếm hoặc tích chọn bộ lọc (Giá, Kích cỡ, Tỉnh/Thành).
- **Hành vi hệ thống:**
  1. API gọi trực tiếp vào cluster **Elasticsearch** (thay vì DB) để trích xuất danh sách SKU khớp với từ khóa.
  2. Cache response lên Redis trong thời gian ngắn (nếu truy vấn quá phổ biến).
- **Ngoại lệ (Edge Case):** Elasticsearch bị sập -> Luồng fallback tự động kích hoạt query trên Replicas PostgreSQL (kèm limit) để hệ thống không gián đoạn hoàn toàn.

### UC-02: Thêm vào Giỏ hàng & Chọn Phương thức nhận hàng
- **Trigger:** Người dùng ấn "+ Giỏ hàng".
- **Hành vi hệ thống:**
  1. Đẩy lệnh lưu mảng dữ liệu vào **Redis Hash** (không chạm DB).
  2. Khi vào trang Checkout, API gọi sang các hãng phân phối vận chuyển (**GHTK, ViettelPost**) để tính biểu phí Ship theo khoảng cách (Giữa kho của seller và địa chỉ của Buyer).
- **Phân tách Đơn:** Nếu khách mua từ 3 Sellers khác nhau, hệ thống tự động tách thành 3 Đơn hàng (Sub-orders) con để giao đi độc lập.

### UC-03: Thanh toán & Chốt Đơn (High-TPS Flash Sale)
- **Trigger:** Bấm "Thanh toán".
- **Hành vi hệ thống (Luồng then chốt):**
  1. **Nhận diện Tồn kho:** Hệ thống chạy hàm **Redis Lua Script** để khóa trừ số lượng SKU trên RAM (Thời gian 1-2 mili-giây).
  2. **Ghi DB:** Nếu Lua Script trả về thành công, mở Transaction SQL Ghi Đơn Hàng vào PostgreSQL.
  3. **Event Stream:** Đẩy gói tin `"OrderCreated"` vào **Apache Kafka**.
  4. Trả về kết quả Thành công cho User.
- **Ngoại lệ (Overselling):** Nếu Lua Script trả về -1 (Hết hàng), lập tức ném Exception "Sản phẩm vừa bán hết" và chặn không cho chạm xuống DB.

### UC-06: Áp dụng Mã giảm giá (Voucher Stacking)
- **Trigger:** Tại giỏ hàng, người dùng chọn mã giảm giá (Có thể chọn cùng lúc: 1 Mã của Sàn + 1 Mã của Shop + 1 Mã Freeship).
- **Hành vi hệ thống:**
  1. Engine tính toán (Rule Engine) kiểm tra điều kiện: Giá trị đơn tối thiểu, Hạng thành viên, Hạn sử dụng.
  2. Reserve Quota (Giữ lượt): Gọi Redis Lua Script để khóa trừ tạm số lượng lượt sử dụng của Voucher đó trong 15 phút (Chống tình trạng 1.000 người cùng xài chung 1 mã Flash Sale chỉ có 100 lượt).
  3. Phân bổ giảm giá (Prorating): Mức giảm giá phải được tính toán chia đều xuống từng Sản phẩm con (Order_Items) thay vì trừ vào tổng đơn. (Điều này là bắt buộc để sau này khách trả hàng 1 món, hệ thống mới tính được số tiền cần hoàn lại là bao nhiêu).

### UC-07: Xử lý Webhook Thanh toán Online (Idempotency Check)
- **Trigger:** Khách quét mã QR VNPay/MoMo thành công, Cổng thanh toán bắn API Webhook về Server.
- **Hành vi hệ thống:**
  1. Xác thực Chữ ký bảo mật (Signature/HMAC) để chống Hacker dùng Postman bắn request giả mạo.
  2. Tính Lũy Đẳng (Idempotency Check): Check Transaction_ID trên Redis. Nếu giao dịch này đã xử lý rồi -> Bỏ qua. (Tránh lỗi mạng VNPay bắn Webhook 2 lần làm khách bị cộng tiền 2 lần).
  3. Cập nhật Đơn hàng sang PAID, đẩy Event vào Queue để báo cho Seller chuẩn bị hàng.

### UC-08: Theo dõi Hành trình & Thông báo thời gian thực
- **Trigger:** Đối tác Vận chuyển (GHTK/GHN) quét mã vạch lấy hàng/giao hàng thành công và bắn Webhook cập nhật.
- **Hành vi hệ thống:**
  1. Server cập nhật State Machine của Đơn hàng (PROCESSING -> SHIPPED -> DELIVERED).
  2. Kích hoạt WebSocket (Socket.io) hoặc Firebase (FCM) để đẩy Push Notification thẳng vào màn hình điện thoại Buyer: "Đơn hàng mã #123 đang trên đường giao đến bạn".

### UC-09: Yêu cầu Trả hàng & Hoàn tiền (Return & Refund - RMA)
- **Trigger:** Khách nhận áo bị rách, bấm "Yêu cầu Trả hàng" trong vòng 3-7 ngày (Escrow Period).
- **Hành vi hệ thống (Luồng then chốt):**
  1. Lập tức Đóng băng (Freeze) khoản tiền của đơn hàng này. Tạm dừng bộ đếm thời gian chốt đơn, không cho phép cộng tiền vào Số dư khả dụng của Seller (Chặn UC-05).
  2. Đổi trạng thái sang DISPUTE_OPENED (Tranh chấp). Mở luồng chat cho 2 bên up hình ảnh bằng chứng.
  3. Nếu Admin sàn phán quyết Buyer thắng -> Gọi API Refund của VNPay/MoMo để đảo ngược dòng tiền, trả về thẻ cho Buyer.

### UC-10: Đánh giá Sản phẩm (Rating & Reviews)
- **Trigger:** Đơn hàng chuyển sang Delivered (Đã giao), khách bấm "Đã nhận hàng" và đánh giá 5 sao kèm Video/Ảnh.
- **Hành vi hệ thống:**
  1. Validate Verified Purchase (Chắc chắn user này đã mua thành công SKU này).
  2. App/Web gọi lấy AWS S3 Pre-signed URL, sau đó App đẩy thẳng Video/Ảnh lên Cloud S3. (Tuyệt đối không đẩy file xuyên qua Server NestJS để tránh nghẽn RAM).
  3. Đẩy Job vào Queue. Worker chạy nền sẽ tính toán lại Điểm đánh giá trung bình (Avg Rating) của Sản phẩm đó và đồng bộ sang Elasticsearch.

### UC-15: Trò chuyện Trực tuyến (Real-time Chat Buyer ↔ Seller)
- **Trigger:** Khách bấm "Chat với Shop" từ trang chi tiết Sản phẩm hoặc trang Đơn hàng.
- **Hành vi hệ thống:**
  1. Mở kết nối WebSocket (Socket.io) 2 chiều. (Sử dụng thêm Redis Pub/Sub làm Adapter nếu Backend chạy scale nhiều instances).
  2. Trích xuất Context: Tự động đính kèm "Thẻ Sản phẩm" hoặc "Thẻ Đơn hàng" vào tin nhắn đầu tiên để Seller biết ngay ngữ cảnh.
  3. Lưu trữ: Lưu lịch sử chat vào MongoDB (hoặc 1 bảng PostgreSQL riêng biệt có Partitioning) thông qua Worker chạy nền. Tuyệt đối không Insert trực tiếp vào DB lõi làm chậm luồng chốt đơn.
  4. Ngoại lệ: Nếu Seller offline, hệ thống gọi Firebase (FCM) bắn Push Notification tới App điện thoại của Seller.

### UC-16: Tích lũy & Sử dụng Điểm thưởng (Loyalty Coins / Shopee Xu)
- **Trigger:** Khách hàng nhận hàng thành công (Hoàn tất UC-14) hoặc gạt nút "Dùng Xu" tại bước Thanh toán (UC-03).
- **Hành vi hệ thống:**
  1. Tích điểm: Worker chạy nền tính toán % điểm thưởng dựa trên Hạng thành viên và cộng "Xu" vào ví người dùng.
  2. Dùng điểm: Quy đổi Xu thành tiền giảm giá. Bắt buộc dùng Redis Lua Script để khóa trừ số Xu tạm thời (tương tự khóa tồn kho) nhằm tránh lỗi Double-spending khi user mở 2 tab điện thoại bấm thanh toán cùng lúc.
  3. Nếu đơn hàng bị Hủy (UC-13), Worker tự động hoàn trả số Xu khách đã dùng và thu hồi số Xu đã tặng.

### UC-17: Gợi ý Sản phẩm Cá nhân hóa (Recommendation Feed)
- **Trigger:** Người dùng lướt mục "Gợi ý cho bạn" ở Trang chủ hoặc dưới cùng trang Chi tiết sản phẩm.
- **Hành vi hệ thống:**
  1. Dịch vụ Tracking ghi nhận Clickstream (Lịch sử xem, thêm giỏ, mua).
  2. Backend query vào Elasticsearch (Sử dụng Function Score / Vector Search) để Boost (đẩy lên top) các Sản phẩm/Danh mục có cùng tag với hành vi của user.
  3. Cache response lên Redis theo từng User_ID trong thời gian ngắn (15-30 phút).

## Nhóm 2: Dành cho Nhà Bán (Seller)

### UC-04: Quản trị Gian hàng & Kho (Inventory)
- **Trigger:** Seller tải lên đợt nhập hàng mới.
- **Hành vi hệ thống:**
  1. Ghi thẻ kho (Ledger) vào PostgreSQL.
  2. Emit Kafka event `"InventoryAdded"` để đồng bộ số dư vật lý mới lên bộ nhớ RAM của Redis.

### UC-05: Rút tiền (Payout & Escrow)
- **Trigger:** Seller yều cầu Rút Doanh Thu.
- **Hành vi hệ thống:**
  1. Hệ thống chỉ hiển thị số dư **Khả Dụng** (Là những khoản tiền từ đơn hàng đã hoàn tất giao 100%, không bị Buyer khiếu nại).
  2. Khi rút, tính năng kế toán sẽ Khấu trừ phí Sàn (Platform Commission) theo hợp đồng trước khi gọi Cổng thanh toán chuyển trả về tài khoản ngân hàng của Seller.

### UC-11: Quản trị Biến thể Sản phẩm (Matrix SKUs)
- **Trigger:** Seller tạo 1 sản phẩm "Áo Thun" có 3 Màu (Đỏ, Đen, Trắng) và 4 Size (S, M, L, XL).
- **Hành vi hệ thống:**
  1. Backend dùng thuật toán Tích Đề-các (Cartesian Product) tự động sinh ra ma trận 12 SKUs (Biến thể) độc lập.
  2. Ép Seller phải nhập Giá tiền, Tồn kho (Inventory), Mã vạch (Barcode) và Trọng lượng riêng lẻ cho Từng SKU.
  3. Lưu DB, đẩy Event đồng bộ Document mới cấu trúc lại sang Elasticsearch.

### UC-12: Xử lý Đóng gói & In Vận Đơn (Fulfillment)
- **Trigger:** Seller vào danh sách đơn chờ, bấm "Chuẩn bị hàng / Đóng gói".
- **Hành vi hệ thống:**
  1. API gọi sang hệ thống đối tác Vận chuyển (GHTK/ViettelPost), truyền Địa chỉ kho Seller, Địa chỉ Buyer và Cân nặng.
  2. Nhận về Mã Vận Đơn (Tracking Code). Hệ thống render ra file PDF Hóa đơn có chứa Mã vạch.
  3. Trả link PDF để Seller tải về, in ra và dán lên thùng hàng.
  4. *Ngoại lệ:* API của GHTK bị lỗi 500. Hệ thống dùng cơ chế Exponential Backoff trên BullMQ tự động gọi thử lại sau 10s, 30s, 1 phút thay vì báo lỗi bắt Seller thao tác lại từ đầu.

### UC-18: Trung tâm Marketing Gian hàng (Seller Promotions)
- **Trigger:** Seller thiết lập Rule giảm giá, lên lịch chạy từ 20:00 - 22:00 tối nay.
- **Hành vi hệ thống:**
  1. Validate điều kiện chống phá giá. Ghi Rule vào DB với trạng thái PENDING.
  2. Làm ấm Cache (Pre-warming): Đúng 19:45, BullMQ Delay Job tự động bốc dữ liệu Rule/Giá mới đẩy lên Redis và đồng bộ tag hiển thị sang Elasticsearch.
  3. Khi khách thao tác Giỏ hàng (UC-02), Pricing Engine (Bộ tính giá) sẽ móc data từ Redis, nhóm các SKU thỏa điều kiện và tự động tính lại tổng tiền.
  4. Đúng 22:00, Worker tự động thu dọn Redis, khôi phục giá gốc.

### UC-19: Xử lý & In Vận Đơn Hàng Loạt (Bulk Fulfillment)
- **Trigger:** Seller tích chọn 500 đơn hàng đang chờ, bấm "Chuẩn bị hàng & In mã hàng loạt".
- **Hành vi hệ thống:**
  1. Backend nhận mảng Order_IDs, ném thẳng vào Queue và trả về 202 Accepted ("Đang xử lý, vui lòng đợi") để Web không bị treo.
  2. BullMQ Worker lấy từng batch, gọi API qua GHTK/ViettelPost (Tự động xử lý Delay Backoff để không bị đối tác chặn Rate-Limit).
  3. Gom 500 file mã vận đơn thành 1 file PDF tổng, đẩy lên AWS S3 và bắn WebSocket thông báo link tải cho Seller in thẳng ra máy in nhiệt.

## Nhóm 3: Hệ thống Lõi & Tự động hóa (System / Background Jobs)

Đây là nhóm "nhân viên vô hình" chạy ngầm, giữ cho Sàn của bạn không bị rác dữ liệu và thất thoát tiền bạc.

### UC-13: Hủy Đơn Tự Động & Thu Hồi Tồn Kho (Auto-Cancel Unpaid Orders)
- **Trigger:** Khách tạo đơn thành công, chọn thanh toán Online nhưng thoát App, không chịu trả tiền.
- **Hành vi hệ thống:**
  1. Ngay lúc sinh đơn ở UC-03, ném kèm 1 Job vào BullMQ Delay Queue với độ trễ hẹn giờ là 15 phút.
  2. Đúng 15 phút sau, Worker thức dậy bốc Job ra check Database. Nếu đơn vẫn PENDING_PAYMENT -> Đổi thành CANCELED.
  3. Release Lock (Nhả tồn kho & Voucher): Gọi lại Redis Lua Script để cộng trả số lượng Tồn kho lên RAM và DB, nhường quyền mua cho người khác.

### UC-14: Tự động Hoàn tất Đơn hàng (Auto-Complete & Settlement)
- **Trigger:** Cronjob chạy ngầm vào 02:00 sáng mỗi ngày.
- **Hành vi hệ thống:**
  1. Quét hàng vạn đơn hàng đã ở trạng thái DELIVERED được quá 7 ngày (hết hạn đổi trả) và không có Tranh chấp (UC-09).
  2. Đổi trạng thái đơn sang COMPLETED.
  3. Kích hoạt Kế toán: Trừ [Phí sàn - Platform Fee], trừ [Phí cổng thanh toán]. Cắt phần tiền còn lại cộng vào "Số dư Khả Dụng" của Seller. Lúc này UC-05 của Seller mới thực sự được phép hoạt động.

### UC-20: Theo dõi Tiếp thị Liên kết (Affiliate / KOC Tracking)
- **Trigger:** Buyer click vào link giới thiệu có gắn mã (vd: ?aff_id=KOC_123) và mua hàng.
- **Hành vi hệ thống:**
  1. Frontend đọc tham số aff_id và lưu vào HTTPOnly Cookie / LocalStorage với thời hạn (TTL) 7-30 ngày.
  2. Khi sinh đơn ở UC-03, Backend bốc aff_id gắn chết vào record Đơn hàng.
  3. Khi đơn hàng COMPLETED (UC-14), Hệ thống Kế toán tính toán % hoa hồng, tự động trích tiền từ doanh thu để cộng vào "Ví Affiliate" chờ đối soát của KOC.

### UC-21: Đối soát Giao hàng Thu hộ (Auto COD Reconciliation)
- **Trigger:** Nửa đêm, Đối tác Vận chuyển gửi khoản tiền thu hộ (COD) cho Sàn, kèm 1 file CSV chứa 50.000 mã vận đơn đã giao.
- **Hành vi hệ thống:**
  1. Worker dùng Node.js Streams đọc file CSV từng dòng (Tuyệt đối không load toàn bộ file vào RAM để tránh OOM sập Server).
  2. Map Tracking_Code và Số tiền thực nhận trong file với hệ thống.
  3. So khớp 100% -> Hạch toán tiền sang Ví Khả Dụng cho Seller (Mở khóa UC-05). Lệch tiền -> Bôi đỏ đẩy vào Dashboard "Dispute" để kế toán của Sàn giải quyết tay với hãng vận chuyển.

### UC-22: Nhận diện Gian lận & Cày Đơn Ảo (Anti-Fraud / Risk Engine)
- **Trigger:** Khi User đăng ký (UC-00A), áp mã Voucher (UC-06), hoặc Chốt đơn (UC-03).
- **Hành vi hệ thống:**
  1. Thu thập Metadata: IP Address, Device Fingerprint (Mã định danh phần cứng), Tọa độ GPS.
  2. Quét Rule Rủi ro: Ví dụ: Buyer và Seller dùng chung IP/Thiết bị; 1 điện thoại tạo 10 acc clone để nhận Voucher; Tài khoản vừa tạo 1 phút đã mua đơn 20 triệu.
  3. Nếu Risk Score cao -> Gắn cờ FRAUD_SUSPECT. Từ chối áp dụng Voucher, tạm giữ tiền Đơn hàng, không cho phép hiển thị Review (UC-10) để Admin can thiệp.