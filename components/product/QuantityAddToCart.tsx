"use client";

import { useCartStore } from "@/lib/store/cart-store";
import { urlFor } from "@/sanity/lib/image";
import type { Product } from "@/types";
import { Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  product: Product;
};

/**
 * Walmart-style quantity stepper.
 * Starts as "Add to cart" button; on first click adds to cart and morphs into [- N +].
 * Subsequent +/- adjust the cart quantity live.
 * When qty reaches 0 it collapses back into "Add".
 */
export function QuantityAddToCart({ product }: Props) {
  const qty = useCartStore((s) => s.getQuantity(product._id));
  const addItem = useCartStore((s) => s.addItem);
  const increment = useCartStore((s) => s.increment);
  const decrement = useCartStore((s) => s.decrement);
  const [justAdded, setJustAdded] = useState(false);

  if (!product.inStock) {
    return (
      <button
        disabled
        className="flex h-11 w-full items-center justify-center rounded-full border border-canela/20 text-sm font-medium text-ink/40"
      >
        Unavailable
      </button>
    );
  }

  const handleAdd = () => {
    addItem(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image ? urlFor(product.image).width(400).url() : "",
        unit: product.unit,
        leadTime: product.leadTime,
      },
      1
    );
    setJustAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setJustAdded(false), 1200);
  };

  if (qty === 0) {
    return (
      <button
        onClick={handleAdd}
        className="group flex h-11 w-full items-center justify-center gap-2 rounded-full border border-canela text-sm font-medium text-canela transition-all duration-300 hover:bg-canela hover:text-cream"
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" />
            Added
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" />
            Add to cart
          </>
        )}
      </button>
    );
  }

  return (
    <div className="flex h-11 w-full items-center justify-between overflow-hidden rounded-full bg-canela text-cream shadow-sm transition-all duration-300">
      <button
        onClick={() => decrement(product._id)}
        className="flex h-full w-11 shrink-0 items-center justify-center transition-colors hover:bg-canela-dark"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex flex-1 items-center justify-center">
        <span className="font-display text-lg tabular-nums">{qty}</span>
        <span className="ml-2 text-[10px] uppercase tracking-widest opacity-70">
          in cart
        </span>
      </div>
      <button
        onClick={() => increment(product._id)}
        className="flex h-full w-11 shrink-0 items-center justify-center transition-colors hover:bg-canela-dark"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
