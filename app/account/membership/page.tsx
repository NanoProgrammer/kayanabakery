import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { TIERS } from "@/lib/membership/tiers";
import { MembershipManager } from "@/components/account/MembershipManager";

export const dynamic = "force-dynamic";

export default async function MembershipAccountPage() {
  const session = await auth();
  const userId = (session?.user as any).id;

  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  const tier = membership?.tier ?? "BASICO";
  const tierData = TIERS[tier as keyof typeof TIERS];

  return (
    <div>
      <h1 className="font-display text-3xl">My membership</h1>

      <div className="mt-8 rounded-3xl border border-gold/30 bg-gradient-to-br from-cream to-canela-light p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
          Current plan
        </p>
        <div className="mt-2 flex items-baseline gap-3">
          <h2 className="font-display text-4xl">{tierData.name}</h2>
          <span className="text-sm text-ink-soft">
            {tierData.cadence === "FREE"
              ? "Free"
              : tierData.cadence === "MONTHLY"
              ? `$${tierData.priceCents / 100}/mo`
              : `$${tierData.priceCents / 100}/yr`}
          </span>
        </div>

        <div className="mt-6 space-y-2 text-sm">
          {membership?.status === "ACTIVE" && membership.renewsAt && (
            <p>
              Renews on{" "}
              <strong>
                {membership.renewsAt.toLocaleDateString("en-CA", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
            </p>
          )}
          {membership?.status === "CANCELED" && membership.endsAt && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
              Cancelled. Benefits active until{" "}
              <strong>
                {membership.endsAt.toLocaleDateString("en-CA", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
              .
            </p>
          )}
          <p className="text-ink-soft">
            Earns <strong>{tierData.pointsMultiplier}x</strong> points on
            every order
          </p>
        </div>

        <MembershipManager
  currentTier={tier as any}
  isActive={membership?.status === "ACTIVE"}
/>
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Want to compare all plans?{" "}
        <Link href="/memberships" className="font-medium text-canela-dark underline">
          See plans
        </Link>
      </p>
    </div>
  );
}
