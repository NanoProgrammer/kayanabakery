"use client";

import { useCartStore } from "@/lib/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import {
  PaymentForm,
  CreditCard,
} from "react-square-web-payments-sdk";
import { CreditCard as CardIcon, MapPin, Calendar, Check } from "lucide-react";

type Props = {
  user: { id: string; email: string; name: string | null } | null;
  addresses: any[];
  squareAppId: string;
  squareLocationId: string;
};

export function CheckoutForm({
  user,
  addresses,
  squareAppId,
  squareLocationId,
}: Props) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const clear = useCartStore((s) => s.clear);

  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    "PICKUP"
  );
  const [addressId, setAddressId] = useState<string>(
    addresses[0]?.id || ""
  );
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const total = subtotal;

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-canela/15 bg-masa/40 p-10 text-center">
        <p className="text-ink/70">
          Your cart is empty.{" "}
          <Link href="/shop" className="text-canela hover:underline">
            Browse the menu
          </Link>
          .
        </p>
      </div>
    );
  }

  async function handlePayment(token: any) {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: token.token,
          items: items.map((i) => ({
            productId: i.productId,
            slug: i.slug,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
            unit: i.unit,
          })),
          subtotal: Math.round(subtotal * 100),
          total: Math.round(total * 100),
          fulfillmentType: fulfillment,
          addressId: fulfillment === "DELIVERY" ? addressId : null,
          pickupDate: pickupDate || null,
          pickupTime: pickupTime || null,
          notes,
          guestEmail: user ? null : guestEmail,
          guestName: user ? null : guestName,
          guestPhone: user ? null : guestPhone,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Payment failed");
      }
      const { orderId } = await res.json();
      clear();
      toast.success("Order placed!");
      router.push(`/order-confirmation/${orderId}`);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
      <div className="space-y-8 lg:col-span-2">
        {!user && (
          <Section title="Contact info" icon="01">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field
                placeholder="Full name"
                value={guestName}
                onChange={setGuestName}
                required
              />
              <Field
                placeholder="Phone"
                value={guestPhone}
                onChange={setGuestPhone}
                required
              />
              <div className="md:col-span-2">
                <Field
                  placeholder="Email"
                  type="email"
                  value={guestEmail}
                  onChange={setGuestEmail}
                  required
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-ink/50">
              Already have an account?{" "}
              <Link
                href="/login?callbackUrl=/checkout"
                className="text-canela hover:underline"
              >
                Sign in
              </Link>
              .
            </p>
          </Section>
        )}

        <Section title="Fulfillment" icon="02">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFulfillment("PICKUP")}
              className={`rounded-2xl border px-5 py-4 text-left transition-all ${
                fulfillment === "PICKUP"
                  ? "border-canela bg-canela/10"
                  : "border-canela/15 bg-cream"
              }`}
            >
              <MapPin className="mb-2 h-5 w-5 text-canela" />
              <div className="font-display text-base text-ink">Pickup</div>
              <div className="text-xs text-ink/60">Calgary · free</div>
            </button>
            <button
              type="button"
              onClick={() => setFulfillment("DELIVERY")}
              className={`rounded-2xl border px-5 py-4 text-left transition-all ${
                fulfillment === "DELIVERY"
                  ? "border-canela bg-canela/10"
                  : "border-canela/15 bg-cream"
              }`}
            >
              <Calendar className="mb-2 h-5 w-5 text-canela" />
              <div className="font-display text-base text-ink">Delivery</div>
              <div className="text-xs text-ink/60">Calgary only</div>
            </button>
          </div>

          {fulfillment === "DELIVERY" && user && addresses.length > 0 && (
            <div className="mt-5">
              <label className="mb-2 block text-sm text-ink">Address</label>
              <select
                value={addressId}
                onChange={(e) => setAddressId(e.target.value)}
                className="h-11 w-full rounded-full border border-canela/20 bg-cream px-4 text-sm text-ink"
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.line1}, {a.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {fulfillment === "DELIVERY" && user && addresses.length === 0 && (
            <p className="mt-4 text-sm text-ink/60">
              No saved addresses.{" "}
              <Link
                href="/account/addresses"
                className="text-canela hover:underline"
              >
                Add one
              </Link>
              .
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-ink">
                {fulfillment === "PICKUP" ? "Pickup date" : "Delivery date"}
              </label>
              <input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="h-11 w-full rounded-full border border-canela/20 bg-cream px-4 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-ink">Time</label>
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="h-11 w-full rounded-full border border-canela/20 bg-cream px-4 text-sm text-ink"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm text-ink">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Special requests, allergies, cake message..."
              className="w-full rounded-2xl border border-canela/20 bg-cream p-4 text-sm text-ink"
            />
          </div>
        </Section>

        <Section title="Payment" icon="03">
          {squareAppId && squareLocationId ? (
            <PaymentForm
              applicationId={squareAppId}
              locationId={squareLocationId}
              cardTokenizeResponseReceived={handlePayment}
            >
              <CreditCard />
            </PaymentForm>
          ) : (
            <div className="rounded-2xl border border-otomi-orange/40 bg-otomi-orange/10 p-5 text-sm text-ink/80">
              <CardIcon className="mb-2 h-5 w-5 text-otomi-orange" />
              Square is not configured. Add{" "}
              <code className="rounded bg-masa/60 px-1 text-xs">
                NEXT_PUBLIC_SQUARE_APP_ID
              </code>{" "}
              and{" "}
              <code className="rounded bg-masa/60 px-1 text-xs">
                NEXT_PUBLIC_SQUARE_LOCATION_ID
              </code>{" "}
              to your <code>.env</code> to enable checkout.
            </div>
          )}
        </Section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:h-fit">
        <div className="rounded-3xl border border-canela/15 bg-masa/40 p-8">
          <h2 className="font-display text-2xl text-ink">Your order</h2>

          <ul className="mt-6 divide-y divide-canela/10">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-3 py-3">
                {item.image && (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink/60">× {item.quantity}</p>
                  </div>
                  <span className="text-sm font-display text-canela">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="my-5 h-px bg-canela/15" />
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" value={formatPrice(subtotal)} />
            <Row label="Tax" value="Calculated at checkout" />
          </div>
          <div className="my-5 h-px bg-canela/15" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm uppercase tracking-widest text-ink/60">
              Total
            </span>
            <span className="font-display text-3xl text-canela">
              {formatPrice(total)}
            </span>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-ink/50">
            <Check className="h-3 w-3" />
            Secure payment via Square
          </p>
        </div>
      </aside>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm">
          <div className="rounded-3xl bg-cream p-8 text-center">
            <p className="font-display text-xl text-ink">
              Processing your order…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-canela/15 bg-masa/30 p-8">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-canela/30 font-display text-canela">
          {icon}
        </span>
        <h2 className="font-display text-2xl text-ink">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  placeholder,
  value,
  onChange,
  type = "text",
  required,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-full border border-canela/20 bg-cream px-4 text-sm text-ink focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink/70">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
