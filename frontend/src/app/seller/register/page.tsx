"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SellerRegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    identityCardUrl: "",
    businessLicenseUrl: "",
    taxCode: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      alert("Vui lòng đăng nhập trước khi đăng ký!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stores/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // For mock testing, we pass the user email as identifier if ID is missing
          body: JSON.stringify({
            email: session.user.email, // using email for lookup
            ...formData,
          }),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to register");
      }

      alert("Đăng ký thành công! Bạn sẽ được chuyển tới Dashboard.");
      router.push("/seller/dashboard");
    } catch (err) {
      alert(`Lỗi: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/50 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-40 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="glass-box p-10 max-w-xl w-full relative z-10">
        <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-emerald-600">
          Trở thành Nhà Bán Hàng
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          Bắt đầu kinh doanh trên PomeloEC ngay hôm nay.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">
              Tên Cửa Hàng *
            </label>
            <input
              type="text"
              className="glass-input px-4 py-3 text-lg"
              placeholder="Ví dụ: Pomelo Official Store"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">
              Link ảnh CCCD (Mặt trước & sau) *
            </label>
            <input
              type="url"
              className="glass-input px-4 py-3"
              placeholder="https://example.com/cccd.jpg"
              value={formData.identityCardUrl}
              onChange={(e) =>
                setFormData({ ...formData, identityCardUrl: e.target.value })
              }
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">
              Link ảnh Giấy Phép Kinh Doanh (Tùy chọn)
            </label>
            <input
              type="url"
              className="glass-input px-4 py-3"
              placeholder="https://example.com/gpkd.jpg"
              value={formData.businessLicenseUrl}
              onChange={(e) =>
                setFormData({ ...formData, businessLicenseUrl: e.target.value })
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-gray-700">
              Mã Số Thuế (Tùy chọn)
            </label>
            <input
              type="text"
              className="glass-input px-4 py-3"
              placeholder="Nhập mã số thuế doanh nghiệp / cá nhân"
              value={formData.taxCode}
              onChange={(e) =>
                setFormData({ ...formData, taxCode: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-glass px-6 py-4 mt-4 text-white font-bold text-lg rounded-xl transition-all shadow-xl disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #10b981 100%)",
            }}
          >
            {loading ? "Đang xử lý..." : "Gửi Hồ Sơ Đăng Ký"}
          </button>
        </form>
      </div>
    </div>
  );
}
