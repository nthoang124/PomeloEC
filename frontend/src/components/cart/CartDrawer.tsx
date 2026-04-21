"use client";

import { X, ShoppingBag } from "lucide-react";
import useCartStore from "@/hooks/useCartStore";

export default function CartDrawer() {
  const { isOpen, toggleCartDrawer, items } = useCartStore();

  if (!isOpen) return null;

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );

  return (
    <>
      {/* Overlay Backdrop Blur */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={() => toggleCartDrawer(false)}
      ></div>

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[400px] max-w-full bg-white/70 backdrop-blur-2xl z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-white/50">
        {/* Header */}
        <div className="p-5 border-b border-white/30 flex justify-between items-center bg-white/40">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag /> Giỏ Hàng Của Bạn
          </h2>
          <button
            onClick={() => toggleCartDrawer(false)}
            className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <div className="text-6xl mb-4">🛒</div>
              Giỏ hàng đang trống
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-white/60 border border-white rounded-xl shadow-sm items-center hover:bg-white/80 transition-colors"
              >
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-3xl shadow-sm">
                  🍉
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="text-pink-500 font-extrabold mt-1">
                    ${item.price}
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                  <span className="font-bold cursor-pointer hover:text-pink-500">
                    -
                  </span>
                  <span className="font-semibold text-sm">{item.qty}</span>
                  <span className="font-bold cursor-pointer hover:text-pink-500">
                    +
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        {items.length > 0 && (
          <div className="p-5 bg-white/80 border-t border-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-4 text-lg">
              <span className="text-gray-600 font-semibold">
                Tổng tạm tính:
              </span>
              <span className="font-extrabold text-2xl text-pink-600">
                ${totalAmount.toFixed(2)}
              </span>
            </div>
            <button
              className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              THANH TOÁN NGAY
            </button>
          </div>
        )}
      </div>
    </>
  );
}
