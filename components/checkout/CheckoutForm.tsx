"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, ShoppingBag, ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n/locale-provider";
import { useCartStore } from "@/lib/store/cart-store";
import { computePricing, formatCents } from "@/lib/checkout/pricing";
import { isSECalgary } from "@/lib/checkout/postal-codes";
import { tierMeets, type MembershipTier } from "@/lib/membership/tiers";
import { cn } from "@/lib/utils";

import { DeliverySlotPicker } from "./DeliverySlotPicker";
import { PickupSlotPicker } from "./PickupSlotPicker";
import { CouponInput } from "./CouponInput";
import { PointsSlider } from "./PointsSlider";
import { TipInput } from "./TipInput";
import { GuestSignupNudge } from "./GuestSignupNudge";
import { MembershipGate } from "../membership/MembershipGate";
import { AddressPicker, type AddressData, type SavedAddress } from "./AddressPicker";
import { SquarePaymentForm } from "./SquarePaymentForm";
import { OrderSummarySidebar } from "./OrderSummarySidebar";

type UserCtx = {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  pointsBalance: number;
  tier: MembershipTier;
  hasUsedFirstFreeDelivery: boolean;
};

export function CheckoutForm({
  user,
  addresses: initialAddresses,
}: {
  user: UserCtx | null;
  addresses: SavedAddress[];
}) {
  const router = useRouter();
  const { locale } = useLocale();

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const cartCouponCode = useCartStore((s) => s.appliedCouponCode);
  const cartPoints = useCartStore((s) => s.pointsToRedeem);
  const setCartCoupon = useCartStore((s) => s.setAppliedCoupon);
  const setCartPoints = useCartStore((s) => s.setPointsToRedeem);

  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");

  // Address
  const [addresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState<string | null>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null
  );
  const [guestAddress, setGuestAddress] = useState<AddressData | null>(null);

  // Slots
  const [deliverySlotId, setDeliverySlotId] = useState<string | null>(null);
  const [deliverySlotFee, setDeliverySlotFee] = useState(0);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  // Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Coupon + points
  const [coupon, setCoupon] = useState<{
    code: string;
    discountType: "PERCENT" | "FIXED";
    discountValue: number;
    description?: string;
  } | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);

  // Tips
  const [tipCents, setTipCents] = useState(0);

  // Guest nudge
  const [showGuestNudge, setShowGuestNudge] = useState(false);

  // Member-only items gate
  const hasMemberOnlyItems = items.some((it) => it.membersOnly);
  const userIsMember = user ? tierMeets(user.tier, "ARTESANO") : false;
  const needsMembership = hasMemberOnlyItems && !userIsMember;

  // Hydrate coupon from cart store
  useEffect(() => {
    if (cartCouponCode && !coupon) {
      fetch("/api/coupon/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cartCouponCode,
          subtotalCents: items.reduce((s, it) => s + it.price * 100 * it.quantity, 0),
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.coupon) {
            setCoupon({
              code: data.coupon.code,
              discountType: data.coupon.discountType,
              discountValue: data.coupon.discountValue,
              description: data.coupon.description,
            });
          }
        });
    }
    if (cartPoints && pointsToRedeem === 0) {
      setPointsToRedeem(cartPoints);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Empty cart → back to cart
  useEffect(() => {
    if (items.length === 0) router.push("/cart");
  }, [items.length, router]);

  // Guest nudge on delivery
  useEffect(() => {
    if (!user && fulfillment === "DELIVERY") setShowGuestNudge(true);
  }, [user, fulfillment]);

  // SE Calgary
  const isSECustomer = useMemo(() => {
    if (fulfillment !== "DELIVERY") return false;
    if (addressId) {
      const a = addresses.find((x) => x.id === addressId);
      return a?.isSE ?? false;
    }
    if (guestAddress) return isSECalgary(guestAddress.postalCode);
    return false;
  }, [fulfillment, addressId, addresses, guestAddress]);

  const maxLeadTime = items.reduce((max, it) => Math.max(max, it.leadTime ?? 0), 0);

  // Pricing
  const pricing = useMemo(() => {
    return computePricing({
      items: items.map((it) => ({
        productId: it.productId,
        price: it.price * 100,
        quantity: it.quantity,
      })),
      fulfillmentType: fulfillment,
      tier: user?.tier ?? "BASICO",
      isSouthEastCalgary: isSECustomer,
      hasUsedFirstFreeDelivery: user?.hasUsedFirstFreeDelivery ?? false,
      isGuest: !user,
      coupon: coupon
        ? { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue }
        : null,
      pointsToRedeem,
      tipCents,
      prioritySlotFeeCents: fulfillment === "DELIVERY" ? deliverySlotFee : 0,
    });
  }, [items, fulfillment, user, isSECustomer, coupon, pointsToRedeem, tipCents, deliverySlotFee]);

  const isMember = user ? tierMeets(user.tier, "ARTESANO") : false;

  // Validation
  const canPay =
    items.length > 0 &&
    !needsMembership &&
    pricing.errors.length === 0 &&
    (fulfillment === "PICKUP"
      ? !!pickupDate && !!pickupTime
      : !!deliverySlotId &&
        ((user && addressId) || (!user && guestAddress?.street && guestAddress?.postalCode))) &&
    (!!user || (guestEmail && guestName && guestPhone));

  async function handlePayment(token: string) {
    const payload: any = {
      paymentToken: token,
      fulfillmentType: fulfillment,
      items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
      couponCode: coupon?.code,
      pointsToRedeem: pointsToRedeem || undefined,
      tipCents: tipCents || undefined,
      clientReferenceId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    if (fulfillment === "PICKUP") {
      payload.pickupDate = pickupDate;
      payload.pickupTime = pickupTime;
    } else {
      payload.deliverySlotId = deliverySlotId;
      if (user && addressId) payload.addressId = addressId;
      else if (guestAddress) payload.guestAddress = guestAddress;
    }

    if (!user) {
      payload.guestEmail = guestEmail;
      payload.guestName = guestName;
      payload.guestPhone = guestPhone;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Checkout failed");
        return;
      }
      clearCart();
      setCartCoupon(null);
      setCartPoints(0);
      router.push(data.redirect || `/checkout/success?order=${data.orderNumber}`);
    } catch (e: any) {
      toast.error(e.message || "Network error");
    }
  }

  if (items.length === 0) return null;

  let sectionNum = 0;
  const nextNum = () => ++sectionNum;

  return (
    <div className="container-bakery py-8 md:py-12">
      <header className="mb-8">
        <Link
          href="/cart"
          className="text-xs uppercase tracking-[0.2em] text-ink-soft hover:underline"
        >
          ← {locale === "es" ? "Volver al carrito" : "Back to cart"}
        </Link>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">
          {locale === "es" ? "Pagar" : "Checkout"}
        </h1>
      </header>

      {/* Membership gate — blocks checkout if member-only items in cart */}
      {needsMembership && (
        <MembershipGate
          isLoggedIn={!!user}
          memberOnlyItems={items.filter((it) => it.membersOnly).map((it) => it.name)}
        />
      )}

      <div className={cn("grid gap-10 lg:grid-cols-[1fr_400px]", needsMembership && "pointer-events-none opacity-50")}>
        {/* Left: form */}
        <div className="space-y-8">
          {/* Guest contact */}
          {!user && (
            <Section num={nextNum()} title={locale === "es" ? "Tus datos" : "Your details"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label={locale === "es" ? "Nombre" : "Name"} value={guestName} onChange={setGuestName} required />
                <Input label="Email" type="email" value={guestEmail} onChange={setGuestEmail} required />
                <Input label={locale === "es" ? "Teléfono" : "Phone"} type="tel" value={guestPhone} onChange={setGuestPhone} required />
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                {locale === "es" ? "¿Ya tienes cuenta?" : "Have an account?"}{" "}
                <Link href="/login?callbackUrl=/checkout" className="font-medium text-canela-dark underline">
                  {locale === "es" ? "Inicia sesión" : "Sign in"}
                </Link>
              </p>
            </Section>
          )}

          {/* Fulfillment toggle */}
          <Section num={nextNum()} title={locale === "es" ? "Recolección o envío" : "Pickup or delivery"}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FulfillmentTile
                active={fulfillment === "PICKUP"}
                onClick={() => setFulfillment("PICKUP")}
                icon={ShoppingBag}
                title={locale === "es" ? "Recolección" : "Pickup"}
                desc={locale === "es" ? "Sin costo" : "No charge"}
              />
              <FulfillmentTile
                active={fulfillment === "DELIVERY"}
                onClick={() => setFulfillment("DELIVERY")}
                icon={Truck}
                title={locale === "es" ? "Envío" : "Delivery"}
                desc={
                  !user
                    ? locale === "es" ? "$7 · mín $25" : "$7 · min $25"
                    : user.tier === "SELECTO" || user.tier === "LEGENDARIO"
                    ? locale === "es" ? "Gratis desde $25 con tu plan" : "Free from $25 with your plan"
                    : user.tier === "ARTESANO"
                    ? locale === "es" ? "$4.99 · envío gratis con cupón" : "$4.99 slot · free shipping w/ coupon"
                    : locale === "es" ? "$7 · 1ra gratis en SE Calgary" : "$7 · 1st free in SE Calgary"
                }
              />
            </div>
          </Section>

          {/* Slot picker */}
          <Section
            num={nextNum()}
            title={
              fulfillment === "PICKUP"
                ? locale === "es" ? "¿Cuándo recoges?" : "When to pick up?"
                : locale === "es" ? "¿Cuándo entregamos?" : "When to deliver?"
            }
          >
            {fulfillment === "PICKUP" ? (
              <PickupSlotPicker
                date={pickupDate}
                time={pickupTime}
                onDateChange={setPickupDate}
                onTimeChange={setPickupTime}
                minLeadHours={maxLeadTime}
              />
            ) : (
              <DeliverySlotPicker
                selectedId={deliverySlotId}
                userTier={user?.tier ?? "BASICO"}
                onChange={(id, fee) => { setDeliverySlotId(id); setDeliverySlotFee(fee); }}
              />
            )}
          </Section>

          {/* Address — delivery only */}
          {fulfillment === "DELIVERY" && (
            <Section num={nextNum()} title={locale === "es" ? "Dirección" : "Address"}>
              <AddressPicker
                addresses={addresses}
                selectedId={addressId}
                onSelect={setAddressId}
                guestAddress={guestAddress}
                onGuestAddressChange={setGuestAddress}
                isLoggedIn={!!user}
              />
            </Section>
          )}

          {/* Discounts */}
          <Section num={nextNum()} title={locale === "es" ? "Descuentos" : "Discounts"}>
            <div className="space-y-4">
              <CouponInput
                applied={coupon}
                onApply={(c) => { setCoupon(c); setCartCoupon(c.code); }}
                onRemove={() => { setCoupon(null); setCartCoupon(null); }}
                subtotalCents={pricing.subtotalCents}
              />
              {user && (
                <PointsSlider
                  available={user.pointsBalance}
                  current={pointsToRedeem}
                  maxRedeemable={Math.floor((pricing.subtotalCents - pricing.couponDiscountCents) / 1)}
                  onChange={(n) => { setPointsToRedeem(n); setCartPoints(n); }}
                />
              )}
            </div>
          </Section>

          {/* Tip */}
          <Section num={nextNum()} title={locale === "es" ? "Propina" : "Tip"}>
            <TipInput subtotalCents={pricing.subtotalCents} tipCents={tipCents} onChange={setTipCents} />
          </Section>

          {/* Payment */}
          <Section num={nextNum()} title={locale === "es" ? "Pago" : "Payment"}>
            <SquarePaymentForm totalCents={pricing.totalCents} onTokenReady={handlePayment} disabled={!canPay} />
            {!canPay && pricing.errors.length === 0 && !needsMembership && (
              <p className="mt-3 text-xs text-ink-soft">
                {locale === "es"
                  ? "Completa los pasos anteriores para continuar."
                  : "Complete the steps above to continue."}
              </p>
            )}
            {pricing.errors.length > 0 && (
              <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs text-red-700">
                {pricing.errors.map((e) =>
                  locale === "es" && e.startsWith("Minimum order for delivery")
                    ? "El pedido mínimo para envío es $25.00"
                    : e
                ).join("; ")}
              </div>
            )}
          </Section>
        </div>

        {/* Right: summary */}
        <OrderSummarySidebar pricing={pricing} />
      </div>

      <GuestSignupNudge show={showGuestNudge} onDismiss={() => setShowGuestNudge(false)} />
    </div>
  );
}

// ─── Subcomponents ───────────────────────────────────────────

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <section>
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canela text-xs font-bold">{num}</span>
        <h2 className="font-display text-xl">{title}</h2>
      </header>
      <div className="ml-10">{children}</div>
    </section>
  );
}

function FulfillmentTile({
  active, onClick, icon: Icon, title, desc,
}: {
  active: boolean; onClick: () => void; icon: any; title: string; desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
        active ? "border-canela-dark bg-canela-light" : "border-canela/30 bg-cream hover:border-canela"
      )}
    >
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", active ? "bg-canela-dark text-cream" : "bg-canela-light")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-ink-soft">{desc}</p>
      </div>
      <ChevronRight className={cn("h-4 w-4 transition-transform", active && "rotate-90 text-canela-dark")} />
    </button>
  );
}

function Input({
  label, type = "text", value, onChange, required,
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">{label} {required && "*"}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-full border border-canela/30 bg-cream px-4 py-2.5 text-sm focus:border-canela-dark focus:outline-none"
      />
    </div>
  );
}
