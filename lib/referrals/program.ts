import { Prisma, type MembershipTier } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { effectiveTier } from "@/lib/membership/access";

// 100 Karyana points = CAD $1. Rewards belong to the inviting member only.
export const REFERRAL_POINTS: Record<Exclude<MembershipTier, "EMBAJADOR">, number> = {
  BASICO: 500,
  ARTESANO: 600,
  SELECTO: 800,
  LEGENDARIO: 1000,
};

export function pointsForReferrer(tier: MembershipTier): number {
  // Ambassador membership has separate benefits, not a referral rate yet.
  if (tier === "EMBAJADOR") return 0;
  return REFERRAL_POINTS[tier];
}

export type ReferralConfirmation = "awarded" | "limit" | "not_eligible" | "already" | "missing";

export async function confirmVerifiedReferral(referredUserId: string): Promise<ReferralConfirmation> {
  // A verified new member creates at most one reward, even if the verification
  // link is opened repeatedly or two different people register at once.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const referred = await tx.user.findUnique({
          where: { id: referredUserId },
          select: { id: true, referralVerificationProcessedAt: true, referredById: true },
        });
        if (!referred) return "missing" as const;
        if (referred.referralVerificationProcessedAt) return "already" as const;

        const verified = await tx.user.updateMany({
          where: { id: referred.id, referralVerificationProcessedAt: null },
          data: { emailVerified: new Date(), referralVerificationProcessedAt: new Date() },
        });
        if (verified.count !== 1) return "already" as const;
        if (!referred.referredById || referred.id === referred.referredById) {
          return "not_eligible" as const;
        }

        const referrer = await tx.user.findUnique({
          where: { id: referred.referredById },
          select: {
            id: true,
            referralRewardCount: true,
            referralRewardLimit: true,
            membership: { select: { tier: true, status: true, endsAt: true } },
          },
        });
        if (!referrer) return "not_eligible" as const;

        const tier = effectiveTier(referrer.membership);
        const points = pointsForReferrer(tier);
        if (!points) return "not_eligible" as const;

        // One row is locked by this guarded update. At 10/10 no more rewards
        // are minted until an admin approves another block of 10.
        const increment = await tx.user.updateMany({
          where: {
            id: referrer.id,
            referralRewardCount: { lt: referrer.referralRewardLimit },
          },
          data: {
            referralRewardCount: { increment: 1 },
            pointsBalance: { increment: points },
          },
        });
        if (increment.count !== 1) return "limit" as const;

        await tx.referralReward.create({
          data: {
            referrerId: referrer.id,
            referredUserId: referred.id,
            points,
            tier,
          },
        });
        await tx.pointsTransaction.create({
          data: {
            userId: referrer.id,
            type: "REFERRAL",
            amount: points,
            note: "Verified Karyana Club member referral",
          },
        });
        return "awarded" as const;
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 15000,
      });
    } catch (err: any) {
      // PostgreSQL serialization conflicts are retried, never double-paid.
      if (err?.code === "P2034" && attempt < 2) continue;
      throw err;
    }
  }
  throw new Error("Referral confirmation retry exhausted");
}
