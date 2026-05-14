import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Download, ArrowLeft } from "lucide-react";
import { formatCents } from "@/lib/checkout/pricing";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = (session?.user as any).id;
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: {
      address: true,
      deliverySlot: true,
    },
  });

  if (!order) notFound();

  const items = (order.items as any[]) ?? [];

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-ink-soft hover:underline"
      >
        <ArrowLeft className="h-3 w-3" /> Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Order detail</h1>
          <p className="mt-1 font-mono text-sm font-bold">
            {order.orderNumber}
          </p>
        </div>
        <a
          href={`/api/orders/${order.id}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
        >
          <Download className="h-4 w-4" /> Invoice PDF
        </a>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-canela/15 bg-cream p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Status</p>
          <p className="mt-2 font-display text-2xl">
            {order.status.replace(/_/g, " ")}
          </p>
        </div>
        <div className="rounded-2xl border border-canela/15 bg-cream p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
            {order.fulfillmentType === "PICKUP" ? "Pickup" : "Delivery"}
          </p>
          <p className="mt-2 text-sm">
            {order.fulfillmentType === "PICKUP"
              ? `${order.pickupDate?.toLocaleDateString("en-CA")} · ${order.pickupTime}`
              : order.deliverySlot
              ? order.deliverySlot.startTime.toLocaleString("en-CA", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-canela/15 bg-cream p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Total</p>
          <p className="mt-2 font-display text-2xl">
            {formatCents(order.total, "en")}
          </p>
        </div>
      </div>

      {order.address && (
        <section className="mt-8">
          <h2 className="font-display text-xl">Delivery address</h2>
          <div className="mt-3 rounded-2xl border border-canela/15 bg-cream p-5 text-sm">
            <p>{order.address.street}</p>
            <p>
              {order.address.city}, {order.address.province} {order.address.postalCode}
            </p>
            {order.address.buzzer && <p>Buzzer: {order.address.buzzer}</p>}
            {order.address.notes && (
              <p className="mt-2 italic text-ink-soft">{order.address.notes}</p>
            )}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl">Items</h2>
        <ul className="mt-3 space-y-2">
          {items.map((it: any, i: number) => (
            <li
              key={i}
              className="flex justify-between rounded-2xl border border-canela/15 bg-cream p-4 text-sm"
            >
              <span>
                {it.quantity}× {it.name}
              </span>
              <span className="font-bold">
                {formatCents(it.price * 100 * it.quantity, "en")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 max-w-md ml-auto rounded-2xl border border-canela/15 bg-cream p-5 text-sm">
        <Row label="Subtotal" value={formatCents(order.subtotal, "en")} />
        {order.couponDiscount > 0 && (
          <Row
            label={`Coupon (${order.couponCode})`}
            value={`−${formatCents(order.couponDiscount, "en")}`}
          />
        )}
        {order.pointsDiscount > 0 && (
          <Row
            label={`Points (${order.pointsRedeemed} pts)`}
            value={`−${formatCents(order.pointsDiscount, "en")}`}
          />
        )}
        <Row
          label="Delivery"
          value={
            order.deliveryFee > 0 ? formatCents(order.deliveryFee, "en") : "FREE"
          }
        />
        <Row label="GST" value={formatCents(order.gst, "en")} />
        <div className="my-3 border-t border-canela/30" />
        <Row label="Total" value={formatCents(order.total, "en")} bold />
        {order.pointsEarned > 0 && (
          <p className="mt-3 rounded-xl bg-canela-light p-2 text-center text-xs">
            ✨ Earned {order.pointsEarned} pts
          </p>
        )}
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between py-1 ${bold ? "font-bold text-base" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
