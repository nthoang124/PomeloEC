---
id: DIAG-DFD
type: design
project: PomeloEC
owner: "@system-analyst"
---

# Sơ đồ Data Flow Diagram (DFD) & Use Case Mapping

Tài liệu này cung cấp biểu diễn cho 100% Use Case của PomeloEC dưới góc nhìn Dòng chảy Dữ Liệu (Phân rã chức năng).

## 1. Sơ đồ Ranh Giới Hệ Thống (System Boundary Diagram) & Nhóm Use Cases
```mermaid
flowchart LR
    %% Actors
    Buyer((👦 BUYER))
    Seller((🏪 SELLER))
    Admin((👮 ADMIN))

    %% Boundary
    subgraph PomeloEC [PomeloEC Platform]
        direction TB
        subgraph IAM [Identity & KYC]
            UC00A(00A: Đăng nhập SSO)
            UC00B(00B: Quản trị/Duyệt KYC)
            UC00C(00C: Quản lý Sổ Địa Chỉ)
        end
        subgraph Shop [Shop & Promotion]
            UC01(01: Tìm & Xem Chi tiết SP)
            UC02(02: Quản lý Giỏ hàng)
            UC06(06: Voucher Stacking)
            UC17(17: Gợi ý Cá nhân hóa)
        end
        subgraph Checkout_Post [Order & Post-Purchase]
            UC03(03: Mua Hàng & Thanh toán)
            UC07(07: Webhook Thanh toán)
            UC08(08: Track GPS Vận chuyển)
            UC09(09: Tạm giữ/Hoàn tiền RMA)
            UC10(10: Đánh giá SP Text/Video)
            UC15(15: Chat WebSocket)
            UC16(16: Loyalty Coins)
        end
        subgraph Ops [Seller Ops & Settlement]
            UC04(04: Quản lý Tồn Kho)
            UC05(05: Rút tiền Ví Escrow)
            UC11(11: Khởi tạo Matrix SKU)
            UC12(12: Fulfillment API)
            UC18(18: Lập lịch FlashSale)
            UC19(19: Bulk Print Orders)
        end
        subgraph Auto [System/Background]
            UC13(13: Auto Hủy Đơn 15p)
            UC14(14: Auto Hoàn tất 7 Ngày)
            UC20(20: Affiliate Tracking)
            UC21(21: Đối soát COD CSV)
            UC22(22: Risk/Fraud Engine)
        end
    end

    Buyer ---> IAM
    Buyer ---> Shop
    Buyer ---> Checkout_Post
    Seller ---> IAM
    Seller ---> Ops
    Seller ---> Checkout_Post
    Admin ---> IAM
    Admin ---> Auto
```

## 2. DFD Level 0 (Context Level Diagram)
Biểu diễn PomeloEC như một hộp đen duy nhất trao đổi Data với các Thực thể Ngoại vi.

```mermaid
flowchart TD
    %% External Entities
    B[Buyer]
    S[Seller]
    PG[Payment Gateway\nVNPay/MoMo]
    LP[Logistics Partner\nGHTK/ViettelPost]

    %% Main System (Level 0)
    Sys((0. PomeloEC\nPlatform))

    %% Flows
    B -- Order_Payload {Items, Address, Pmt_Method}\n& Account_Settings --> Sys
    Sys -- Product_Feed &\nTracking_Status_Data --> B

    S -- Variant_Data, KYC_Docs,\nPayout_Request --> Sys
    Sys -- Paid_Order_Record,\nEscrow_Funds, Analytics --> S

    Sys -- Payment_Link_Req_Payload\n{Amount, TxnRef} --> PG
    PG -- Webhook_Payload\n{Status, Signature} --> Sys

    Sys -- Fulfillment_Req_Payload\n{Address, Weight} --> LP
    LP -- Logistics_Status_Payload\n{Tracking_ID, Status} --> Sys
```

## 3. DFD Level 1 (Phân rã Hệ thống Tổng thể)
Mổ xẻ bên trong Hộp đen PomeloEC thành các hệ thống con lớn quản trị dòng dữ liệu.

```mermaid
flowchart TD
    %% External Entities
    Buyer[Buyer]
    Seller[Seller]
    PG[Payment Gateway]
    Logistics[Logistics]
    Clock[System Clock\n& CRON]

    %% Level 1 Processes
    P1((1. Account &\nSecurity))
    P2((2. Catalog &\nSearch Engine))
    P3((3. Checkout &\nTransaction))
    P4((4. Escrow &\nLedger))
    P5((5. Fulfillment &\nLogistics))
    P6((6. System &\nBackground Ops))

    %% Data Stores
    D1[(D1: User Store)]
    D2[(D2: Catalog Index)]
    D3[(D3: Transaction & Cart Store)]
    D4[(D4: Ledger Store)]

    %% Connections P1 (IAM)
    Buyer -- Login_Payload {Email, Password} --> P1
    Seller -- KYC_Data {Docs, CompanyInfo} --> P1
    P1 -- User_Profile, Session_Token --> D1

    %% Connections P2 (Catalog)
    Seller -- Variant_Data {SKU, Price, Attributes} --> P2
    P2 -- Product_Document --> D2
    Buyer -- Search_Params {Keyword, Filters} --> P2
    D2 -- Indexed_Hits --> P2
    P2 -- Recommended_Feed --> Buyer

    %% Connections P3 (Checkout UC03, UC06, UC07)
    Buyer -- Cart_Payload {Items, Vouchers, Address} --> P3
    P3 -- Token_Payload --> P1
    P1 -- Validation_Result_Data --> P3
    P3 -- Atomic_Lock_Request {SKU, Qty} --> D3
    P3 -- Payment_Link_Req_Payload {Amount, TxnRef} --> PG
    PG -- Webhook_Payload {TxnRef, Status, HMAC} --> P3
    P3 -- Order_Record {Status: PAID} --> D3

    %% Connections P4 (Finance/Escrow UC05, UC14, UC21)
    P3 -- Paid_Order_Record --> P4
    P4 -- Escrow_Hold_Record --> D4
    D1 -- Seller_Bank_Info --> P4
    Seller -- Payout_Request {Amount, Bank_ID} --> P4
    P4 -- Transfer_Instruction --> Seller
    P4 -- Deduct_Balance --> D4

    %% Connections P5 (Logistics UC12, UC19)
    P3 -- Paid_Order_Record --> P5
    D3 -- Order_Address_Detail --> P5
    P5 -- Fulfillment_Req_Payload {Sender, Receiver, Weight} --> Logistics
    Logistics -- Logistics_Status_Payload {Tracking_ID, Status} --> P5
    P5 -- Delivery_Completed_Record --> P4
    P5 -- Delivery_Notification_Data --> Buyer
    
    %% Connections P6 (Background Processing)
    Clock -- Time_Tick_Trigger --> P6
    P6 -- Status_Update_Record (Cancel/Complete) --> D3
    P6 -- Escrow_Release_Record --> D4
```

## 4. DFD Level 2 (Chi tiết Process P3: Checkout & Transaction)

Mổ xẻ bên trong Process `3.0 Checkout & Transaction` thành các quy trình con (Sub-processes) tuân thủ dữ liệu.

```mermaid
flowchart TD
    %% Entities
    Buyer[Buyer]
    PG[Payment Gateway\nVNPay/MoMo]
    P4((4. Escrow &\nLedger))
    P5((5. Fulfillment))

    %% Level 2 Processes for P3
    P3_1((3.1 Rule Engine &\nPricing))
    P3_2((3.2 Atomic\nInventory Lock))
    P3_3((3.3 Order &\nPayment Gen))
    P3_4((3.4 Webhook &\nIdempotency))

    %% Data Stores
    D3[(D3: Transaction\n& Cart Store)]

    %% Data Flow
    Buyer -- 1. Cart_Payload\n{Items, Vouchers, Address} --> P3_1
    P3_1 -- 2. Query_Voucher_Rules --> D3
    P3_1 -- 3. Validated_Items\n{Discounted_Price} --> P3_2
    
    P3_2 -- 4. Atomic_Lock_Request\n{SKU, Decrement_Qty} --> D3
    P3_2 -- 5. Locked_Items_Session\n(Temp Hold) --> P3_3
    
    P3_3 -- 6. Pending_Order_Record\n(Status: PENDING) --> D3
    P3_3 -- 7. Generate_URL_Request --> PG
    PG -- 8. Redirect_URL_Payload --> P3_3
    P3_3 -- 9. Payment_URL_Response --> Buyer

    PG -- 10. Webhook_Payload\n{TxnRef, HMAC} --> P3_4
    P3_4 -- 11. Idempotency_Check_Request --> D3
    P3_4 -- 12. Paid_Order_Update\n(Status: PAID) --> D3

    P3_4 -- 13. Paid_Order_Record --> P4
    P3_4 -- 14. Paid_Order_Record --> P5
```
