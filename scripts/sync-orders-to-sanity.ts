import { createClient } from "next-sanity";
import { prisma } from "../lib/prisma";
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-02-19",
  token: process.env.SANITY_API_WRITE_TOKEN!,
  useCdn: false,
});

async function run() {
  const orders = await prisma.order.findMany({
    where: {
      status: {
        notIn: ["PENDING", "CANCELLED"],
      },
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      address: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  console.log(`Syncing ${orders.length} orders to Sanity...`);

  for (const o of orders) {
    const items = Array.isArray(o.items)
      ? (o.items as any[]).map((it) => ({
          _key: it.productId || it.slug || Math.random().toString(36),
          name: it.name || it.productId,
          quantity: it.quantity,
          price: (it.price || 0) / 100,
        }))
      : [];

    const doc = {
      _id: `order-${o.id}`,
      _type: "order",
      prismaId: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || o.guestName || "Guest",
      customerEmail: o.user?.email || o.guestEmail || "",
      customerPhone: o.user?.phone || o.guestPhone || "",
      fulfillmentType: o.fulfillmentType,
      total: o.total / 100,
      items,
      deliveryAddress: o.address
        ? `${o.address.street}, ${o.address.city} ${o.address.postalCode}`
        : null,
      pickupDate: o.pickupDate
        ? o.pickupDate.toLocaleDateString("en-CA")
        : null,
      notes: o.notes || null,
      status: o.status === "IN_PROGRESS" || o.status === "CONFIRMED"
        ? "IN_PROGRESS"
        : o.status,
      createdAt: o.createdAt.toISOString(),
    };

    await sanity.createOrReplace(doc);
    console.log(`  ✓ ${o.orderNumber} (${o.status})`);
  }

  console.log("\n✅ Done. Open Studio → Orders to manage.");
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());