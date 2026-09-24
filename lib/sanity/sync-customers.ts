import { prisma } from "@/lib/prisma";
import { writeClient as sanityClient } from "@/sanity/lib/client";

/**
 * Mirrors customers into Sanity so the bakery can see who their people are
 * without opening a database.
 *
 * The documents carry a deterministic _id built from the Prisma id, so a
 * re-sync updates the same document instead of piling up duplicates — the
 * orders mirror learned that lesson the hard way, where an auto-generated _id
 * meant nothing could be found again by anything but a query.
 *
 * Everything is read-only in Studio. This is a view, not a second source of
 * truth: a tier edited there would change nothing about what the customer is
 * charged, and the next sync would silently undo it.
 */

function docId(prismaId: string): string {
  return `customer-${prismaId}`;
}

type CustomerDoc = {
  _id: string;
  _type: "customer";
  [key: string]: unknown;
};

/**
 * Exported so the shape of what gets written can be checked against a real
 * database without a Sanity project — the mapping is where the mistakes live,
 * not the upload.
 */
export async function buildCustomerDocs(userIds?: string[]): Promise<CustomerDoc[]> {
  const users = await prisma.user.findMany({
    where: userIds ? { id: { in: userIds } } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      preferredLang: true,
      pointsBalance: true,
      createdAt: true,
      membership: {
        select: {
          tier: true,
          status: true,
          isTrial: true,
          startedAt: true,
          renewsAt: true,
          weeklyMode: true,
          weeklyFrequency: true,
          autoDeliveryEnabled: true,
          squareCardId: true,
        },
      },
    },
  });

  if (users.length === 0) return [];

  // Order totals in two grouped queries rather than one per customer, so this
  // stays a handful of round trips no matter how many people there are.
  const ids = users.map((u) => u.id);
  const [totals, lastOrders] = await Promise.all([
    prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, paymentStatus: "PAID" },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: ids } },
      _max: { createdAt: true },
    }),
  ]);

  const totalBy = new Map(totals.map((t) => [t.userId, t]));
  const lastBy = new Map(lastOrders.map((l) => [l.userId, l._max.createdAt]));

  return users.map((u) => {
    const m = u.membership;
    const t = u.id ? totalBy.get(u.id) : undefined;

    return {
      _id: docId(u.id),
      _type: "customer" as const,
      prismaId: u.id,
      name: u.name ?? null,
      email: u.email,
      phone: u.phone ?? null,
      language: u.preferredLang === "es" ? "Español" : "English",

      // "NONE" rather than leaving it out, so the Studio filters can ask for
      // it directly instead of relying on a missing field.
      tier: m?.tier ?? "NONE",
      membershipStatus: m?.status ?? null,
      isTrial: m?.isTrial ?? false,
      memberSince: m?.startedAt?.toISOString() ?? null,
      renewsAt: m?.renewsAt?.toISOString() ?? null,

      weeklyMode: m?.weeklyMode ?? null,
      weeklyFrequency: m?.weeklyFrequency ?? null,
      autoDeliveryEnabled: m?.autoDeliveryEnabled ?? false,
      hasCardOnFile: Boolean(m?.squareCardId),

      pointsBalance: u.pointsBalance ?? 0,
      totalOrders: t?._count._all ?? 0,
      totalSpent: (t?._sum.total ?? 0) / 100,
      lastOrderAt: lastBy.get(u.id)?.toISOString() ?? null,

      joinedAt: u.createdAt.toISOString(),
      syncedAt: new Date().toISOString(),
    };
  });
}

/** Refreshes one customer. Safe to call from a request path — it never throws. */
export async function syncCustomerToSanity(userId: string): Promise<boolean> {
  try {
    const [doc] = await buildCustomerDocs([userId]);
    if (!doc) return false;
    await sanityClient.createOrReplace(doc as never);
    return true;
  } catch (err) {
    console.error(
      `[sanity-customers] sync failed for ${userId}:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}

/**
 * Refreshes everyone. Run from the daily cron so the mirror repairs itself:
 * a customer whose individual sync failed would otherwise stay wrong forever,
 * and nothing about a stale row looks wrong from Studio.
 */
export async function syncAllCustomersToSanity(): Promise<{
  synced: number;
  failed: number;
}> {
  const docs = await buildCustomerDocs();
  let synced = 0;
  let failed = 0;

  // Batched: one transaction per 50 keeps a single bad document from taking
  // the whole run down with it.
  for (let i = 0; i < docs.length; i += 50) {
    const batch = docs.slice(i, i + 50);
    try {
      let tx = sanityClient.transaction();
      for (const doc of batch) tx = tx.createOrReplace(doc as never);
      await tx.commit();
      synced += batch.length;
    } catch (err) {
      failed += batch.length;
      console.error(
        `[sanity-customers] batch ${i / 50} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return { synced, failed };
}
