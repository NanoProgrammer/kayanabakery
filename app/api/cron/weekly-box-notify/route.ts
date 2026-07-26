import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { render } from "@react-email/render";
import WeeklyBoxReminder from "@/emails/WeeklyBoxReminder";
import { weekStartOf, signWeeklyAction } from "@/lib/membership/weekly";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

const MODE_LABEL: Record<string, { en: string; es: string }> = {
  REPEAT_LAST: { en: "Repeat Last Order", es: "Repetir última orden" },
  CURATED: { en: "Karyana Curated Surprise Box", es: "Caja sorpresa Karyana" },
  MANUAL: { en: "Manual Weekly Decision", es: "Decidir cada semana" },
};

/**
 * Runs Thursdays ~6PM local. Creates this week's WeeklyOrderLog for every
 * active Selecto/Legendario member who has picked a weekly mode, and
 * emails them the Send/Skip/Edit prompt from the spec doc.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = weekStartOf(new Date());

  const memberships = await prisma.membership.findMany({
    where: {
      status: "ACTIVE",
      tier: { in: ["SELECTO", "LEGENDARIO"] },
      weeklyMode: { not: null },
    },
    include: { user: { select: { id: true, email: true, name: true, preferredLang: true } } },
  });

  const results = { notified: 0, skippedNoEmail: 0, alreadyLogged: 0, errors: [] as string[] };

  for (const m of memberships) {
    if (!m.user?.email) {
      results.skippedNoEmail++;
      continue;
    }

    try {
      const existing = await prisma.weeklyOrderLog.findUnique({
        where: { membershipId_weekStart: { membershipId: m.id, weekStart } },
      });
      if (existing) {
        results.alreadyLogged++;
        continue;
      }

      const log = await prisma.weeklyOrderLog.create({
        data: {
          membershipId: m.id,
          userId: m.userId,
          weekStart,
          modeSnapshot: m.weeklyMode!,
          status: "PENDING",
        },
      });

      const locale = (m.user.preferredLang as "en" | "es") ?? "en";
      const sendToken = signWeeklyAction(log.id, "send");
      const skipToken = signWeeklyAction(log.id, "skip");

      const html = await render(
        WeeklyBoxReminder({
          appUrl: APP_URL,
          customerName: m.user.name ?? "there",
          modeLabel: MODE_LABEL[m.weeklyMode!][locale],
          sendUrl: `${APP_URL}/api/membership/weekly/action?log=${log.id}&action=send&token=${sendToken}`,
          skipUrl: `${APP_URL}/api/membership/weekly/action?log=${log.id}&action=skip&token=${skipToken}`,
          editUrl: `${APP_URL}/account/membership`,
          locale,
        })
      );

      await resend.emails.send({
        from: FROM_EMAIL,
        to: m.user.email,
        subject:
          locale === "es"
            ? "Tu pan semanal de Karyana está listo 🍞"
            : "Your Karyana weekly bread is ready 🍞",
        html,
      });

      results.notified++;
    } catch (err: any) {
      console.error(`[cron] weekly-box-notify failed for membership ${m.id}:`, err.message);
      results.errors.push(`${m.id}: ${err.message}`);
    }
  }

  console.log("[cron] weekly-box-notify results:", results);
  return NextResponse.json(results);
}
