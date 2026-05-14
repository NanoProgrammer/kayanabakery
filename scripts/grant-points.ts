/**
 * Grant points to a user via CLI (admin tool).
 *
 * Usage:
 *   npx tsx scripts/grant-points.ts <email> <amount> "<note>"
 *
 * Example:
 *   npx tsx scripts/grant-points.ts maria@example.com 500 "Customer service"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, amountStr, ...noteParts] = process.argv.slice(2);
  if (!email || !amountStr) {
    console.error('Usage: grant-points <email> <amount> "<note>"');
    process.exit(1);
  }
  const amount = parseInt(amountStr, 10);
  const note = noteParts.join(" ") || "Manual grant via CLI";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { pointsBalance: { increment: amount } },
    });
    await tx.pointsTransaction.create({
      data: {
        userId: user.id,
        amount,
        type: "ADJUSTMENT",
        note,
      },
    });
  });

  const updated = await prisma.user.findUnique({
    where: { id: user.id },
    select: { pointsBalance: true },
  });

  console.log(
    `✓ Granted ${amount} pts to ${email}. New balance: ${updated?.pointsBalance}`
  );
}

main()
  .catch((err) => {
    console.error("Failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
