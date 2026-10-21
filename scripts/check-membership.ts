/**
 * What the site thinks of one person's membership, and why.
 *
 *   npm run membership:check -- someone@example.com
 *   npm run membership:check -- someone@example.com SELECTO   repair it
 *
 * With a tier it sets that tier ACTIVE, which is the fix when a membership was
 * paid for but its row was left in some other state. It never touches Square:
 * if there is a real subscription behind this, sort that out there too.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import {
  effectiveTier,
  membershipAccessReason,
  membershipGrantsBenefits,
} from "../lib/membership/access";
import { tierMeets } from "../lib/membership/tiers";

const TIERS = ["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO", "EMBAJADOR"];

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const email = args.find((a) => a.includes("@"));
  const newTier = args.find((a) => TIERS.includes(a.toUpperCase()))?.toUpperCase();

  if (!email) {
    console.error("\nUsage: npm run membership:check -- someone@example.com [TIER]\n");
    process.exit(1);
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true, email: true, membership: true },
  });

  if (!user) {
    console.log(`\nNo account with the email ${email}\n`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const m = user.membership;

  console.log(`\n${user.name ?? "(no name)"}  <${user.email}>\n`);

  if (!m) {
    console.log("  No membership row at all.\n");
  } else {
    console.log(`  Tier       ${m.tier}`);
    console.log(`  Status     ${m.status}`);
    console.log(`  Started    ${m.startedAt?.toISOString().slice(0, 10) ?? "—"}`);
    console.log(`  Renews     ${m.renewsAt?.toISOString().slice(0, 10) ?? "—"}`);
    console.log(`  Ends       ${m.endsAt?.toISOString().slice(0, 10) ?? "—"}`);
    console.log(`  Square sub ${m.squareSubscriptionId ?? "—"}`);
    console.log("");
  }

  const tier = effectiveTier(m);
  const benefits = membershipGrantsBenefits(m);

  console.log(`  The site treats them as: ${tier}`);
  console.log(`  Reason: ${membershipAccessReason(m)}`);
  console.log(
    `  Members-only products: ${tierMeets(tier, "ARTESANO") ? "allowed" : "BLOCKED"}`
  );
  console.log("");

  if (!newTier) {
    if (m && !benefits) {
      console.log("  To put this membership back:");
      console.log(`    npm run membership:check -- ${user.email} ${m.tier}\n`);
    }
    await prisma.$disconnect();
    return;
  }

  await prisma.membership.upsert({
    where: { userId: user.id },
    create: { userId: user.id, tier: newTier as any, status: "ACTIVE" },
    update: { tier: newTier as any, status: "ACTIVE", endsAt: null, cancelledAt: null },
  });

  const after = await prisma.membership.findUnique({ where: { userId: user.id } });
  console.log(`  Set to ${after?.tier} · ${after?.status}`);
  console.log(`  Now treated as: ${effectiveTier(after)}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
