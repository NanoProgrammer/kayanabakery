/**
 * Dev/admin tool: set a user's membership tier directly in the DB,
 * bypassing Square payment. Use this to test tier-gated features
 * (like Weekly Bread Delivery, which only shows for active Selecto
 * or Legendario memberships) without a real charge.
 *
 * Usage:
 *   npx tsx scripts/set-membership.ts <email> <TIER>
 *
 * Example:
 *   npx tsx scripts/set-membership.ts santiagogonzalezjaimes77@gmail.com SELECTO
 *
 * Valid tiers: BASICO, ARTESANO, SELECTO, LEGENDARIO
 */

import { PrismaClient } from "@prisma/client";
import { nextRenewDate } from "../lib/square/subscriptions";

const prisma = new PrismaClient();

const VALID_TIERS = ["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO"] as const;
type Tier = (typeof VALID_TIERS)[number];

async function main() {
  const [email, tierArg] = process.argv.slice(2);
  const tier = tierArg?.toUpperCase() as Tier;

  if (!email || !VALID_TIERS.includes(tier)) {
    console.error(`Usage: set-membership <email> <${VALID_TIERS.join("|")}>`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const now = new Date();
  const renewsAt = tier === "BASICO" ? null : nextRenewDate(tier as any, now);

  const membership = await prisma.membership.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      tier,
      status: "ACTIVE",
      startedAt: now,
      renewsAt,
      isTrial: false,
    },
    update: {
      tier,
      status: "ACTIVE",
      startedAt: now,
      renewsAt,
      cancelledAt: null,
      endsAt: null,
    },
  });

  console.log(`✓ ${email} is now ${tier} (ACTIVE). Membership ID: ${membership.id}`);
  console.log(`  No card was charged — this bypasses Square entirely for testing.`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
