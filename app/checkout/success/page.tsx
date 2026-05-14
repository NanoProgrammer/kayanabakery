import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCents } from "@/lib/checkout/pricing";

export const metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  if (!orderNumber) redirect("/");

  const session = await auth();
  const userId = (session?.user as any)?.id;

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      ...(userId ? { userId } : {}),
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      fulfillmentType: true,
      pickupDate: true,
      pickupTime: true,
      pointsEarned: true,
      items: true,
      deliverySlot: { select: { startTime: true, endTime: true } },
    },
  });

  if (!order) {
    return (
      <div className="container-bakery py-20 text-center">
        <h1 className="font-display text-3xl">Order not found</h1>
        <Link href="/" className="btn-primary mt-6 inline-flex">
          Home
        </Link>
      </div>
    );
  }

  const items = (order.items as any[]) || [];

  return (
    <div className="container-bakery py-16">
      <div className="mx-auto max-w-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-canela-light">
          <CheckCircle2 className="h-10 w-10 text-canela-dark" />
        </div>
        <h1 className="mt-6 text-center font-display text-4xl md:text-5xl">
          Order confirmed!
        </h1>
        <p className="mt-3 text-center text-ink-soft">
          Thanks for ordering with Karyana. Your bread is on its way to being made.
        </p>

        <div className="mt-10 rounded-3xl border border-canela/15 bg-cream p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
                Order number
              </p>
              <p className="mt-1 font-mono text-xl font-bold">
                {order.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
                Total
              </p>
              <p className="mt-1 font-display text-2xl">
                {formatCents(order.total, "en")}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-canela/15 pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
              {order.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}
            </p>
            {order.fulfillmentType === "PICKUP" ? (
              <p className="mt-1 font-medium">
                {order.pickupDate?.toLocaleDateString("en-CA")} · {order.pickupTime}
              </p>
            ) : order.deliverySlot ? (
              <p className="mt-1 font-medium">
                {order.deliverySlot.startTime.toLocaleString("en-CA", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            ) : null}
          </div>

          {items.length > 0 && (
            <ul className="mt-6 space-y-2 border-t border-canela/15 pt-6 text-sm">
              {items.map((it: any, i: number) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {it.quantity}× {it.name}
                  </span>
                  <span className="font-bold">
                    {formatCents(it.price * it.quantity, "en")}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {order.pointsEarned > 0 && (
            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-canela-light p-3 text-sm">
              <Package className="h-4 w-4 text-canela-dark" />
              <span>
                You earned <strong>{order.pointsEarned} points</strong>!
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/account/orders" className="btn-primary flex-1">
            See my orders <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/shop" className="btn-ghost flex-1">
            Keep shopping
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-ink-soft">
          A confirmation email is on its way.
        </p>
      </div>
    </div>
  );
}
