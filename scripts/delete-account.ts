/**
 * Deletes a customer's account.
 *
 *   npm run user:delete -- someone@example.com          what would happen
 *   npm run user:delete:apply -- someone@example.com    do it
 *
 * Usually the wrong tool. The reason an account gets deleted is almost always
 * "they can't sign in, so let's start over" — and that loses their orders'
 * names, their points and their membership, when a password link would have
 * fixed it in a minute. The dry run says so when it applies.
 *
 * What goes with the account: membership, saved addresses, points history,
 * referrals, and the Google/password sign-in records. Orders do NOT go — they
 * are the bakery's own record of money taken — but they are left pointing at
 * nobody, so the customer's name and contact details are copied onto each one
 * first. An order nobody can be matched to is worse than no deletion at all.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("apply");
  const email = args.find((a) => a.includes("@"))?.toLowerCase().trim();

  if (!email) {
    console.error("\nUsage: npm run user:delete -- someone@example.com\n");
    process.exit(1);
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      password: true,
      pointsBalance: true,
      createdAt: true,
      membership: { select: { tier: true, status: true } },
      accounts: { select: { provider: true } },
      _count: { select: { orders: true, addresses: true, pointsLedger: true } },
    },
  });

  if (!user) {
    console.log(`\nNo account with the email ${email}.\n`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const paid = await prisma.order.count({
    where: { userId: user.id, paymentStatus: "PAID" },
  });

  console.log(`\n${user.name ?? "(no name)"}  <${user.email}>`);
  console.log(`  Customer since   ${user.createdAt.toISOString().slice(0, 10)}`);
  console.log(`  Orders           ${user._count.orders} (${paid} paid)`);
  console.log(`  Points           ${user.pointsBalance}`);
  console.log(`  Membership       ${user.membership ? `${user.membership.tier} · ${user.membership.status}` : "none"}`);
  console.log(`  Addresses        ${user._count.addresses}`);
  console.log(`  Signs in with    ${user.accounts.map((a) => a.provider).join(", ") || (user.password ? "email and password" : "NOTHING — no password, no Google")}`);
  console.log("");

  console.log("  Deleting removes: membership, addresses, points history, sign-ins.");
  console.log(`  Their ${user._count.orders} order(s) stay, with their name copied onto each.\n`);

  // The reason this script usually gets reached for.
  if (!user.password) {
    console.log("  ⚠ This account has no password, which is why nobody can sign in to it.");
    console.log("    Deleting and starting over is not needed — give them a link instead:");
    console.log(`      npm run user:reset-link -- ${user.email}\n`);
  }

  if (!apply) {
    console.log("Dry run — nothing was deleted.");
    console.log(`To delete:  npm run user:delete:apply -- ${user.email}\n`);
    await prisma.$disconnect();
    return;
  }

  // Their name and contact details go onto the orders before the account that
  // holds them is gone. Done first: if this fails, nothing is deleted.
  const kept = await prisma.order.updateMany({
    where: { userId: user.id, guestEmail: null },
    data: {
      guestName: user.name,
      guestEmail: user.email,
      guestPhone: user.phone,
    },
  });

  await prisma.user.delete({ where: { id: user.id } });

  console.log(`Deleted ${user.email}.`);
  console.log(`  ${kept.count} order(s) kept, now carrying their name and contact details.`);
  console.log("  The email address is free again.\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
