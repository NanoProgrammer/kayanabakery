/**
 * Calls off the "ready" / "completed" texts that are still queued at Twilio.
 *
 *   npm run messages:pending          list what is still scheduled
 *   npm run messages:cancel           cancel them and clear the records
 *
 * Checkout used to schedule both at guessed times — an hour before the pickup
 * window, 11 PM on the day — and the guesses were wrong often enough that a
 * customer drove over for bread that wasn't ready. Nothing schedules them any
 * more, but orders taken before that change still have messages sitting at
 * Twilio waiting to fire, and removing the code does not call those off.
 *
 * Only touches orders that are still open: a message for an order already
 * completed or cancelled has either gone out or been cancelled with it.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

async function main() {
  const cancel = process.argv.slice(2).some((a) => a === "cancel");

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      OR: [{ readyMsgSid: { not: null } }, { completedMsgSid: { not: null } }],
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      fulfillmentType: true,
      readyMsgSid: true,
      completedMsgSid: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!orders.length) {
    console.log("\nNo open order has a message still queued at Twilio.\n");
    await prisma.$disconnect();
    return;
  }

  console.log(`\n${orders.length} open order(s) with messages still queued:\n`);
  for (const o of orders) {
    const which = [
      o.readyMsgSid ? '"ready"' : null,
      o.completedMsgSid ? '"completed"' : null,
    ].filter(Boolean);
    console.log(`  ${o.orderNumber.padEnd(22)} ${o.status.padEnd(14)} ${o.fulfillmentType.padEnd(9)} ${which.join(" + ")}`);
  }

  if (!cancel) {
    console.log("\nThese will still be sent by Twilio at their scheduled time.");
    console.log("To call them off:  npm run messages:cancel\n");
    await prisma.$disconnect();
    return;
  }

  const { cancelOrderNotifications } = await import(
    "../lib/notifications/schedule-order-messages"
  );

  let cleared = 0;
  for (const o of orders) {
    // Clear the record whatever Twilio says: a sid that cannot be cancelled is
    // one that already went out or never existed, and either way keeping it
    // only makes the next run try again forever.
    await cancelOrderNotifications({
      readyMsgSid: o.readyMsgSid,
      completedMsgSid: o.completedMsgSid,
    });
    await prisma.order.update({
      where: { id: o.id },
      data: { readyMsgSid: null, completedMsgSid: null },
    });
    cleared++;
  }

  console.log(`\n${cleared} order(s) cleared. Nothing is queued for them now.`);
  console.log("Status changes made in Studio still text the customer.\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
