---
id: DIAG-DFD
type: design
project: PomeloEC
owner: "@system-analyst"
---

# Sơ đồ Data Flow Diagram (DFD) & Use Case Mapping

Tài liệu này cung cấp biểu diễn cho 100% Use Case của PomeloEC dưới góc nhìn Dòng chảy Dữ Liệu (Phân rã chức năng).

## 1. Biểu diễn tổng quan Use Case (22 Usecases)
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
            UC01(01: Tìm & Lọc Sản phẩm)
            UC02(02: Quản lý Giỏ hàng)
            UC06(06: Voucher Stacking)
            UC17(17: Gợi ý Cá nhân hóa)
        end
        subgraph Checkout_Post [Order & Post-Purchase]
            UC03(03: FlashSale Checkout)
            UC07(07: Webhook Thanh toán)
            UC08(08: Track GPS Vận chuyển)
            UC09(09: Tạm giữ/Hoàn tiền RMA)
            UC10(10: Đánh giá Video S3)
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
    B -- Request: Info, Order_Data, Money --> Sys
    Sys -- Response: UI, Product_List, Tracking --> B

    S -- Request: Item_Data, KYC_Docs, Payout_Req --> Sys
    Sys -- Response: Order_Push, Escrow_Money, Analytics --> S

    Sys -- Push: Create_Payment_Link --> PG
    PG -- Push: Webhook_Status --> Sys

    Sys -- Request: Fee, Create_Ticket --> LP
    LP -- Push: Webhook_Tracking_Status --> Sys
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

    %% Level 1 Processes
    P1((1. Account &\nSecurity))
    P2((2. Catalog &\nSearch Engine))
    P3((3. Checkout &\nTransaction))
    P4((4. Escrow &\nLedger))
    P5((5. Fulfillment &\nLogistics))

    %% Data Stores
    D1[(D1: User DB)]
    D2[(D2: Elasticsearch)]
    D3[(D3: Order DB & Redis)]
    D4[(D4: Ledger DB)]

    %% Connections P1 (IAM)
    Buyer -- Credentials --> P1
    Seller -- KYC/Credentials --> P1
    P1 -- Read/Write --> D1

    %% Connections P2 (Catalog)
    Seller -- SKU/Price --> P2
    P2 -- Upsert Sync --> D2
    Buyer -- Search_Query --> P2
    D2 -- Hits --> P2
    P2 -- Recommended_Products --> Buyer

    %% Connections P3 (Checkout UC03, UC06, UC07)
    Buyer -- Checkout_Payload --> P3
    P3 -- Check_Auth --> P1
    P3 -- Lock_Inventory --> D3
    P3 -- Generate_URL --> PG
    PG -- Webhook_Success --> P3
    P3 -- Write_Paid_Order --> D3

    %% Connections P4 (Finance/Escrow UC05, UC14, UC21)
    P3 -- Event: Order_Paid --> P4
    P4 -- Hold_Escrow --> D4
    Seller -- Request_Payout --> P4
    P4 -- Transfer_Fund --> Seller
    P4 -- Update_Balance --> D4

    %% Connections P5 (Logistics UC12, UC19)
    P3 -- Event: Order_Ready --> P5
    P5 -- Create_Label --> Logistics
    Logistics -- Sync_Delivery --> P5
    P5 -- Notify_Delivery_Event --> P4
    P5 -- Notify_Buyer --> Buyer
```
