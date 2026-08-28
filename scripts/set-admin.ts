/**
 * Dev/admin tool: promote a user to ADMIN (or STAFF) directly in the DB.
 * Needed to access /admin/* pages and the invoice/packing-slip PDF routes,
 * which require role ADMIN or STAFF — a normal signup defaults to CUSTOMER.
 *
 * Usage:
 *   npx tsx scripts/set-admin.ts <email> [ADMIN|STAFF]
 *
 * Example:
 *   npx tsx scripts/set-admin.ts santiagogonzalezjaimes77@gmail.com ADMIN
 *
 * Defaults to ADMIN if the role is omitted.
 */

import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

const prisma = new PrismaClient();

const VALID_ROLES = ["ADMIN", "STAFF"] as const;
type Role = (typeof VALID_ROLES)[number];

async function main() {
  const [email, roleArg] = process.argv.slice(2);
  const role = (roleArg?.toUpperCase() || "ADMIN") as Role;

  if (!email || !VALID_ROLES.includes(role)) {
    console.error(`Usage: set-admin <email> [${VALID_ROLES.join("|")}]`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { role } });

  console.log(`✓ ${email} is now ${role}.`);
  console.log(`  Log out and back in on the site for the new session to pick up the role.`);
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
