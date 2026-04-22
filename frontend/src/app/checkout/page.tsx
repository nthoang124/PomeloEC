"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useCartStore from "@/hooks/useCartStore";
import { fetchApi } from "@/lib/api";
import {
  LocationCombobox,
  LocationData,
} from "@/components/checkout/LocationCombobox";

export default function CheckoutPage() {
  const router = useRouter();
  const { storeCarts, fetchCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"VNPAY" | "COD">("VNPAY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  // Hardcode token tạm thời cho mục đích test checkout
  // Trong thực tế sẽ lấy từ Auth Provider
  const TEMP_TEST_TOKEN = "test-token";

  useEffect(() => {
    // Nếu chưa load giỏ hàng, tải giỏ hàng
    if (storeCarts.length === 0) {
      fetchCart(TEMP_TEST_TOKEN);
    }
  }, [storeCarts.length, fetchCart]);

  // Tính tổng tiền
  const totalItems = storeCarts.reduce(
    (acc, store) => acc + store.items.reduce((sum, item) => sum + item.qty, 0),
    0,
  );
  const totalAmount = storeCarts.reduce(
    (acc, store) =>
      acc + store.items.reduce((sum, item) => sum + item.price * item.qty, 0),
    0,
  );

  const shippingFee = totalItems > 0 ? 25000 : 0;
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = Math.max(0, totalAmount + shippingFee - discountAmount);

  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setIsApplyingVoucher(true);
    try {
      const response = await fetchApi<{ discountAmount: number }>(
        "/checkout/validate-voucher",
        {
          method: "POST",
          token: TEMP_TEST_TOKEN,
          body: JSON.stringify({
            voucherCode: voucherInput.trim(),
            totalAmount: totalAmount,
          }),
        },
      );

      setAppliedVoucher({
        code: voucherInput.trim(),
        discountAmount: response.discountAmount,
      });
      alert(
        `Áp dụng mã giảm giá thành công! Bạn được giảm ${response.discountAmount.toLocaleString("vi-VN")}₫`,
      );
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Mã giảm giá không hợp lệ";
      alert(msg);
      setAppliedVoucher(null);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleCheckout = async () => {
    if (totalItems === 0) {
      alert("Giỏ hàng của bạn đang trống!");
      return;
    }

    setIsProcessing(true);
    try {
      // Thu thập items
      const items = storeCarts.flatMap((store) =>
        store.items.map((item) => ({
          variantId: item.id,
          quantity: item.qty,
          storeId: item.storeId,
        })),
      );

      const payload: Record<string, unknown> = {
        items,
        paymentMethod,
        shippingAddress: location
          ? `${location.wardName}, ${location.districtName}, ${location.provinceName}`
          : "Chưa chọn địa chỉ",
      };

      if (appliedVoucher) {
        payload.voucherCode = appliedVoucher.code;
      }

      const response = await fetchApi<{ paymentUrl?: string }>("/checkout", {
        method: "POST",
        token: TEMP_TEST_TOKEN,
        body: JSON.stringify(payload),
      });

      if (paymentMethod === "VNPAY" && response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        router.push("/payment/success");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      const msg =
        error instanceof Error ? error.message : "Đã xảy ra lỗi khi đặt hàng.";
      alert(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E6EFED] pb-20 relative overflow-hidden text-[#1f2937]">
      {/* Aurora Mesh Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-50"
        style={{
          background: "var(--aurora-bg-mesh)",
          backgroundAttachment: "fixed",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto pt-8 px-4 sm:px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <span
              className="text-4xl"
              style={{ filter: "hue-rotate(120deg) brightness(1.2)" }}
            >
              🍉
            </span>
            PomeloEC Checkout
          </h1>
          <p className="text-gray-600 font-semibold mt-1">
            Thanh toán An toàn 🔒
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Thông tin & Sản phẩm */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Địa chỉ giao hàng */}
            <section className="glass-box">
              <h2 className="text-lg font-bold mb-4 pb-2 border-b border-dashed border-white/60">
                📍 Địa chỉ giao hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    defaultValue="Nguyễn Văn A"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-xs font-bold block mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    className="glass-input"
                    defaultValue="0987654321"
                    readOnly
                  />
                </div>
              </div>

              <div className="mb-4">
                <LocationCombobox onLocationChange={setLocation} />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">
                  Địa chỉ chi tiết (Số nhà, tên đường)
                </label>
                <input
                  type="text"
                  className="glass-input"
                  defaultValue="Toà nhà Bitexco, Bến Nghé"
                />
              </div>
            </section>

            {/* Danh sách sản phẩm */}
            <section className="glass-box">
              <h2 className="text-lg font-bold mb-4 pb-2 border-b border-dashed border-white/60">
                📦 Sản phẩm ({totalItems})
              </h2>
              <div className="flex flex-col gap-4">
                {storeCarts.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Giỏ hàng trống.
                  </p>
                ) : (
                  storeCarts.map((store) => (
                    <div
                      key={store.storeId}
                      className="mb-2 border border-white/30 rounded-lg overflow-hidden bg-white/20"
                    >
                      <div className="bg-white/40 px-3 py-2 text-sm font-bold border-b border-white/30">
                        🛒 Cửa hàng: {store.storeId.substring(0, 8)}...
                      </div>
                      <div className="p-3 flex flex-col gap-3">
                        {store.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 bg-white/50 p-3 rounded-md"
                          >
                            <div className="flex-1">
                              <h3 className="text-sm font-bold">{item.name}</h3>
                              <p className="text-xs text-gray-600 mt-1">
                                ID: {item.id}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">
                                {item.price.toLocaleString("vi-VN")}₫
                              </div>
                              <div className="text-xs text-gray-600">
                                SL: {item.qty}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Phương thức thanh toán */}
            <section className="glass-box">
              <h2 className="text-lg font-bold mb-4 pb-2 border-b border-dashed border-white/60">
                💳 Phương thức Thanh toán
              </h2>
              <div className="flex flex-col gap-3">
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "VNPAY"
                      ? "bg-white/80 border-[#10B981] shadow-sm transform -translate-y-0.5"
                      : "bg-white/40 border-white/80 hover:-translate-y-0.5 hover:bg-white/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={paymentMethod === "VNPAY"}
                    onChange={() => setPaymentMethod("VNPAY")}
                    className="accent-[#10B981] scale-125"
                  />
                  <span className="text-3xl">🏦</span>
                  <div>
                    <div className="font-bold text-sm">
                      Cổng thanh toán VNPay
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Thanh toán an toàn qua VNPAY.
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "COD"
                      ? "bg-white/80 border-[#10B981] shadow-sm transform -translate-y-0.5"
                      : "bg-white/40 border-white/80 hover:-translate-y-0.5 hover:bg-white/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="accent-[#10B981] scale-125"
                  />
                  <span className="text-3xl">💵</span>
                  <div>
                    <div className="font-bold text-sm">
                      Thanh toán khi nhận hàng (COD)
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Phí thu hộ 0đ
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Cột phải: Summary */}
          <div>
            <div className="glass-box sticky top-6">
              <h2 className="text-xl font-extrabold mb-4">Tổng Đơn</h2>

              <div className="mb-6">
                <input
                  type="text"
                  className="glass-input mb-2 uppercase"
                  placeholder="Mã giảm giá (ví dụ: GIAM50K)"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  disabled={isApplyingVoucher || !!appliedVoucher}
                />
                {!appliedVoucher ? (
                  <button
                    className="btn-glass py-2 text-sm w-full"
                    onClick={handleApplyVoucher}
                    disabled={isApplyingVoucher || !voucherInput.trim()}
                  >
                    {isApplyingVoucher ? "Đang áp dụng..." : "Áp dụng"}
                  </button>
                ) : (
                  <button
                    className="btn-glass py-2 text-sm w-full bg-red-500/20 text-red-600 border-red-500/30 hover:bg-red-500/30"
                    onClick={() => {
                      setAppliedVoucher(null);
                      setVoucherInput("");
                    }}
                  >
                    Huỷ mã giảm giá
                  </button>
                )}
              </div>

              <div className="flex justify-between mb-3 text-sm">
                <span>Tạm tính ({totalItems} sản phẩm)</span>
                <span className="font-bold">
                  {totalAmount.toLocaleString("vi-VN")}₫
                </span>
              </div>
              <div className="flex justify-between mb-3 text-sm">
                <span>Phí vận chuyển</span>
                <span className="font-bold">
                  {shippingFee.toLocaleString("vi-VN")}₫
                </span>
              </div>
              {appliedVoucher && (
                <div className="flex justify-between mb-3 text-sm text-[#10B981]">
                  <span>Giảm giá (Voucher)</span>
                  <span className="font-bold">
                    -{discountAmount.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              )}

              <div className="flex justify-between mt-4 pt-4 border-t border-dashed border-black/10 font-extrabold text-xl">
                <span>Tổng cộng</span>
                <span className="text-[#F43F5E]">
                  {finalTotal.toLocaleString("vi-VN")}₫
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-right">
                (Đã bao gồm VAT)
              </p>

              <button
                onClick={handleCheckout}
                disabled={isProcessing || totalItems === 0}
                className="w-full mt-6 py-4 px-4 rounded-full font-bold text-lg text-white shadow-lg transition-all"
                style={{
                  background: isProcessing
                    ? "#9CA3AF"
                    : "rgba(16, 185, 129, 0.9)",
                  transform: isProcessing ? "none" : undefined,
                  cursor:
                    isProcessing || totalItems === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isProcessing ? "Đang xử lý..." : "ĐẶT HÀNG NGAY"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
