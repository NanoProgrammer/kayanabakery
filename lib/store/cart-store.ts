"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem } from "@/types";
import { trackEvent } from "@/lib/analytics/gtag";
import { cartLineId } from "@/lib/products/options";

/**
 * What a line in the cart is.
 *
 * Everything used to be keyed by product id, which is right until the same
 * cake can be ordered in two sizes: adding a 10" after a 6" bumped the 6" to
 * quantity two and charged the wrong price for both. A product with no
 * choices still answers to its plain id, so every saved cart and every caller
 * that passes a product id keeps working.
 */
function lineId(item: { productId: string; options?: Record<string, string> }): string {
  return cartLineId(item.productId, item.options);
}

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
            (i) => lineId(i) === lineId(item)
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                lineId(i) === lineId(item)
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });

        trackEvent("add_to_cart", {
          currency: "CAD",
          value: item.price * quantity,
          items: [
            {
              item_id: item.productId,
              item_name: item.name,
              price: item.price,
              quantity,
            },
          ],
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => lineId(i) !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            lineId(i) === productId ? { ...i, quantity } : i
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
        get().items.find((i) => lineId(i) === productId),

      getQuantity: (productId) =>
        get().items.find((i) => lineId(i) === productId)?.quantity ?? 0,

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
