import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { TIERS } from "@/lib/membership/tiers";
import { membershipAccessReason, membershipGrantsBenefits } from "@/lib/membership/access";
import { MembershipManager } from "@/components/account/MembershipManager";
import { UpdateCard } from "@/components/account/UpdateCard";
import { WeeklyBoxPreferences } from "@/components/account/WeeklyBoxPreferences";

export const dynamic = "force-dynamic";

export default async function MembershipAccountPage() {
  const session = await auth();
  const userId = (session?.user as any).id;

  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  const tier = membership?.tier ?? "BASICO";
  const tierData = TIERS[tier as keyof typeof TIERS];

  // Showing the plan name while the rest of the site treats the person as a
  // non-member is how a Selecto member ends up being told that members-only
  // bread needs Artesano. If the benefits aren't live, the page says so.
  const hasBenefits = membershipGrantsBenefits(membership);

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
          {membership && !hasBenefits && (
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">
              <p className="font-bold">Your benefits aren&apos;t active right now</p>
              <p className="mt-1">{membershipAccessReason(membership)}</p>
              <p className="mt-1">
                Members-only products and member pricing won&apos;t apply until this
                is sorted out.
              </p>
            </div>
          )}
        </div>

        {/* A declined renewal used to be a dead end: the member was told their
            benefits had stopped with nothing on the site that could fix it. */}
        {membership && ["ARTESANO", "SELECTO", "LEGENDARIO"].includes(tier) && (
          <UpdateCard
            behind={membership.status === "PAST_DUE"}
            priceCents={tierData.priceCents}
          />
        )}

        <MembershipManager
  currentTier={tier as any}
  isActive={membership?.status === "ACTIVE"}
/>
      </div>

      {membership && hasBenefits && (tier === "SELECTO" || tier === "LEGENDARIO") && (
          <WeeklyBoxPreferences
            initialMode={membership.weeklyMode}
            initialAutoDelivery={membership.autoDeliveryEnabled}
            initialFrequency={membership.weeklyFrequency}
          />
        )}

      <p className="mt-6 text-sm text-ink-soft">
        Want to compare all plans?{" "}
        <Link href="/memberships" className="font-medium text-canela-dark underline">
          See plans
        </Link>
      </p>
    </div>
  );
}
