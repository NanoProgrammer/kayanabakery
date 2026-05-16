"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  appliedCouponCode: string | null;
  pointsToRedeem: number;

  setOpen: (open: boolean) => void;
  setCoupon: (code: string | null) => void;
  setAppliedCoupon: (code: string | null) => void;
  setPointsToRedeem: (points: number) => void;

  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  replaceItems: (items: CartItem[]) => void;
  clear: () => void;
  clearCart: () => void;
  getItem: (productId: string) => CartItem | undefined;
  getQuantity: (productId: string) => number;
  getSubtotal: () => number;
  getItemCount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCouponCode: null,
      pointsToRedeem: 0,

      setOpen: (open) => set({ isOpen: open }),
      setCoupon: (code) => set({ appliedCouponCode: code }),
      setAppliedCoupon: (code) => set({ appliedCouponCode: code }),
      setPointsToRedeem: (points) =>
        set({ pointsToRedeem: Math.max(0, Math.floor(points)) }),

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      setQuantity: (productId, quantity) => {
        get().updateQuantity(productId, quantity);
      },

      increment: (productId) => {
        const current = get().getQuantity(productId);
        get().updateQuantity(productId, current + 1);
      },

      decrement: (productId) => {
        const current = get().getQuantity(productId);
        get().updateQuantity(productId, current - 1);
      },

      replaceItems: (items) => set({ items }),

      clear: () =>
        set({ items: [], appliedCouponCode: null, pointsToRedeem: 0 }),

      clearCart: () =>
        set({ items: [], appliedCouponCode: null, pointsToRedeem: 0 }),

      getItem: (productId) =>
        get().items.find((i) => i.productId === productId),

      getQuantity: (productId) =>
        get().items.find((i) => i.productId === productId)?.quantity ?? 0,

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "karyana-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        appliedCouponCode: state.appliedCouponCode,
        pointsToRedeem: state.pointsToRedeem,
      }),
    }
  )
);
