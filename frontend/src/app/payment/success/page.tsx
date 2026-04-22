"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import useCartStore from "@/hooks/useCartStore";

export default function PaymentSuccessPage() {
  const clearCartLocally = useCartStore((state) => state.clearCartLocally);

  useEffect(() => {
    // Clear cart locally since order was successful
    clearCartLocally();
  }, [clearCartLocally]);

  return (
    <div className="min-h-screen bg-[#E6EFED] flex items-center justify-center p-4">
      {/* Aurora Mesh Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-50"
        style={{
          background: "var(--aurora-bg-mesh)",
        }}
      />

      <div className="glass-box relative z-10 max-w-lg w-full text-center py-12 px-6 flex flex-col items-center">
        <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <span className="text-5xl">🎉</span>
        </div>

        <h1 className="text-3xl font-extrabold text-[#1f2937] mb-2">
          Thanh Toán Thành Công
        </h1>
        <p className="text-gray-600 mb-8">
          Cảm ơn bạn đã mua hàng tại PomeloEC. Đơn hàng của bạn đang được xử lý
          và sẽ sớm giao đến tay bạn.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/orders"
            className="btn-glass bg-white/80 hover:bg-white text-[#1f2937] px-6 py-3 rounded-full font-bold flex-1"
          >
            Quản lý đơn hàng
          </Link>
          <Link
            href="/"
            className="btn-glass text-white px-6 py-3 rounded-full font-bold flex-1"
            style={{ background: "rgba(16, 185, 129, 0.9)" }}
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}
