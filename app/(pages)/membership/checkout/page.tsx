import { SquareSubscriptionCheckout } from "@/components/membership/SquareSubscriptionCheckout";

export default async function MembershipCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    tier?: string;
  }>;
}) {
  const params = await searchParams;
  const tier = params.tier;

  if (
    tier !== "ARTESANO" &&
    tier !== "SELECTO" &&
    tier !== "LEGENDARIO"
  ) {
    return (
      <div className="p-10">
        Invalid tier
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-10">
      <h1 className="font-display text-5xl">
        Checkout
      </h1>

      <p className="mt-4 text-ink-soft">
        Complete your membership
        subscription.
      </p>

      <SquareSubscriptionCheckout
        tier={tier}
      />
    </div>
  );
}