'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartItem } from './types';

interface CartStore extends Cart {
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const computeTotals = (items: CartItem[]) => ({
  totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
  totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
});

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      isOpen: false,

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === newItem.id);
          let updatedItems: CartItem[];

          if (existing) {
            updatedItems = state.items.map((i) =>
              i.id === newItem.id
                ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) }
                : i
            );
          } else {
            updatedItems = [
              ...state.items,
              { ...newItem, quantity: newItem.quantity ?? 1 },
            ];
          }

          return {
            items: updatedItems,
            ...computeTotals(updatedItems),
            isOpen: true,
          };
        }),

      removeItem: (id) =>
        set((state) => {
          const updatedItems = state.items.filter((i) => i.id !== id);
          return { items: updatedItems, ...computeTotals(updatedItems) };
        }),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const updatedItems = state.items.filter((i) => i.id !== id);
            return { items: updatedItems, ...computeTotals(updatedItems) };
          }
          const updatedItems = state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          );
          return { items: updatedItems, ...computeTotals(updatedItems) };
        }),

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'vibemarket-cart',
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalPrice: state.totalPrice,
      }),
    }
  )
);
