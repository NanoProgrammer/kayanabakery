import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dueForReview, OLDEST_DAYS } from "@/lib/reviews/request";
import { sendReviewRequestEmail } from "@/lib/email/review-request";
import { sendCustomerMessage } from "@/lib/notifications/send";
import { resolveCustomerLocale } from "@/lib/notifications/order-messages";
import { GOOGLE_REVIEW_URL } from "@/lib/reviews/link";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

/**
 * Asks yesterday's customers for a review.
 *
 * Run from the daily dispatcher, which fires around midday, so somebody who
 * collected bread last night is asked while they are having lunch rather than
 * in the car outside the shop. The ask used to ride along with the "your order
 * is complete" message, which is the worst possible moment for it.
 *
 * Anything older than a few days is left alone: switching this on must not
 * message every customer who ever completed an order about bread they have
 * long forgotten.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const floor = new Date(now.getTime() - (OLDEST_DAYS + 2) * 86_400_000);

  const orders = await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      reviewRequestedAt: null,
      completedAt: { gte: floor },
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      completedAt: true,
      reviewRequestedAt: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      user: {
        select: { name: true, email: true, phone: true, preferredLang: true, langChosenByUser: true },
      },
    },
    orderBy: { completedAt: "asc" },
    take: 200,
  });

  const results = { asked: 0, emailed: 0, texted: 0, skipped: 0, errors: [] as string[] };

  for (const order of orders) {
    // The order's own contact fields win over the account's, the same way the
    // status messages read them — a correction made in Studio is the one to use.
    const email = order.guestEmail ?? order.user?.email ?? null;
    const phone = order.guestPhone ?? order.user?.phone ?? null;
    const name = order.user?.name ?? order.guestName ?? null;

    const decision = dueForReview(
      {
        status: order.status,
        completedAt: order.completedAt,
        reviewRequestedAt: order.reviewRequestedAt,
        hasEmail: Boolean(email),
        hasPhone: Boolean(phone),
      },
      now
    );

    if (!decision.ask) {
      results.skipped++;
      continue;
    }

    const locale = resolveCustomerLocale({
      preferredLang: order.user?.preferredLang,
      langChosenByUser: order.user?.langChosenByUser,
      name,
    });

    try {
      if (email) {
        const sent = await sendReviewRequestEmail({
          email,
          customerName: name ?? (locale === "es" ? "hola" : "there"),
          locale,
        });
        if (sent) results.emailed++;
      }

      if (phone) {
        const body =
          locale === "es"
            ? `Karyana Bakery: esperamos que hayas disfrutado tu pan. ¿Nos dejas una reseña? ${GOOGLE_REVIEW_URL}`
            : `Karyana Bakery: we hope you enjoyed your bread. Could you leave us a review? ${GOOGLE_REVIEW_URL}`;
        await sendCustomerMessage(phone, body, APP_URL);
        results.texted++;
      }

      // Stamped whatever each channel did. A retry tomorrow would ask the same
      // person twice, which costs more goodwill than a missed review.
      await prisma.order.update({
        where: { id: order.id },
        data: { reviewRequestedAt: new Date() },
      });
      results.asked++;
    } catch (err: any) {
      console.error(`[cron/review-requests] ${order.orderNumber} failed:`, err?.message ?? err);
      results.errors.push(`${order.orderNumber}: ${err?.message ?? err}`);
    }
  }

  console.log("[cron/review-requests]", results);
  return NextResponse.json(results);
}
