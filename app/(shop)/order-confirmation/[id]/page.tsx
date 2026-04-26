import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { formatPriceFromCents } from "@/lib/utils";
import { format } from "date-fns";
import type { OrderItem } from "@/types";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { address: true, user: true },
  });

  if (!order) notFound();
  const items = order.items as unknown as OrderItem[];

  return (
    <div className="container-bakery py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-otomi-green/20">
          <CheckCircle2 className="h-10 w-10 text-otomi-green" />
        </div>
        <span className="eyebrow mb-3">Order confirmed</span>
        <h1 className="section-title">
          ¡<span className="italic text-otomi-red">Gracias!</span> Your order is
          in the oven.
        </h1>
        <p className="mt-4 text-ink/70">
          A confirmation has been sent to{" "}
          <span className="font-medium text-ink">
            {order.user?.email || order.guestEmail}
          </span>
          .
        </p>
        <p className="mt-2 font-mono text-xs text-ink/50">
          Order {order.orderNumber}
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-canela/15 bg-masa/30 p-8">
        <h2 className="font-display text-xl text-ink">Summary</h2>

        <ul className="mt-5 divide-y divide-canela/10">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center justify-between py-3 text-sm"
            >
              <div>
                <span className="font-medium text-ink">{item.name}</span>
                <span className="ml-2 text-ink/60">× {item.quantity}</span>
              </div>
              <span className="font-display text-canela">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="my-5 h-px bg-canela/15" />
        <div className="flex items-baseline justify-between">
          <span className="text-sm uppercase tracking-widest text-ink/60">
            Total
          </span>
          <span className="font-display text-3xl text-canela">
            {formatPriceFromCents(order.total)}
          </span>
        </div>

        <div className="mt-6 rounded-2xl bg-cream p-5 text-sm">
          <p className="font-medium text-ink">
            {order.fulfillmentType === "PICKUP"
              ? "Pickup details"
              : "Delivery details"}
          </p>
          {order.pickupDate && (
            <p className="mt-1 text-ink/70">
              {format(order.pickupDate, "MMMM d, yyyy")}
              {order.pickupTime && ` at ${order.pickupTime}`}
            </p>
          )}
          {order.address && (
            <p className="mt-1 text-ink/70">
              {order.address.line1}, {order.address.city}
            </p>
          )}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/shop" className="btn-primary">
          Continue shopping
        </Link>
        {order.userId && (
          <Link
            href="/account/orders"
            className="ml-3 inline-flex items-center text-sm text-canela hover:underline"
          >
            View all orders
          </Link>
        )}
      </div>
    </div>
  );
}
