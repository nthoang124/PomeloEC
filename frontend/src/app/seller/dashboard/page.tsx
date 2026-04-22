"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";

export default function SellerDashboardPage() {
  const { data: session } = useSession();

  // MOCK DATA for Demonstration
  const [wallet] = useState({
    available: 1500000,
    escrow: 3500000,
  });

  const [orders, setOrders] = useState([
    {
      id: "so-1234",
      customer: "Nguyễn Văn A",
      total: 450000,
      status: "PAID",
      trackingNumber: null,
      date: "2026-04-22 09:30",
    },
    {
      id: "so-5678",
      customer: "Trần Thị B",
      total: 1250000,
      status: "SHIPPED",
      trackingNumber: "GHTK-9X8Y7Z",
      date: "2026-04-21 15:45",
    },
  ]);

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleShipOrder = async (subOrderId: string) => {
    setLoadingId(subOrderId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/shipping/create-label/${subOrderId}`,
        {
          method: "POST",
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Lỗi khi tạo mã vận đơn");
      }

      const data = await res.json();

      // Update local state
      setOrders(
        orders.map((o) =>
          o.id === subOrderId
            ? { ...o, status: "SHIPPED", trackingNumber: data.trackingCode }
            : o,
        ),
      );

      alert(
        `Đã chuẩn bị hàng và tạo mã vận đơn thành công: ${data.trackingCode}`,
      );
    } catch (error) {
      alert(`Lỗi: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoadingId(null);
    }
  };

  if (!session) {
    return (
      <div className="p-8 text-center font-semibold text-lg text-red-500">
        Vui lòng đăng nhập để xem trang này.
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Seller Dashboard
          </h1>
          <p className="text-gray-500 font-medium">
            Quản lý cửa hàng, dòng tiền và đơn hàng vận chuyển
          </p>
        </div>
      </div>

      {/* WALLETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-box p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
          <h3 className="text-emerald-800 font-bold mb-1">
            Số Dư Khả Dụng (Cho phép rút)
          </h3>
          <p className="text-4xl font-extrabold text-emerald-600">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(wallet.available)}
          </p>
        </div>
        <div className="glass-box p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
          <h3 className="text-amber-800 font-bold mb-1">
            Số Dư Tạm Giữ (Đang giao hàng)
          </h3>
          <p className="text-4xl font-extrabold text-amber-600">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(wallet.escrow)}
          </p>
        </div>
      </div>

      {/* ORDERS */}
      <div className="glass-box p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            Đơn hàng cần xử lý
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm">
                <th className="px-6 py-4 font-semibold">Mã Đơn</th>
                <th className="px-6 py-4 font-semibold">Khách Hàng</th>
                <th className="px-6 py-4 font-semibold">Tổng Tiền</th>
                <th className="px-6 py-4 font-semibold">Trạng Thái</th>
                <th className="px-6 py-4 font-semibold">Vận Đơn</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50/30 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{order.customer}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(order.total)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === "PAID"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">
                    {order.trackingNumber || "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.status === "PAID" && (
                      <button
                        onClick={() => handleShipOrder(order.id)}
                        disabled={loadingId === order.id}
                        className="btn-glass px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50"
                      >
                        {loadingId === order.id
                          ? "Đang xử lý..."
                          : "Chuẩn bị hàng & In đơn"}
                      </button>
                    )}
                    {order.status === "SHIPPED" && (
                      <span className="text-sm font-medium text-gray-400">
                        Đang giao
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
