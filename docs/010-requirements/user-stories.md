---
id: US-001
type: requirements
status: review
project: PomeloEC
owner: "@product-manager"
linked-to: [[prd]], [[use-cases]]
created: 2026-04-16
updated: 2026-04-16
---

# User Stories (Product Backlog)

Tài liệu này chứa các User Stories (Câu chuyện người dùng) được phân rã từ Use Cases và PRD, đóng vai trò là Product Backlog cấp cao cho nhóm phát triển.

## Epic 0: Định danh & Tài khoản (Identity & Access Management)

### Story 0.1: Đăng nhập Nhanh (Social Login)
**Là một** Người mua hàng,
**Tôi muốn** bấm Đăng nhập bằng Google/Apple thay vì tự gõ mật khẩu,
**Để** quá trình mua sắm không bị gián đoạn vì rào cản cồng kềnh.

* **Acceptance Criteria (Gherkin):**
  * Sử dụng cơ chế JWT/OAuth2. Đảm bảo Refresh Token được lưu ở HttpOnly Cookie.

### Story 0.2: Xác minh Gian hàng (Seller KYC)
**Là một** Người bán hàng,
**Tôi muốn** được cấp định danh Gian Hàng Uy Tín sau khi tải lên CMND/CCCD,
**Để** gia tăng sự tin tưởng của người mua và chống Bot tạo cửa hàng rác.

### Story 0.3: Sổ địa chỉ chuẩn (Address Book)
**Là một** Người mua hàng,
**Tôi muốn** chọn địa chỉ dễ dàng từ danh sách Tỉnh/Thành sổ xổ,
**Để** tự tin lúc Check-out giá ship tính đúng hãng Giao Hàng Nhanh.

## Epic 1: Mua sắm & Tương tác (Buyer Experience)

### Story 1.1: Quản lý Giỏ Hàng (Cart)
**Là một** Người mua hàng (Buyer),
**Tôi muốn** có thể thêm, sửa, xóa sản phẩm trong giỏ hàng một cách mượt mà và số lượng tồn kho hiển thị realtime,
**Để** tôi không bị mất thời gian chờ đợi hoặc chọn nhầm hàng đã hết.

* **Acceptance Criteria (Gherkin):**
  * `GIVEN` tôi đang ở trang Chi tiết sản phẩm có tồn kho > 0
  * `WHEN` tôi click "Thêm vào giỏ"
  * `THEN` dữ liệu giỏ hàng được cập nhật tức thì (qua Redis) mà không cần tải lại trang.

### Story 1.2: Check-out và Tính phí Vận Chuyển Real-time
**Là một** Người mua hàng,
**Tôi muốn** hệ thống tự động tính toán phí vận chuyển từ Giao Hàng Nhanh (GHN) khi tôi chọn địa chỉ nhận hàng,
**Để** tôi biết chính xác tổng số tiền mình cần thanh toán trước khi xác nhận đơn.

### Story 1.3: Áp dụng Mã giảm giá (Voucher Stacking)
**Là một** Người mua hàng,
**Tôi muốn** áp dụng nhiều loại mã giảm giá cùng lúc (Sàn, Shop, Freeship),
**Để** tối ưu chi phí mua sắm.

* **Acceptance Criteria:**
  * Hệ thống hỗ trợ khóa slot voucher (Reserve Quota) tạm thời trong 15 phút qua Redis.
  * Phải phân bổ phần trăm giảm giá (prorating) xuống từng món hàng trong đơn.

### Story 1.4: Thanh toán Webhook (Idempotency)
**Là một** Người mua hàng,
**Tôi muốn** thanh toán qua cổng quét mã QR (VNPay/MoMo) an toàn,
**Để** không bao giờ bị trừ tiền 2 lần cho cùng một hóa đơn dẫu đường truyền mạng chập chờn.

### Story 1.5: Push Notification Tracking
**Là một** Người mua hàng,
**Tôi muốn** nhận Push Notification thời gian thực khi đơn hàng được bên vận chuyển đổi trạng thái,
**Để** tiện sắp xếp thời gian lấy hàng.

### Story 1.6: Yêu cầu Trả hàng & Đóng băng tiền
**Là một** Người mua hàng,
**Tôi muốn** có thể bấm "Yêu cầu trả hàng" ngay trên app khi nhận sai hàng,
**Để** số tiền tôi đã thanh toán bị hệ thống đóng băng khẩn cấp, ngăn Seller rút tiền chạy mất.

### Story 1.7: Đánh giá Sản phẩm (Rating & Review)
**Là một** Người mua hàng,
**Tôi muốn** tải lên Video/Hình ảnh thực tế khi viết Đánh giá 5 sao cho sản phẩm,
**Để** có thể kiếm xu thưởng.

* **Acceptance Criteria:**
  * Chỉ user thỏa mãn (Verified Purchase) mới có quyền đánh giá.
  * Việc đẩy video phải thông qua S3 Pre-signed URL thay vì xuyên qua NestJS server để tối ưu RAM.

### Story 1.8: Chat Trực Tuyến với Shop (Real-time Chat)
**Là một** Người mua hàng,
**Tôi muốn** chat trực tiếp với Seller qua giao diện nhúng ngay trong App,
**Để** hỏi thêm chi tiết về size áo hoặc nhắc lịch giao hàng.

* **Acceptance Criteria:**
  * Context-aware: Tự động đính kèm ID Sản phẩm/Đơn hàng đang xem vào tin nhắn đầu tiên.

### Story 1.9: Trải nghiệm Điểm Thưởng (Loyalty Coins)
**Là một** Người mua hàng,
**Tôi muốn** nhận Xu sau khi hoàn tất đơn và dùng Xu giảm giá cho đơn tiếp theo,
**Để** tiết kiệm chi phí và có động lực mua hàng ở sàn.

### Story 1.10: Luồng Gợi Ý (Personalized Recommendation)
**Là một** Người mua hàng,
**Tôi muốn** lướt thấy những sản phẩm liên quan đến các món tôi vừa xem hoặc bỏ giỏ,
**Để** dễ dàng tìm thấy đồ phù hợp với sở thích.

## Epic 2: Quản lý Bán Hàng (Seller Experience)

### Story 2.1: Quản lý Tồn kho (Inventory) cực tốc
**Là một** Nhà bán hàng (Seller),
**Tôi muốn** khi có đơn mới, tồn kho của tôi ngay lập tức bị trừ một cách an toàn mà không bị lỗi cấp phát kép (overselling),
**Để** tôi không phải đền bù cho khách hàng dẫu đang trong đợt Flash Sale.

* **Acceptance Criteria:**
  * Ngầm định: Xử lý bằng Lua Script qua Redis. Cập nhật hiển thị UI của Seller trong phần Quản lý Tồn Kho.

### Story 2.2: Yêu cầu Rút Tiền (Payout) từ Ví Escrow
**Là một** Nhà bán hàng,
**Tôi muốn** theo dõi số dư khả dụng và yêu cầu rút tiền về tài khoản ngân hàng,
**Để** duy trì dòng tiền kinh doanh.

* **Acceptance Criteria:**
  * Chỉ số dư của các đơn hàng có trạng thái "Đã nhận hàng thành công" mới được đưa vào mục "Khả dụng".

### Story 2.3: Tạo Ma Trận Biến Thể Sản Phẩm
**Là một** Nhà bán hàng,
**Tôi muốn** nhập nhiều Option màu, Option Size và hệ thống tự nhân bản sinh ra danh sách quản lý độc lập từng món,
**Để** tôi có thể set tồn kho và mã vạch riêng cho từng cái áo Đỏ/Size S.

### Story 2.4: Xử lý đóng gói & In Vận Đơn API
**Là một** Nhà bán hàng,
**Tôi muốn** bấm "Chuẩn bị hàng" để sinh ra file PDF mã vạch của nhà vận chuyển,
**Để** lệnh in dán lên thùng hàng nhanh chóng.

### Story 2.5: Thiết lập Khuyến Mãi (Promotions Rule Engine)
**Là một** Nhà bán hàng,
**Tôi muốn** tạo Rule giảm giá "Mua 2 giảm 10%" chạy theo khung giờ hẹn trước,
**Để** kích cầu dân tình mua sắm trong đợt Sale.

* **Acceptance Criteria:**
  * Có cơ chế Pre-warming đưa Rule lên cache Redis 15 phút trước giờ G để tránh Sốc hệ thống.

### Story 2.6: Xử lý Vận Đơn Hàng Loạt (Bulk Async Fulfillment)
**Là một** Nhà bán hàng Mall,
**Tôi muốn** tích chọn 500 đơn bấm "Đóng gói" 1 lần và đi pha cafe đợi,
**Để** tiết kiệm thời gian thao tác click từng đơn.

* **Acceptance Criteria:**
  * Web không được treo (Loading spinner). Backend trả về file PDF tổng ngay khi Background worker chạy xong.

## Epic 3: Hệ Thống Lỗi & Tự Động Hóa (System Reliability & Jobs)

### Story 3.1: Fallback Tìm kiếm (Elasticsearch)
**Là một** Quản trị viên Hệ thống (System Admin),
**Tôi muốn** ứng dụng tự rollback gọi truy vấn vào Database dự phòng khi cụm Search Engine bị tách sóng/sập mạng,
**Để** người dùng không bị "Màn hình trắng" trải nghiệm gián đoạn.

### Story 3.2: Worker Hủy đơn tự động qua Delay Queue
**Là một** Hệ thống ngầm,
**Tôi muốn** rà quét và trút bỏ những đơn hàng bị treo không thanh toán quá 15 phút,
**Để** giải phóng tồn kho trên Redis trả lại cơ hội mua hàng cho người khác.

* **Acceptance Criteria:**
  * Sử dụng BullMQ Delay Queue lập lịch chính xác tới mili-giây.

### Story 3.3: Cronjob Tự động hoàn tất (Settlement)
**Là một** Hệ thống ngầm,
**Tôi muốn** quét các đơn đã giao thành công qua 7 ngày vào lúc 2:00 sáng mỗi ngày,
**Để** thực hiện vòng đời Settlement: Nhả tiền từ Ví giữ cửa (Escrow) trừ các khoản phí hoa hồng, sau đó cộng phần còn lại vào số dư Khả dụng của Seller.

### Story 3.4: Tracking Hoa Hồng (Affiliate / KOC)
**Là một** Hệ thống ngầm,
**Tôi muốn** bắt được `aff_id` từ link giới thiệu và bám theo Cookie suốt 30 ngày,
**Để** tính đúng, tính đủ % hoa hồng cho KOC kéo khách về mua.

### Story 3.5: Batch Đối Soát Giao Hàng Thu Hộ (COD Check)
**Là một** Hệ thống ngầm / Kế toán Sàn,
**Tôi muốn** mỗi đêm tự động nuốt file CSV 50.000 dòng từ hãng Vận Chuyển để so khớp tiền COD,
**Để** chặn ngay tình trạng lệch tiền, mất tiền tỷ mà không biết.

* **Acceptance Criteria:**
  * Parse CSV bằng Node.js Streams thay vì đọc toàn bộ vào file. Chống OOM (Out of memory).

### Story 3.6: Tường lửa Chống Gian Lận (Risk Engine)
**Là một** Hệ thống ngầm,
**Tôi muốn** bám theo IP, Device Fingerprint để chấm điểm Rủi ro (Risk Score) của user,
**Để** block ngay lập tức bọn lạm dụng acc clone cày mã Voucher.

---
> [!NOTE]
> Bảng User Stories này đạt tiêu chuẩn INVEST và định hình toàn bộ luồng kỹ thuật cho Base Architecture.