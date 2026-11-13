"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { trackEvent } from "@/lib/analytics/gtag";

import { DeliverySlotPicker } from "./DeliverySlotPicker";
import { PickupSlotPicker } from "./PickupSlotPicker";
import { CouponInput } from "./CouponInput";
import { PointsSlider } from "./PointsSlider";
import { TipInput } from "./TipInput";
import { GuestSignupNudge } from "./GuestSignupNudge";
import { MembershipGate } from "../membership/MembershipGate";
import { AddressPicker, type AddressData, type SavedAddress } from "./AddressPicker";
import { SquarePaymentForm } from "./SquarePaymentForm";
import { interpretCheckoutResponse } from "@/lib/checkout/response";
import {
  chooseInitialAddress,
  resolveOrderAddress,
  addressPayload,
  describeOrderAddress,
  withSavedAddress,
} from "@/lib/checkout/address-choice";
import { OrderSummarySidebar } from "./OrderSummarySidebar";
import {
  CHECKOUT_STEPS,
  canJumpTo,
  canAdvance,
  firstIncompleteStep,
  stepComplete,
  stepTitle,
  whatIsMissing,
  type CheckoutStep,
  type StepState,
} from "@/lib/checkout/steps";

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
  const submitted = useRef(false);
  // Set when a payment may have reached Square but we never got a clean answer
  // back. It permanently disables Pay: a second click is a second real charge,
  // because the card is tokenized afresh and a new idempotency key goes with it.
  const [paymentUnconfirmed, setPaymentUnconfirmed] = useState<string | null>(null);
  const [zeroSubmitting, setZeroSubmitting] = useState(false);

  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const cartCouponCode = useCartStore((s) => s.appliedCouponCode);
  const cartPoints = useCartStore((s) => s.pointsToRedeem);
  const setCartCoupon = useCartStore((s) => s.setAppliedCoupon);
  const setCartPoints = useCartStore((s) => s.setPointsToRedeem);

  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">("PICKUP");

  // Address. Where the order goes is decided in one place —
  // lib/checkout/address-choice.ts — because it used to be decided in three
  // that disagreed, and a customer's orders went to the address he had moved
  // out of.
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState<string | null>(() =>
    chooseInitialAddress(initialAddresses)
  );
  const [guestAddress, setGuestAddress] = useState<AddressData | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [step, setStep] = useState<CheckoutStep>(1);

  const chosenAddress = useMemo(
    () =>
      resolveOrderAddress({
        addresses,
        selectedId: addressId,
        draft: guestAddress,
        isAddingNew: addingAddress,
      }),
    [addresses, addressId, guestAddress, addingAddress]
  );
  const chosenAddressLabel = describeOrderAddress(chosenAddress);

  // Slots
  const [deliverySlotId, setDeliverySlotId] = useState<string | null>(null);
  const [deliverySlotFee, setDeliverySlotFee] = useState(0);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  // Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // Phone for logged-in users who never saved one to their profile —
  // required so staff can call when they arrive for delivery.
  const [accountPhone, setAccountPhone] = useState("");
  const needsAccountPhone = !!user && !user.phone;

  // Coupon + points
  const [coupon, setCoupon] = useState<{
    code: string;
    discountType: "PERCENT" | "FIXED";
    appliesTo?: string | null;
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
              appliesTo: data.coupon.appliesTo ?? null,
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

  // Fire once per checkout page load, not on every cart mutation
  useEffect(() => {
    if (items.length === 0) return;
    trackEvent("begin_checkout", {
      currency: "CAD",
      value: items.reduce((s, it) => s + it.price * it.quantity, 0),
      items: items.map((it) => ({
        item_id: it.productId,
        item_name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Empty cart → back to cart (but not after successful payment)
  useEffect(() => {
    if (items.length === 0 && !submitted.current) router.push("/cart");
  }, [items.length, router]);

  // Guest nudge on delivery
  useEffect(() => {
    if (!user && fulfillment === "DELIVERY") setShowGuestNudge(true);
  }, [user, fulfillment]);

  // SE Calgary
  // Read off the address the order will actually carry, not off the
  // pre-selected one — otherwise the free-delivery badge can describe a
  // different address than the one being delivered to.
  const isSECustomer = useMemo(() => {
    if (fulfillment !== "DELIVERY") return false;
    if (chosenAddress.kind === "saved") {
      return (chosenAddress.address as SavedAddress).isSE ?? isSECalgary(chosenAddress.address.postalCode);
    }
    if (chosenAddress.kind === "new") return isSECalgary(chosenAddress.address.postalCode);
    return false;
  }, [fulfillment, chosenAddress]);

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
        ? {
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            appliesTo: coupon.appliesTo ?? null,
          }
        : null,
      pointsToRedeem,
      tipCents,
      prioritySlotFeeCents: fulfillment === "DELIVERY" ? deliverySlotFee : 0,
    });
  }, [items, fulfillment, user, isSECustomer, coupon, pointsToRedeem, tipCents, deliverySlotFee]);

  const isMember = user ? tierMeets(user.tier, "ARTESANO") : false;

  // Validation
  // Paying is allowed only once an address has actually resolved. The old
  // check passed on a selected id alone, which is exactly the state that
  // delivered to the wrong place.
  const hasDeliveryAddress = chosenAddress.kind !== "none";

  const canPay =
    items.length > 0 &&
    !needsMembership &&
    pricing.errors.length === 0 &&
    (fulfillment === "PICKUP"
      ? !!pickupDate && !!pickupTime
      : !!deliverySlotId && hasDeliveryAddress) &&
    (!!user || (guestEmail && guestName && guestPhone)) &&
    (!needsAccountPhone || !!accountPhone) &&
    !paymentUnconfirmed;

  async function handlePayment(token: string) {
    const payload: any = {
      paymentToken: token,
      fulfillmentType: fulfillment,
      // The chosen size and flavour travel as labels; the server prices them
      // from the catalog, so nothing about the price comes from here.
      items: items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
        ...(it.options ? { options: it.options } : {}),
      })),
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
      // Exactly what the "Delivering to" line above the Pay button says.
      Object.assign(payload, addressPayload(chosenAddress) ?? {});
    }

    if (!user) {
      payload.guestEmail = guestEmail;
      payload.guestName = guestName;
      payload.guestPhone = guestPhone;
    } else if (needsAccountPhone) {
      payload.phone = accountPhone;
    }

    // The message for the one case we must never get wrong: the money may be
    // gone and we cannot prove the order exists.
    const unconfirmedMessage = (reference?: string) =>
      locale === "es"
        ? `No pudimos confirmar tu pedido. Si tu tarjeta fue cobrada, el pedido está a salvo — NO pagues otra vez. Escríbenos${reference ? ` con esta referencia: ${reference}` : ""}.`
        : `We couldn't confirm your order. If your card was charged, your order is safe — do NOT pay again. Please contact us${reference ? ` with this reference: ${reference}` : ""}.`;

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // res.json() used to be called straight on this. A function cut short
      // after the card was charged answers with an empty body, and that threw
      // "Unexpected end of JSON input" at a customer whose money was gone.
      const body = await res.text();
      const outcome = interpretCheckoutResponse({ ok: res.ok, status: res.status, body });

      if (outcome.kind === "unconfirmed") {
        console.error("[checkout] unconfirmed", res.status, body.slice(0, 200));
        setPaymentUnconfirmed(outcome.reference);
        toast.error(unconfirmedMessage(outcome.reference), { duration: 30000 });
        return;
      }

      if (outcome.kind === "error") {
        toast.error(outcome.message);
        return;
      }

      submitted.current = true;
      clearCart();
      setCartCoupon(null);
      setCartPoints(0);
      router.push(outcome.redirect);
    } catch (e: any) {
      // The request left the browser; whether Square saw it is unknowable here.
      console.error("[checkout] request failed", e);
      setPaymentUnconfirmed("");
      toast.error(unconfirmedMessage(), { duration: 30000 });
    }
  }

  if (items.length === 0) return null;

  // Three steps instead of one long column. The rules for whether a step is
  // finished live in lib/checkout/steps.ts and are the same ones the Pay
  // button uses — a step the customer is waved through followed by a Pay
  // button that refuses is the same dead end as before.
  const stepState: StepState = {
    isSignedIn: !!user,
    guestName,
    guestEmail,
    guestPhone,
    needsAccountPhone,
    accountPhone,
    fulfillment,
    pickupDate,
    pickupTime,
    deliverySlotId,
    hasDeliveryAddress,
  };
  const missing = whatIsMissing(step, stepState, locale);


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
          <Stepper
            current={step}
            state={stepState}
            locale={locale}
            onJump={(target: CheckoutStep) => setStep(target)}
          />

          {/* ── Step 1: who the order is for ───────────────────── */}
          {step === 1 && (
          <>
          {/* A signed-in customer with a phone on file has nothing to fill
              in here, so the step says who they are rather than sitting
              empty and looking broken. */}
          {user && !needsAccountPhone && (
            <Section num={1} title={locale === "es" ? "Tus datos" : "Your details"}>
              <p className="text-sm">{user.name}</p>
              <p className="text-sm text-ink-soft">{user.email}</p>
            </Section>
          )}

          {!user && (
            <Section num={1} title={locale === "es" ? "Tus datos" : "Your details"}>
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

          {/* Phone for logged-in users with none on file — required for delivery contact */}
          {needsAccountPhone && (
            <Section num={2} title={locale === "es" ? "Tu teléfono" : "Your phone"}>
              <Input
                label={locale === "es" ? "Teléfono" : "Phone"}
                type="tel"
                value={accountPhone}
                onChange={setAccountPhone}
                required
              />
              <p className="mt-2 text-xs text-ink-soft">
                {locale === "es"
                  ? "Lo necesitamos para contactarte al momento de la entrega."
                  : "We need this to reach you at delivery time."}
              </p>
            </Section>
          )}
          </>
          )}

          {/* ── Step 2: when and where ─────────────────────────── */}
          {step === 2 && (
          <>
          <Section num={1} title={locale === "es" ? "Recolección o envío" : "Pickup or delivery"}>
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
                    ? locale === "es" ? "Gratis desde $32 · +$4.99 horario prioritario" : "Free from $32 · +$4.99 priority slot"
                    : locale === "es" ? "$7 · 1ra gratis en SE Calgary" : "$7 · 1st free in SE Calgary"
                }
              />
            </div>
          </Section>

          {/* Slot picker */}
          <Section
            num={2}
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
                minLeadHours={Math.max(24, maxLeadTime)}
                onChange={(id, fee) => { setDeliverySlotId(id); setDeliverySlotFee(fee); }}
              />
            )}
          </Section>

          {/* Address — delivery only */}
          {fulfillment === "DELIVERY" && (
            <Section num={3} title={locale === "es" ? "Dirección" : "Address"}>
              <AddressPicker
                addresses={addresses}
                selectedId={addressId}
                onSelect={setAddressId}
                guestAddress={guestAddress}
                onGuestAddressChange={setGuestAddress}
                isLoggedIn={!!user}
                isAddingNew={addingAddress}
                onAddingChange={setAddingAddress}
                onAdded={(saved) => setAddresses((prev) => withSavedAddress(prev, saved) as typeof prev)}
                onRemoved={(id) => {
                  setAddresses((prev) => prev.filter((a) => a.id !== id));
                  // Removing the one that was selected must not leave the
                  // order pointing at an address that no longer exists: the
                  // resolver would read that as "none" and block paying with
                  // nothing explaining why. Fall back to whatever is left.
                  setAddressId((current) =>
                    current === id
                      ? chooseInitialAddress(addresses.filter((a) => a.id !== id))
                      : current
                  );
                }}
              />
              {chosenAddressLabel && (
                <p className="mt-3 rounded-xl bg-canela-light px-3 py-2 text-xs text-ink">
                  <span className="font-bold uppercase tracking-widest text-canela-dark">
                    {locale === "es" ? "Entregando a" : "Delivering to"}
                  </span>{" "}
                  {chosenAddressLabel}
                </p>
              )}
            </Section>
          )}
          </>
          )}

          {/* ── Step 3: discounts, tip and the card ────────────── */}
          {step === 3 && (
          <>
          <Section num={1} title={locale === "es" ? "Descuentos" : "Discounts"}>
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

          <Section num={2} title={locale === "es" ? "Propina" : "Tip"}>
            <TipInput subtotalCents={pricing.subtotalCents} tipCents={tipCents} onChange={setTipCents} />
          </Section>

          {/* Payment */}
          <Section num={3} title={locale === "es" ? "Pago" : "Payment"}>
            {/* Stays on screen: the toast fades, and a Pay button that is dark
                for no visible reason is exactly what makes someone reload and
                try again. */}
            {paymentUnconfirmed !== null && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <p className="font-bold">
                  {locale === "es"
                    ? "No pudimos confirmar tu pedido"
                    : "We couldn't confirm your order"}
                </p>
                <p className="mt-2">
                  {locale === "es"
                    ? "Si tu tarjeta fue cobrada, tu pedido está a salvo y la panadería lo verá. No vuelvas a pagar."
                    : "If your card was charged, your order is safe and the bakery will see it. Please don't pay again."}
                </p>
                {paymentUnconfirmed && (
                  <p className="mt-2">
                    {locale === "es" ? "Referencia: " : "Reference: "}
                    <span className="font-mono text-xs">{paymentUnconfirmed}</span>
                  </p>
                )}
                <a
                  href="/contact"
                  className="mt-3 inline-block font-bold underline"
                >
                  {locale === "es" ? "Contactar a la panadería" : "Contact the bakery"}
                </a>
              </div>
            )}
            {pricing.totalCents === 0 ? (
              <button type="button" disabled={!canPay || zeroSubmitting} className="btn-primary w-full disabled:opacity-60" onClick={async () => { setZeroSubmitting(true); await handlePayment(""); setZeroSubmitting(false); }}>
                {locale === "es" ? "Confirmar pedido con mis puntos" : "Confirm order with my points"}
              </button>
            ) : (
              <SquarePaymentForm totalCents={pricing.totalCents} onTokenReady={handlePayment} disabled={!canPay} />
            )}
            {/* Not "complete the steps above": the steps are no longer
                above, and "something is missing somewhere" is what made the
                old form a hunt. It names the step and takes them to it. */}
            {!canPay && pricing.errors.length === 0 && !needsMembership && paymentUnconfirmed === null && (
              <button
                type="button"
                onClick={() => {
                  const target = firstIncompleteStep(stepState);
                  if (target) setStep(target);
                }}
                className="mt-3 text-xs text-ink-soft underline"
              >
                {(() => {
                  const target = firstIncompleteStep(stepState);
                  if (!target) {
                    return locale === "es"
                      ? "Revisa los datos de tu pago."
                      : "Check your payment details.";
                  }
                  const what = whatIsMissing(target, stepState, locale);
                  const name = stepTitle(target, locale);
                  return locale === "es"
                    ? `${what ?? "Falta algo"} — ir a "${name}"`
                    : `${what ?? "Something is missing"} — go to "${name}"`;
                })()}
              </button>
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
          </>
          )}

          {/* Back and Continue. The card's own button is the one that pays,
              so step 3 has no Continue of its own. */}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as CheckoutStep)}
                className="rounded-full border border-canela/30 px-5 py-2.5 text-sm font-medium"
              >
                ← {locale === "es" ? "Atrás" : "Back"}
              </button>
            )}
            {step < 3 && (
              <div className="flex-1">
                <button
                  type="button"
                  disabled={!canAdvance(step, stepState)}
                  onClick={() => setStep((s) => (s + 1) as CheckoutStep)}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {locale === "es" ? "Continuar" : "Continue"}
                </button>
                {missing && (
                  <p className="mt-2 text-center text-xs text-ink-soft">{missing}</p>
                )}
              </div>
            )}
          </div>
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

/**
 * The three steps across the top, so the customer can see where they are and
 * how much is left. A step that is finished is clickable; one that is not
 * cannot be jumped to, or the numbers become a way round the checks the Pay
 * button will apply anyway.
 */
function Stepper({
  current,
  state,
  locale,
  onJump,
}: {
  current: CheckoutStep;
  state: StepState;
  locale: string;
  onJump: (target: CheckoutStep) => void;
}) {
  return (
    <ol className="flex items-center gap-2">
      {CHECKOUT_STEPS.map((s, i) => {
        const isCurrent = s === current;
        const done = s < current && stepComplete(s, state);
        const reachable = canJumpTo(s, current, state);
        return (
          <li key={s} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => reachable && onJump(s)}
              disabled={!reachable}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex flex-1 items-center gap-2 rounded-full border px-3 py-2 text-left text-xs transition",
                isCurrent
                  ? "border-canela-dark bg-canela-light font-bold"
                  : done
                  ? "border-canela/30 bg-cream"
                  : "border-canela/20 bg-cream/50 text-ink-soft",
                reachable && !isCurrent && "hover:border-canela",
                !reachable && "cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  isCurrent || done ? "bg-canela text-ink" : "bg-canela/20 text-ink-soft"
                )}
              >
                {done ? "✓" : s}
              </span>
              <span className="truncate">{stepTitle(s, locale)}</span>
            </button>
            {i < CHECKOUT_STEPS.length - 1 && (
              <span className="hidden h-px w-3 bg-canela/30 sm:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
