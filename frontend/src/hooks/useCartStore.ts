import { create } from "zustand";
import { fetchApi } from "@/lib/api";

export interface CartItemPreview {
  id: string; // Tạm thời ánh xạ variantId vào id
  storeId: string;
  name: string;
  price: number;
  qty: number;
}

export interface StoreCart {
  storeId: string;
  items: CartItemPreview[];
}

interface CartState {
  isOpen: boolean;
  storeCarts: StoreCart[];
  isLoading: boolean;
  error: string | null;
  toggleCartDrawer: (open: boolean) => void;
  fetchCart: (token: string) => Promise<void>;
  addItem: (
    token: string,
    storeId: string,
    variantId: string,
    qty: number,
  ) => Promise<void>;
  removeItem: (
    token: string,
    storeId: string,
    variantId: string,
  ) => Promise<void>;
  clearCartLocally: () => void;
}

const useCartStore = create<CartState>((set, get) => ({
  isOpen: false,
  storeCarts: [],
  isLoading: false,
  error: null,

  toggleCartDrawer: (open) => set({ isOpen: open }),

  fetchCart: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      // API Backend GET /cart trả về Record<storeId, Record<variantId, quantity>>
      const data = await fetchApi<Record<string, Record<string, number>>>(
        "/cart",
        { token },
      );

      // Chuyển đổi payload backend sang cấu trúc StoreCart[]
      const formattedCarts: StoreCart[] = [];
      for (const [storeId, itemsMap] of Object.entries(data)) {
        const items: CartItemPreview[] = [];
        for (const [variantId, qty] of Object.entries(itemsMap)) {
          // Ghi chú: Cần API /cart trả về thông tin chi tiết (name, price) hoặc phải gọi thêm API.
          // Tạm thời mock data hoặc dùng id hiển thị.
          // Nếu backend chưa hỗ trợ chi tiết, ở đây ta render tạm theo ID.
          items.push({
            id: variantId,
            storeId,
            name: `Sản phẩm ${variantId.substring(0, 8)}`, // Mock name
            price: 10.0, // Mock price
            qty: Number(qty),
          });
        }
        if (items.length > 0) {
          formattedCarts.push({ storeId, items });
        }
      }
      set({ storeCarts: formattedCarts, isLoading: false });
    } catch (error: unknown) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addItem: async (
    token: string,
    storeId: string,
    variantId: string,
    qty: number,
  ) => {
    set({ isLoading: true, error: null });
    try {
      await fetchApi("/cart/items", {
        method: "POST",
        token,
        body: JSON.stringify({ storeId, variantId, quantity: qty }),
      });
      // Gọi lại fetchCart để update state
      await get().fetchCart(token);
      set({ isOpen: true }); // Mở giỏ hàng khi thêm thành công
    } catch (error: unknown) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  removeItem: async (token: string, storeId: string, variantId: string) => {
    set({ isLoading: true, error: null });
    try {
      await fetchApi(`/cart/items/${storeId}/${variantId}`, {
        method: "DELETE",
        token,
      });
      await get().fetchCart(token);
    } catch (error: unknown) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  clearCartLocally: () => set({ storeCarts: [] }),
}));

export default useCartStore;
