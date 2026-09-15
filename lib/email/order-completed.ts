import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import OrderCompleted from "@/emails/OrderCompleted";
import type { Locale } from "@/lib/notifications/order-messages";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

const SUBJECT: Record<Locale, (orderNumber: string) => string> = {
  es: (n) => `Tu pedido ${n} fue completado — Karyana Bakery`,
  en: (n) => `Your order ${n} is complete — Karyana Bakery`,
};

/**
 * Completion email, shared by the two paths that can complete an order: a
 * staff member changing the status in Studio, and the automatic close-out at
 * 11 PM. It used to live only in the Studio webhook, so orders that completed
 * on their own sent the customer a text but never the email.
 *
 * Note this goes through Resend, not Brevo — Brevo is only wired up for
 * contact and list syncing here, not transactional mail.
 */
export async function sendOrderCompletedEmail(input: {
  email: string | null | undefined;
  orderNumber: string;
  customerName: string;
  locale: Locale;
}): Promise<boolean> {
  if (!input.email) return false;

  try {
    const html = await render(
      OrderCompleted({
        appUrl: APP_URL,
        orderNumber: input.orderNumber,
        customerName: input.customerName,
        locale: input.locale,
      })
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject: SUBJECT[input.locale](input.orderNumber),
      html,
    });

    return true;
  } catch (err) {
    console.error(
      `[email] completion email failed for ${input.orderNumber}:`,
      err instanceof Error ? err.message : err
    );
    return false;
  }
}
