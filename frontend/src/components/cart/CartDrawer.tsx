"use client";

import { useEffect } from "react";
import { X, ShoppingBag, Trash2 } from "lucide-react";
import useCartStore from "@/hooks/useCartStore";
import { useSession } from "next-auth/react";

export default function CartDrawer() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken as
    | string
    | undefined;

  const {
    isOpen,
    toggleCartDrawer,
    storeCarts,
    fetchCart,
    removeItem,
    isLoading,
  } = useCartStore();

  useEffect(() => {
    if (isOpen && token) {
      fetchCart(token);
    }
  }, [isOpen, token, fetchCart]);

  if (!isOpen) return null;

  // Tính tổng tiền dựa trên các store
  const totalAmount = storeCarts.reduce(
    (sum, store) =>
      sum +
      store.items.reduce(
        (storeSum, item) => storeSum + item.price * item.qty,
        0,
      ),
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
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading ? (
            <div className="text-center text-gray-500 mt-10">
              Đang tải giỏ hàng...
            </div>
          ) : storeCarts.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <div className="text-6xl mb-4">🛒</div>
              Giỏ hàng đang trống
            </div>
          ) : (
            storeCarts.map((store) => (
              <div key={store.storeId} className="space-y-3">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <span>🏪</span> Cửa hàng {store.storeId.substring(0, 8)}
                </h3>
                {store.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-white/60 border border-white rounded-xl shadow-sm items-center hover:bg-white/80 transition-colors"
                  >
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-3xl shadow-sm">
                      🍉
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm line-clamp-2">
                        {item.name}
                      </h4>
                      <div className="text-pink-500 font-extrabold mt-1">
                        ${item.price}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                      <span className="font-semibold text-sm">
                        SL: {item.qty}
                      </span>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-600 p-2"
                      onClick={() =>
                        token && removeItem(token, store.storeId, item.id)
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        {storeCarts.length > 0 && (
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
