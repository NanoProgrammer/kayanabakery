import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPriceFromCents } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { OrderItem } from "@/types";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const userId = (session!.user as any).id;

  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { address: true },
  });

  if (!order) notFound();
  const items = order.items as unknown as OrderItem[];

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-canela hover:text-canela-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mb-8">
        <p className="font-mono text-sm text-ink/60">{order.orderNumber}</p>
        <h2 className="mt-1 font-display text-3xl text-ink">
          Order {order.status.replace("_", " ").toLowerCase()}
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          Placed {format(order.createdAt, "MMMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-2xl border border-canela/15 bg-masa/30 p-4"
          >
            {item.image && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <p className="font-display text-base text-ink">{item.name}</p>
              <p className="text-xs text-ink/60">
                {item.quantity} × ${item.price.toFixed(2)}
              </p>
            </div>
            <span className="font-display text-base text-canela">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-canela/15 bg-masa/30 p-6">
        <div className="space-y-2 text-sm">
          <Row label="Subtotal" value={formatPriceFromCents(order.subtotal)} />
          {order.discount > 0 && (
            <Row
              label="Discount"
              value={`-${formatPriceFromCents(order.discount)}`}
            />
          )}
          {order.tax > 0 && (
            <Row label="Tax" value={formatPriceFromCents(order.tax)} />
          )}
          {order.shipping > 0 && (
            <Row label="Shipping" value={formatPriceFromCents(order.shipping)} />
          )}
          <div className="my-3 h-px bg-canela/15" />
          <Row
            label={<span className="font-medium">Total</span>}
            value={
              <span className="font-display text-lg text-canela">
                {formatPriceFromCents(order.total)}
              </span>
            }
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50">
            Fulfillment
          </h3>
          <p className="mt-2 font-display text-lg text-ink">
            {order.fulfillmentType === "PICKUP" && "Pickup in Calgary"}
            {order.fulfillmentType === "DELIVERY" && "Delivery"}
            {order.fulfillmentType === "EVENT" && "Event pickup"}
          </p>
          {order.pickupDate && (
            <p className="mt-1 text-sm text-ink/60">
              {format(order.pickupDate, "MMMM d, yyyy")}
              {order.pickupTime && ` at ${order.pickupTime}`}
            </p>
          )}
        </div>
        {order.address && (
          <div className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50">
              Delivery address
            </h3>
            <div className="mt-2 text-sm text-ink/80">
              <p>{order.address.fullName}</p>
              <p>{order.address.line1}</p>
              {order.address.line2 && <p>{order.address.line2}</p>}
              <p>
                {order.address.city}, {order.address.province}{" "}
                {order.address.postalCode}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between text-ink/70">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
