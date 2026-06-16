import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chargeCardOnFile, tierPriceCents, nextRenewDate } from "@/lib/square/subscriptions";
import { syncMembershipChange } from "@/lib/brevo/sync";

// Protegido con un secret para que solo Vercel Cron lo llame
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Membresías que vencen hoy o ya vencieron y siguen activas
  const due = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      renewsAt: { lte: now },
      tier: { in: ["ARTESANO", "SELECTO", "LEGENDARIO"] },
      squareCardId: { not: null },
      squareCustomerId: { not: null },
    },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  const results = { renewed: 0, failed: 0, errors: [] as string[] };

  for (const m of due) {
    try {
      const priceCents = tierPriceCents(m.tier as any);

      // Cobrar
      await chargeCardOnFile({
        customerId: m.squareCustomerId!,
        cardId: m.squareCardId!,
        amountCents: priceCents,
        note: `Karyana ${m.tier} renewal`,
        idempotencyKey: `renewal-${m.id}-${now.toISOString().slice(0, 10)}`,
      });

      // Actualizar fecha de renovación
      const nextRenew = nextRenewDate(m.tier as any, now);
      await prisma.membership.update({
        where: { id: m.id },
        data: {
          renewsAt: nextRenew,
          isTrial: false,
          lastRenewedAt: now,
        },
      });

      if (m.user?.email) {
        syncMembershipChange({
          email: m.user.email,
          tier: m.tier,
          status: "ACTIVE",
        });
      }

      results.renewed++;
    } catch (err: any) {
      console.error(`[cron] renewal failed for membership ${m.id}:`, err.message);

      // Si falla el cobro, cancelar la membresía
      await prisma.membership.update({
        where: { id: m.id },
        data: { status: "PAST_DUE", endsAt: now },
      });

      if (m.user?.email) {
        syncMembershipChange({
          email: m.user.email,
          tier: m.tier,
          status: "PAST_DUE",
        });
      }

      results.failed++;
      results.errors.push(`${m.id}: ${err.message}`);
    }
  }

  console.log("[cron] renewal results:", results);
  return NextResponse.json(results);
}