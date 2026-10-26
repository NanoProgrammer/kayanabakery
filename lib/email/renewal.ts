import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import RenewalIssue from "@/emails/RenewalIssue";
import { resolveCustomerLocale } from "@/lib/notifications/order-messages";
import { graceDaysLeft } from "@/lib/membership/renewal";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

const TIER_NAME: Record<string, string> = {
  ARTESANO: "Artesano",
  SELECTO: "Selecto",
  LEGENDARIO: "Legendario",
};

type Recipient = {
  email: string;
  name: string | null;
  tier: string;
  preferredLang?: string | null;
  langChosenByUser?: boolean | null;
};

async function send(
  to: Recipient,
  daysLeft: number,
  subject: { en: string; es: string }
): Promise<boolean> {
  if (!to.email) return false;

  const locale = resolveCustomerLocale({
    preferredLang: to.preferredLang,
    langChosenByUser: to.langChosenByUser,
    name: to.name,
  });

  try {
    const html = await render(
      RenewalIssue({
        appUrl: APP_URL,
        customerName: to.name ?? (locale === "es" ? "hola" : "there"),
        tierName: TIER_NAME[to.tier] ?? to.tier,
        locale,
        daysLeft,
      })
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: to.email,
      subject: subject[locale],
      html,
    });
    return true;
  } catch (err: any) {
    // A membership must not be left un-renewed because an email bounced.
    console.error(`[renewal-email] ${to.email} failed:`, err?.message ?? err);
    return false;
  }
}

/** The card was declined; benefits continue until endsAt while we retry. */
export async function sendRenewalFailedEmail(
  to: Recipient & { endsAt: Date; reason: string }
): Promise<boolean> {
  console.log(`[renewal] telling ${to.email} their card declined: ${to.reason}`);
  return send(to, Math.max(1, graceDaysLeft(to.endsAt)), {
    en: "We couldn't charge your Karyana membership",
    es: "No pudimos cobrar tu membresía de Karyana",
  });
}

/** The grace period ran out. */
export async function sendMembershipEndedEmail(to: Recipient): Promise<boolean> {
  return send(to, 0, {
    en: "Your Karyana membership has ended",
    es: "Tu membresía de Karyana terminó",
  });
}
