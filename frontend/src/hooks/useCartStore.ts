import { create } from "zustand";

interface CartItemPreview {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CartState {
  isOpen: boolean;
  items: CartItemPreview[];
  toggleCartDrawer: (open: boolean) => void;
  addItemPreview: (item: CartItemPreview) => void;
  clearPreview: () => void;
}

const useCartStore = create<CartState>((set) => ({
  isOpen: false,
  items: [],
  toggleCartDrawer: (open) => set({ isOpen: open }),
  addItemPreview: (newItem) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === newItem.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === newItem.id ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      return { items: [...state.items, newItem] };
    }),
  clearPreview: () => set({ items: [] }),
}));

export default useCartStore;
