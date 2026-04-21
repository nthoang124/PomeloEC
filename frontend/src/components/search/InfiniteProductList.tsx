"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShoppingCart } from "lucide-react";
import useCartStore from "@/hooks/useCartStore";

interface ProductHit {
  id: string;
  name: string;
  description: string;
  base_price: number;
}

export default function InfiniteProductList({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const [items, setItems] = useState<ProductHit[]>([]);
  const [, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerTarget = useRef(null);

  // Zustand Store action
  const { toggleCartDrawer, addItemPreview } = useCartStore();

  const fetchItems = useCallback(async (p: number, q: string) => {
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/search?q=${q}&page=${p}&limit=10`,
      );
      const data = await res.json();

      if (data.items.length === 0) {
        setHasMore(false);
      } else {
        setItems((prev) => (p === 1 ? data.items : [...prev, ...data.items]));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset when query changes
  useEffect(() => {
    // Avoid sync setState by wrapping in a promise or just ignoring the strict rule
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems([]);

    setPage(1);

    setHasMore(true);
    fetchItems(1, initialQuery).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  // Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => {
            const next = prev + 1;
            fetchItems(next, initialQuery).catch(console.error);
            return next;
          });
        }
      },
      { threshold: 0.5 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading]);

  const handleAddToCart = (item: ProductHit) => {
    // 1. Add item to global client store visually
    addItemPreview({
      id: item.id,
      name: item.name,
      price: item.base_price,
      qty: 1,
    });
    // 2. Open drawer to wow the user
    toggleCartDrawer(true);
  };

  return (
    <>
      <div className="flex justify-between items-center bg-white/40 backdrop-blur-md p-3 px-4 rounded-xl border border-white/50 mb-5">
        <div>
          <span className="font-bold">{items.length}+</span> kết quả cho &quot;
          {initialQuery}&quot;
        </div>
        <select className="bg-transparent font-semibold border-none cursor-pointer outline-none">
          <option>Bán chạy nhất</option>
          <option>Giá thấp đến cao</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="aurora-card pink group relative overflow-hidden bg-white/60 hover:bg-white transition-all backdrop-blur-sm border border-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
          >
            <div className="text-4xl text-center py-6 mb-2">🍉</div>
            <div>
              <h3 className="font-bold text-sm mb-2 h-10 overflow-hidden line-clamp-2 leading-tight group-hover:text-pink-600 transition-colors">
                {item.name}
              </h3>
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-pink-500">
                  ${item.base_price}
                </span>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="bg-pink-100 hover:bg-pink-200 text-pink-600 p-2 rounded-full transition-colors"
                >
                  <ShoppingCart size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-6 font-semibold text-gray-500 animate-pulse">
          Đang tải cấu trúc dữ liệu...
        </div>
      )}

      {/* Invisible element to trigger scroll */}
      <div ref={observerTarget} className="h-4"></div>
    </>
  );
}
