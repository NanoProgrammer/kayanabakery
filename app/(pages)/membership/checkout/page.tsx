import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SquareSubscriptionCheckout } from "@/components/membership/SquareSubscriptionCheckout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Membership Checkout" };

const VALID_TIERS = ["ARTESANO", "SELECTO", "LEGENDARIO"] as const;
type ValidTier = (typeof VALID_TIERS)[number];

export default async function MembershipCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    tier?: string;
    callbackUrl?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user) {
    const params = await searchParams;
    const tier = params.tier || "ARTESANO";
    redirect(`/login?callbackUrl=/membership/checkout?tier=${tier}`);
  }

  const params = await searchParams;
  const tier = params.tier as string | undefined;

  if (!tier || !VALID_TIERS.includes(tier as ValidTier)) {
    return (
      <div className="container-bakery py-16 text-center">
        <p className="text-ink-soft">Invalid membership tier.</p>
        <Link href="/memberships" className="btn-primary mt-4 inline-flex">
          See plans
        </Link>
      </div>
    );
  }

  const isArtesano = tier === "ARTESANO";

  return (
    <div className="container-bakery py-12 md:py-16">
      <div className="mx-auto max-w-xl">
        <Link
          href="/memberships"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-ink-soft hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to plans
        </Link>

        <h1 className="mt-4 font-display text-4xl md:text-5xl">
          {isArtesano ? "Start your free year" : "Complete your subscription"}
        </h1>

        <p className="mt-3 text-ink-soft">
          {isArtesano
            ? "Add a card on file to activate your Artesano membership. You won't be charged today — your first year is completely free."
            : "Enter your payment details to activate your membership."}
        </p>

        <SquareSubscriptionCheckout tier={tier as ValidTier} />
      </div>
    </div>
  );
}
