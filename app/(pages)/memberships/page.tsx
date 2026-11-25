import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { sanityFetch } from "@/sanity/lib/fetch";
import { membershipPlansQuery } from "@/sanity/lib/queries";
import { MembershipsHero } from "@/components/membership/MembershipsHero";
import { ClubTiers } from "@/components/membership/ClubTiers";
import { MembershipBenefitsGrid } from "@/components/membership/MembershipBenefitsGrid";
import { MembershipFAQ } from "@/components/membership/MembershipFAQ";
import { ClubRoadmap } from "@/components/membership/ClubRoadmap";
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

      {/* Situación 8: the climb first — it is what the Club now IS — then
          the levels in detail. Neither of them sells anything. */}
      <ClubRoadmap currentTier={currentTier as any} />

      <ClubTiers currentTier={currentTier as any} />

      <MembershipBenefitsGrid />

      <MembershipFAQ />
    </>
  );
}