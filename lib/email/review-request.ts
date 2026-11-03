import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import ReviewRequest from "@/emails/ReviewRequest";
import { GOOGLE_REVIEW_URL } from "@/lib/reviews/link";
import type { Locale } from "@/lib/notifications/order-messages";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

export async function sendReviewRequestEmail(input: {
  email: string;
  customerName: string;
  locale: Locale;
}): Promise<boolean> {
  try {
    const html = await render(
      ReviewRequest({
        appUrl: APP_URL,
        customerName: input.customerName,
        reviewUrl: GOOGLE_REVIEW_URL,
        locale: input.locale,
      })
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject:
        input.locale === "es"
          ? "¿Nos regalas un minuto? — Karyana Bakery"
          : "Could you spare a minute? — Karyana Bakery",
      html,
    });
    return true;
  } catch (err: any) {
    console.error(`[review-request] ${input.email} failed:`, err?.message ?? err);
    return false;
  }
}
