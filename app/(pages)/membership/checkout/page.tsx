import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SquareSubscriptionCheckout } from "@/components/membership/SquareSubscriptionCheckout";
import { CheckoutHeader } from "@/components/membership/CheckoutHeader";
import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/server";


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
  const locale = await getServerLocale();

  if (!tier || !VALID_TIERS.includes(tier as ValidTier)) {
    return (
      <div className="container-bakery py-16 text-center">
        <p className="text-ink-soft">
          {locale === "es" ? "Membresía inválida." : "Invalid membership tier."}
        </p>
        <Link href="/memberships" className="btn-primary mt-4 inline-flex">
          {locale === "es" ? "Ver planes" : "See plans"}
        </Link>
      </div>
    );
  }

  const isArtesano = tier === "ARTESANO";

  return (
    <div className="container-bakery py-12 md:py-16">
      <div className="mx-auto max-w-xl">
        <CheckoutHeader isArtesano={isArtesano} />
        <SquareSubscriptionCheckout tier={tier as ValidTier} />
      </div>
    </div>
  );
}
