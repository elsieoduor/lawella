"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { CartItem, Product } from "./types"

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, size: string, qty?: number) => void
  removeItem: (id: number, size: string) => void
  updateQty: (id: number, size: string, qty: number) => void
  clearCart: () => void
  total: () => number
  count: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, size, qty = 1) => {
        const existing = get().items.find(
          (i) => i.id === product.id && i.selectedSize === size
        )
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === product.id && i.selectedSize === size
                ? { ...i, qty: i.qty + qty }
                : i
            ),
          }))
        } else {
          set((s) => ({
            items: [...s.items, { ...product, qty, selectedSize: size }],
          }))
        }
      },

      removeItem: (id, size) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.id === id && i.selectedSize === size)
          ),
        })),

      updateQty: (id, size, qty) => {
        if (qty < 1) {
          get().removeItem(id, size)
          return
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id && i.selectedSize === size ? { ...i, qty } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      count: () =>
        get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: "lawella-cart" }
  )
)
