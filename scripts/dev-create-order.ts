// scripts/dev-create-order.ts
import { prisma } from "../lib/prisma";
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

async function run() {
  const user = await prisma.user.findFirst({
    where: { email: "santiagogonzalezjaimes77@gmail.com" },
  });

  if (!user) {
    console.error("❌ User not found");
    process.exit(1);
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: `KAR-TEST-${Date.now()}`,
      userId: user.id,
      items: [
        {
          productId: "concha-tradicional",
          slug: "concha-tradicional",
          name: "Concha Tradicional",
          price: 4.50,
          quantity: 2,
        },
        {
          productId: "tres-leches-cake",
          slug: "tres-leches-cake",
          name: "Tres Leches Cake",
          price: 55.00,
          quantity: 1,
        },
      ],
      subtotal: 6400,
      total: 6832,
      gst: 432,
      deliveryFee: 0,
      status: "COMPLETED",
      paymentStatus: "PAID",
      fulfillmentType: "PICKUP",
    },
  });

  console.log(`✅ Order created: ${order.orderNumber} (${order.id})`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());