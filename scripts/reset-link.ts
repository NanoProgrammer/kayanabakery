/**
 * Makes a password reset link for one customer, to send them by hand.
 *
 *   npm run user:reset-link -- odette@example.com
 *
 * For the case the bakery is standing in front of: a customer on the phone who
 * cannot get in, right now. It prints the link rather than emailing it, so it
 * can be read out, texted, or pasted into whatever the customer is actually
 * reading — and it works before the forgot-password page is even deployed.
 *
 * It also says WHY they are stuck, which is usually that the account signs in
 * with Google and has no password at all, so no password could have been the
 * right one.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { createResetToken, resetLink } from "../lib/auth/password-reset";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

async function main() {
  const email = process.argv.slice(2).find((a) => a.includes("@"));
  if (!email) {
    console.error("\nUsage: npm run user:reset-link -- someone@example.com\n");
    process.exit(1);
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      createdAt: true,
      accounts: { select: { provider: true } },
      _count: { select: { orders: true } },
    },
  });

  if (!user) {
    console.log(`\nNo account with the email ${email}.`);
    console.log("They may have signed up with a different address — search by name:");
    console.log("  npm run members\n");
    await prisma.$disconnect();
    process.exit(1);
  }

  const providers = user.accounts.map((a) => a.provider);

  console.log(`\n${user.name ?? "(no name)"}  <${user.email}>`);
  console.log(`  Customer since ${user.createdAt.toISOString().slice(0, 10)} · ${user._count.orders} order(s)`);
  console.log(`  Password set:  ${user.password ? "yes" : "NO"}`);
  console.log(`  Signs in with: ${providers.length ? providers.join(", ") : "email and password only"}\n`);

  if (!user.password) {
    console.log("  → This is why they cannot sign in: the account has no password.");
    console.log("    It was created with Google, so there is nothing to type.");
    console.log("    They can either use the Google button, or set a password with");
    console.log("    the link below.\n");
  }

  const token = createResetToken(user.id, user.password);

  console.log("  Send them this link. It works for one hour, once:\n");
  console.log(`  ${resetLink(APP_URL, token)}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
