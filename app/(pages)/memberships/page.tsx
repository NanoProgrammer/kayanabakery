import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { sanityFetch } from "@/sanity/lib/fetch";
import { membershipPlansQuery } from "@/sanity/lib/queries";
import { MembershipsHero } from "@/components/membership/MembershipsHero";
import { MembershipPricingTable } from "@/components/membership/MembershipPricingTable";
import { MembershipBenefitsGrid } from "@/components/membership/MembershipBenefitsGrid";
import { MembershipFAQ } from "@/components/membership/MembershipFAQ";
import type { MembershipPlanCMS } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MembershipsPage() {
  const session = await auth();

  const userId = (session?.user as any)?.id ?? null;

  const [cmsPlans, currentMembership] = await Promise.all([
    sanityFetch<MembershipPlanCMS[]>({
      query: membershipPlansQuery,
      tags: ["membershipPlan"],
    }),

    userId
      ? prisma.membership.findUnique({
          where: {
            userId,
          },
        })
      : null,
  ]);

  const currentTier = currentMembership?.tier ?? "BASICO";

  return (
    <>
      <MembershipsHero />

      <MembershipPricingTable
        cmsPlans={cmsPlans ?? []}
        currentTier={currentTier as any}
        loggedIn={!!userId}
        membership={currentMembership}
      />

      <MembershipBenefitsGrid />

      <MembershipFAQ />
    </>
  );
}