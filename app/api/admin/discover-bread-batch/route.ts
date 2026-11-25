import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { writeClient } from "@/sanity/lib/client";
import {
  eligibleCustomers,
  batchCouponDocument,
  couponCodeForCustomer,
  INITIAL_BATCH_SIZE,
  type PastOrder,
} from "@/lib/coupons/discover-bread-batch";

/**
 * Los primeros cupones DESCUBREPAN, emitidos hacia atrás.
 *
 * GET  → quién califica, sin escribir nada. Para mirar antes de hacer.
 * POST → los crea.
 *
 * Mirar primero y hacer después, en dos verbos distintos, porque esto
 * reparte inventario gratis y abrir una URL por accidente no debe
 * repartirlo.
 */
async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && role !== "STAFF")) return null;
  return session;
}

/** Los pedidos pasados, con lo necesario para saber quién compró qué. */
async function pastOrders(): Promise<PastOrder[]> {
  const orders = await prisma.order.findMany({
    where: { status: { notIn: ["CANCELLED", "PENDING"] } },
    select: {
      createdAt: true,
      items: true,
      userId: true,
      guestEmail: true,
      guestName: true,
      user: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return orders.map((o) => ({
    userId: o.userId,
    email: o.user?.email ?? o.guestEmail,
    name: o.user?.name ?? o.guestName,
    createdAt: o.createdAt,
    lines: (Array.isArray(o.items) ? (o.items as any[]) : [])
      .filter((l) => l && typeof l === "object")
      .map((l) => ({
        name: String(l.name ?? ""),
        slug: typeof l.slug === "string" ? l.slug : null,
        categorySlugs: Array.isArray(l.categorySlugs) ? l.categorySlugs : [],
      })),
  }));
}

function limitFrom(req: Request): number {
  const raw = new URL(req.url).searchParams.get("limit");
  const n = raw ? Number(raw) : INITIAL_BATCH_SIZE;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 200) : INITIAL_BATCH_SIZE;
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = limitFrom(req);
  const candidates = eligibleCustomers(await pastOrders(), limit);

  return NextResponse.json({
    preview: true,
    limit,
    eligible: candidates.length,
    customers: candidates.map((c) => ({
      name: c.name,
      email: c.email,
      code: couponCodeForCustomer(c.userId),
      lastCakeAt: c.lastCakeAt,
      cakeOrders: c.cakeOrders,
    })),
  });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = limitFrom(req);
  const candidates = eligibleCustomers(await pastOrders(), limit);

  if (!candidates.length) {
    return NextResponse.json({ created: 0, customers: [], note: "Nobody qualifies yet." });
  }

  // createIfNotExists, y el id sale del código, que sale del cliente:
  // correr esto dos veces no le da dos cupones a nadie.
  let tx = writeClient.transaction();
  for (const c of candidates) {
    tx = tx.createIfNotExists(batchCouponDocument(c) as never);
  }

  try {
    await tx.commit();
  } catch (err) {
    console.error("[discover-bread batch] could not create:", err);
    return NextResponse.json({ error: "The coupons could not be created." }, { status: 502 });
  }

  return NextResponse.json({
    created: candidates.length,
    customers: candidates.map((c) => ({
      name: c.name,
      email: c.email,
      code: couponCodeForCustomer(c.userId),
    })),
  });
}
