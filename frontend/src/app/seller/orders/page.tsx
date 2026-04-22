"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Order {
  id: string;
  orderId: string;
  date: string;
  productName: string;
  quantity: string;
  totalAmount: number;
  paymentMethod: string;
  shippingProvider: string;
  shippingAddress: string;
  status: string;
}

export default function SellerOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    // In a real app, we would fetch from /orders/store/:storeId
    // For this demo, since we don't have a specific endpoint for fetching store suborders,
    // we will use mock data that looks like the real data structure.
    // In production, you would fetch the SubOrders for the current seller's store.
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Mocking an API call delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setOrders([
          {
            id: "so-1234",
            orderId: "ord-9982",
            date: "2 Phút trước",
            productName: "Dâu tây Mộc Châu túi 500g",
            quantity: "x1 Hộp nhựa",
            totalAmount: 150000,
            paymentMethod: "COD",
            shippingProvider: "GHTK",
            shippingAddress: "Quận 1, TP.HCM",
            status: "PAID",
          },
          {
            id: "so-5678",
            orderId: "ord-9983",
            date: "5 Phút trước",
            productName: "Bắp cải tím Đà Lạt VietGAP",
            quantity: "x2 Bắp 1kg",
            totalAmount: 70000,
            paymentMethod: "VNPay",
            shippingProvider: "ViettelPost",
            shippingAddress: "Thủ Đức, TP.HCM",
            status: "PAID",
          },
          {
            id: "so-9012",
            orderId: "ord-9984",
            date: "10 Phút trước",
            productName: "Sữa chua vị Dâu tây",
            quantity: "x4 Hộp 4 hũ",
            totalAmount: 128000,
            paymentMethod: "COD",
            shippingProvider: "GHTK",
            shippingAddress: "Bình Thạnh, TP.HCM",
            status: "SHIPPED",
          },
        ]);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchOrders();
    }
  }, [session]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectOrder = (id: string) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((orderId) => orderId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const handleBulkPrint = async () => {
    if (selectedOrders.length === 0) {
      alert("Vui lòng chọn ít nhất một đơn hàng để in.");
      return;
    }

    setIsPrinting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/fulfillment/bulk-print`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderIds: selectedOrders }),
        },
      );

      if (!response.ok) {
        throw new Error("Lỗi khi in đơn hàng");
      }

      // Handle PDF download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk-orders-${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi xảy ra khi in đơn hàng.");
    } finally {
      setIsPrinting(false);
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
            Xử lý Đơn Hàng Hàng Loạt
          </h1>
          <p className="text-gray-500 font-medium">
            Hôm nay:{" "}
            <span className="text-ruby font-bold">
              {orders.filter((o) => o.status === "PAID").length} đơn chờ in mã
            </span>
          </p>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <div className="glass-box p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200 flex justify-between items-center">
        <div>
          <span className="text-lg font-bold text-emerald-800">
            Đã chọn {selectedOrders.length} đơn hàng
          </span>
          <span className="ml-2 text-sm font-medium text-emerald-600 opacity-80">
            (sẵn sàng đẩy qua ĐVVC)
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setSelectedOrders([])}
            disabled={selectedOrders.length === 0}
            className="px-4 py-2 rounded-md font-semibold text-emerald-700 bg-white/50 border border-emerald-200 hover:bg-white transition-colors disabled:opacity-50"
          >
            Hủy Chọn
          </button>
          <button
            onClick={handleBulkPrint}
            disabled={selectedOrders.length === 0 || isPrinting}
            className="px-6 py-2 rounded-md font-bold text-white bg-matcha hover:bg-emerald-600 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isPrinting ? (
              "Đang xử lý..."
            ) : (
              <>
                <span>🖨️</span> In Mã Vạch
              </>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-box p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 w-12 text-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-matcha rounded cursor-pointer"
                    onChange={handleSelectAll}
                    checked={
                      orders.length > 0 &&
                      selectedOrders.length === orders.length
                    }
                  />
                </th>
                <th className="px-6 py-4 font-semibold w-1/5">Mã Đơn (#ID)</th>
                <th className="px-6 py-4 font-semibold w-1/4">Sản phẩm</th>
                <th className="px-6 py-4 font-semibold">Thành Tiền</th>
                <th className="px-6 py-4 font-semibold w-1/5">
                  Bên Vận Chuyển
                </th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Không có đơn hàng nào.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`transition-colors ${
                      selectedOrders.includes(order.id)
                        ? "bg-emerald-50/50"
                        : "hover:bg-gray-50/30"
                    }`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-matcha rounded cursor-pointer"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        #{order.orderId.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800 line-clamp-1">
                        {order.productName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-ruby">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(order.totalAmount)}
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-1">
                        {order.paymentMethod}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">
                        {order.shippingProvider}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {order.shippingAddress}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                          order.status === "PAID"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {order.status === "PAID" ? "Chờ In Mã" : "Đã Giao ĐVVC"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
