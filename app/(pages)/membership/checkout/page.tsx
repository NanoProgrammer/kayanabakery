import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { SquareSubscriptionCheckout } from "@/components/membership/SquareSubscriptionCheckout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getServerLocale, getServerT } from "@/lib/i18n/server";

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
  const t = await getServerT();

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
        <Link
          href="/memberships"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-ink-soft hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          {locale === "es" ? "Volver a los planes" : "Back to plans"}
        </Link>

        <h1 className="mt-4 font-display text-4xl md:text-5xl">
          {isArtesano
            ? locale === "es" ? "Empieza tu año gratis" : "Start your free year"
            : locale === "es" ? "Completa tu suscripción" : "Complete your subscription"}
        </h1>

        <p className="mt-3 text-ink-soft">
          {isArtesano
            ? locale === "es"
              ? "Agrega una tarjeta para activar tu membresía Artesano. No se te cobra hoy — tu primer año es completamente gratis."
              : "Add a card on file to activate your Artesano membership. You won't be charged today — your first year is completely free."
            : locale === "es"
            ? "Ingresa tus datos de pago para activar tu membresía."
            : "Enter your payment details to activate your membership."}
        </p>

        <SquareSubscriptionCheckout tier={tier as ValidTier} locale={locale} />
      </div>
    </div>
  );
}
