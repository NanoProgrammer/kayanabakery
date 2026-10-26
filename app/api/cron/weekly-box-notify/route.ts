import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { render } from "@react-email/render";
import WeeklyBoxReminder from "@/emails/WeeklyBoxReminder";
import { weekStartOf, signWeeklyAction } from "@/lib/membership/weekly";
import { weeklyBoxPlan, WEEKLY_TIERS } from "@/lib/membership/weekly-eligibility";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";

const MODE_LABEL: Record<string, { en: string; es: string }> = {
  REPEAT_LAST: { en: "Repeat Last Order", es: "Repetir última orden" },
  CURATED: { en: "Karyana Curated Surprise Box", es: "Caja sorpresa Karyana" },
  MANUAL: { en: "Manual Weekly Decision", es: "Decidir cada semana" },
};

/**
 * Runs Tuesdays. Creates this week's WeeklyOrderLog for every active
 * Selecto/Legendario member who has picked a weekly mode, and emails
 * them the Send/Skip/Edit prompt. Members have until Wednesday 11:59 PM
 * to respond; delivery is Friday.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekStart = weekStartOf(new Date());

  // Restricts the run to one member, for testing the email end to end without
  // writing to real customers. Still behind CRON_SECRET, and it changes who is
  // included, never what happens to them.
  const onlyEmail = new URL(req.url).searchParams.get("onlyEmail");

  // Deliberately broad. Who is in or out is decided by weeklyBoxPlan below, so
  // that an excluded member comes back with a reason instead of simply never
  // appearing — the previous query filtered on status and weeklyMode here, and
  // the members it dropped were invisible to everyone, forever.
  const memberships = await prisma.membership.findMany({
    where: {
      tier: { in: WEEKLY_TIERS as any },
      ...(onlyEmail ? { user: { email: onlyEmail } } : {}),
    },
    include: { user: { select: { id: true, email: true, name: true, preferredLang: true } } },
  });

  const results = {
    notified: 0,
    skippedNoEmail: 0,
    alreadyLogged: 0,
    notDueThisWeek: 0,
    /** Members with no mode of their own, given the default for their history. */
    usedDefaultMode: 0,
    /** Every exclusion, with its reason — an empty run must be explainable. */
    excluded: [] as string[],
    errors: [] as string[],
  };

  for (const m of memberships) {
    if (!m.user?.email) {
      results.skippedNoEmail++;
      continue;
    }

    const plan = weeklyBoxPlan(
      {
        tier: m.tier,
        status: m.status,
        endsAt: m.endsAt,
        weeklyMode: m.weeklyMode as never,
        weeklyFrequency: m.weeklyFrequency,
        weeklyAnchorAt: m.weeklyAnchorAt,
        // Only looked up when it can change the answer: it decides the default
        // mode for a member who never picked one.
        hasPreviousOrder: m.weeklyMode
          ? true
          : (await prisma.order.count({
              where: { userId: m.userId, status: { not: "CANCELLED" } },
            })) > 0,
      },
      weekStart
    );

    if (!plan.include) {
      // Members on the every-4-weeks rhythm only hear from us on their own
      // weeks; everything else here is a member who should be told why.
      if (plan.reason === "not due this week") results.notDueThisWeek++;
      else results.excluded.push(`${m.user.email}: ${plan.reason}`);
      continue;
    }

    if (plan.defaulted) results.usedDefaultMode++;

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
          modeSnapshot: plan.mode,
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
          modeLabel: MODE_LABEL[plan.mode][locale],
          frequencyLabel:
            m.weeklyFrequency === "EVERY_4_WEEKS"
              ? locale === "es"
                ? "Cada 4 semanas"
                : "Every 4 weeks"
              : locale === "es"
              ? "Cada semana"
              : "Every week",
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

  console.log(
    `[cron] weekly-box-notify${onlyEmail ? ` (only ${onlyEmail})` : ""} results:`,
    results
  );
  return NextResponse.json({ ...results, onlyEmail: onlyEmail ?? null });
}
