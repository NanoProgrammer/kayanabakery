import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { render } from "@react-email/render";
import CreditExpirationReminder from "@/emails/CreditExpirationReminder";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://karyanabakery.ca";
const REMINDER_DAYS = [30, 7, 2, 1];

/**
 * Runs daily. Sends reminder emails at 30/7/2/1 days before the Feb 1
 * expiration date, but only if an admin has actually set a policy for
 * that year (Section 15 / 16 of the membership spec). If no policy
 * exists, nothing is sent — points never expire silently by default.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // The relevant Feb 1 is next year's if we're already past Feb 1 this year, else this year's.
  const febYear = now.getMonth() === 0 && now.getDate() === 1 ? now.getFullYear() : (
    now < new Date(now.getFullYear(), 1, 1) ? now.getFullYear() : now.getFullYear() + 1
  );
  const feb1 = new Date(febYear, 1, 1);
  const daysLeft = Math.round((feb1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (!REMINDER_DAYS.includes(daysLeft)) {
    return NextResponse.json({ skipped: true, daysLeft });
  }

  const policy = await prisma.creditExpirationPolicy.findUnique({ where: { year: febYear } });
  if (!policy) {
    return NextResponse.json({ skipped: true, reason: "No policy set for this year" });
  }

  const users = await prisma.user.findMany({
    where: { pointsBalance: { gt: 0 } },
    select: { id: true, email: true, name: true, pointsBalance: true, preferredLang: true },
  });

  const expirationDateLabel = feb1.toLocaleDateString("en-CA", {
    month: "long", day: "numeric", year: "numeric",
  });

  let sent = 0;
  for (const u of users) {
    if (!u.email) continue;
    try {
      const locale = (u.preferredLang as "en" | "es") ?? "en";
      const html = await render(
        CreditExpirationReminder({
          appUrl: APP_URL,
          customerName: u.name ?? "there",
          balanceDollars: `$${(u.pointsBalance / 100).toFixed(2)}`,
          daysLeft,
          expirationDateLabel,
          mode: policy.mode,
          locale,
        })
      );
      await resend.emails.send({
        from: FROM_EMAIL,
        to: u.email,
        subject:
          locale === "es"
            ? `Tus puntos vencen el ${expirationDateLabel}`
            : `Your points expire ${expirationDateLabel}`,
        html,
      });
      sent++;
    } catch (err: any) {
      console.warn(`[cron] credit-expiration-reminders failed for ${u.id}:`, err.message);
    }
  }

  return NextResponse.json({ daysLeft, sent, policy: policy.mode });
}
