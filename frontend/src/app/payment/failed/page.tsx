"use client";

import React from "react";
import Link from "next/link";

export default function PaymentFailedPage() {
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
        <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
          <span className="text-5xl">❌</span>
        </div>

        <h1 className="text-3xl font-extrabold text-[#1f2937] mb-2">
          Thanh Toán Thất Bại
        </h1>
        <p className="text-gray-600 mb-8">
          Rất tiếc, quá trình thanh toán của bạn không thành công hoặc đã bị
          hủy. Vui lòng thử lại bằng phương thức thanh toán khác.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/checkout"
            className="btn-glass text-white px-6 py-3 rounded-full font-bold flex-1"
            style={{ background: "rgba(244, 63, 94, 0.9)" }}
          >
            Thử lại thanh toán
          </Link>
          <Link
            href="/"
            className="btn-glass bg-white/80 hover:bg-white text-[#1f2937] px-6 py-3 rounded-full font-bold flex-1"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
