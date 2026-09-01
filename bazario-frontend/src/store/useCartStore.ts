import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartEntry, Product } from '../types';

interface CartState {
  items: CartEntry[];
  addItem: (product: Product, quantite?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, quantite: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantite = 1) => {
        const existing = get().items.find((e) => e.product.id === product.id);
        if (existing) {
          set({ items: get().items.map((e) => e.product.id === product.id ? { ...e, quantite: e.quantite + quantite } : e) });
        } else {
          set({ items: [...get().items, { product, quantite }] });
        }
      },
      removeItem: (productId) => set({ items: get().items.filter((e) => e.product.id !== productId) }),
      updateQty: (productId, quantite) => {
        if (quantite <= 0) {
          get().removeItem(productId);
          return;
        }
        set({ items: get().items.map((e) => e.product.id === productId ? { ...e, quantite } : e) });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((s, e) => s + e.quantite, 0),
      totalPrice: () => get().items.reduce((s, e) => s + e.product.prix * e.quantite, 0),
    }),
    { name: 'bazario-cart' }
  )
);
