/**
 * Issuing the free cake once ten referrals have joined the Club.
 *
 * The rule itself is in ./free-cake.ts and is tested on its own. This is the
 * part that writes, and it is written so that running it twice cannot hand
 * out two cakes:
 *
 *   - The coupon code is derived from the member's id and which cake it is,
 *     so a second attempt at the same milestone produces the same code and
 *     the unique index on Coupon.code refuses it.
 *   - How many cakes have already been issued is counted from those coupons
 *     rather than from a counter column, so there is one source of truth and
 *     no field to drift.
 */
import { prisma } from "@/lib/prisma";
import { effectiveTier } from "@/lib/membership/access";
import { cakeProgress, freeCakeCode, type ReferredMember } from "./free-cake";

/**
 * The coupon goes into SANITY, not the Prisma Coupon table.
 *
 * The checkout validates a code against Sanity — the Prisma row is only used
 * for counting redemptions — so a coupon written only to Prisma would never
 * be found and the member would be told their code was invalid. Worth
 * stating here because the Prisma model looks like the obvious place.
 */

/** A year to use it. Long enough not to be a trick, short enough to end. */
const VALID_FOR_DAYS = 365;

export type FreeCakeResult =
  | { status: "issued"; code: string; cakeNumber: number }
  | { status: "not_yet"; qualified: number; remaining: number }
  | { status: "already" }
  | { status: "no_user" };

export async function issueFreeCakeIfEarned(userId: string): Promise<FreeCakeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      referrals: {
        select: {
          id: true,
          emailVerified: true,
          membership: { select: { tier: true, status: true, endsAt: true } },
        },
      },
    },
  });
  if (!user) return { status: "no_user" };

  const referred: ReferredMember[] = user.referrals.map((r) => ({
    userId: r.id,
    // effectiveTier takes expiry into account, so a lapsed membership stops
    // counting — the milestone is people who joined and stayed, not people
    // who joined once.
    tier: effectiveTier(r.membership),
    verified: !!r.emailVerified,
  }));

  const { writeClient } = await import("@/sanity/lib/client");

  const suffix = freeCakeCode(user.id, 0).replace(/-0$/, "");
  // Counted from the coupons themselves rather than a counter column, so
  // there is one source of truth and no field that can drift out of step.
  const alreadyIssued = await writeClient.fetch<number>(
    `count(*[_type == "coupon" && string::startsWith(code, $prefix)])`,
    { prefix: `${suffix}-` }
  );

  const progress = cakeProgress(referred, alreadyIssued);
  if (!progress.earned) {
    return { status: "not_yet", qualified: progress.qualified, remaining: progress.remaining };
  }

  const cakeNumber = alreadyIssued + 1;
  const code = freeCakeCode(user.id, cakeNumber);

  // A fixed document id derived from the milestone, with createIfNotExists:
  // issuing the same milestone twice writes nothing the second time, so a
  // retry or two concurrent calls cannot produce two cakes.
  const docId = `coupon-${code.toLowerCase()}`;
  const existing = await writeClient.fetch<string | null>(
    `*[_id == $id][0]._id`,
    { id: docId }
  );
  if (existing) return { status: "already" };

  await writeClient.createIfNotExists({
    _id: docId,
    _type: "coupon",
    code,
    labelEn: `Free cake — ${cakeNumber * 10} Karyana Club referrals`,
    labelEs: `Pastel gratis — ${cakeNumber * 10} referidos del Karyana Club`,
    // A cake, not an amount: 100% off, and limited to the cakes category so
    // it cannot take the rest of the basket with it.
    discountType: "PERCENT",
    discountValue: 100,
    appliesTo: "CATEGORY:cakes",
    maxUses: 1,
    perUserLimit: 1,
    active: true,
    expiresAt: new Date(Date.now() + VALID_FOR_DAYS * 86_400_000).toISOString(),
  });

  return { status: "issued", code, cakeNumber };
}
