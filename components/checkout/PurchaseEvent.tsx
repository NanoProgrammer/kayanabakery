"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/gtag";

type Props = {
  orderNumber: string;
  totalCents: number;
  items: { productId?: string; name: string; price: number; quantity: number }[];
};

/**
 * Fires the GA4 `purchase` conversion event once, on the order confirmation
 * page. Guarded by orderNumber in a ref (not just an empty dep array) so a
 * client-side re-render of the same page never double-fires it.
 */
export function PurchaseEvent({ orderNumber, totalCents, items }: Props) {
  const fired = useRef<string | null>(null);

  useEffect(() => {
    if (fired.current === orderNumber) return;
    fired.current = orderNumber;

    trackEvent("purchase", {
      transaction_id: orderNumber,
      currency: "CAD",
      value: totalCents / 100,
      items: items.map((it) => ({
        item_id: it.productId ?? it.name,
        item_name: it.name,
        price: it.price / 100,
        quantity: it.quantity,
      })),
    });
  }, [orderNumber, totalCents, items]);

  return null;
}
