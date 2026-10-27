import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import MembershipWelcome from "@/emails/MembershipWelcome";
import { TIERS, type MembershipTier } from "@/lib/membership/tiers";
import { resolveCustomerLocale } from "@/lib/notifications/order-messages";
import type { BenefitMode } from "@/lib/membership/benefit";

/**
 * The email somebody gets for paying.
 *
 * The template existed and nothing ever sent it: a customer handed over $30
 * and heard nothing at all, so the first thing they saw from their membership
 * was a charge on their statement. This is the gap that was being asked about.
 *
 * It says which of the two things they chose, because that is the part they
 * will want to check — and the part they can change.
 */
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

function benefitLines(
  tier: MembershipTier,
  mode: BenefitMode,
  pointsGranted: number,
  locale: "en" | "es"
): string[] {
  const data = TIERS[tier];
  const points = `${pointsGranted} ${locale === "es" ? "puntos" : "points"} ($${(pointsGranted / 100).toFixed(2)})`;

  const lines: string[] = [];

  if (pointsGranted > 0) {
    lines.push(
      locale === "es"
        ? `Tu pago se convirtió en ${points} para gastar en pan.`
        : `Your payment became ${points} to spend on bread.`
    );
  }

  if (mode === "WEEKLY_BOX") {
    lines.push(
      locale === "es"
        ? "Cada semana preparamos tu caja. Se paga con tus puntos, y solo cobramos a tu tarjeta lo que falte."
        : "We make up your box every week. It's paid from your points, and your card only covers what they don't."
    );
    lines.push(
      locale === "es"
        ? "Te escribimos cada martes por si quieres saltarte una semana o cambiar lo que lleva."
        : "We email you each Tuesday in case you want to skip a week or change what's in it."
    );
  } else {
    lines.push(
      locale === "es"
        ? "Sin caja automática: pides cuando quieras y pagas con tus puntos."
        : "No automatic box: order whenever you like and pay with your points."
    );
  }

  lines.push(
    locale === "es"
      ? `Ganas ${data.pointsMultiplier}x puntos en cada orden.`
      : `You earn ${data.pointsMultiplier}x points on every order.`
  );

  return lines;
}

export async function sendMembershipWelcomeEmail(input: {
  email: string;
  name: string | null;
  tier: MembershipTier;
  benefitMode: BenefitMode;
  pointsGranted: number;
  preferredLang?: string | null;
  langChosenByUser?: boolean | null;
}): Promise<boolean> {
  const locale = resolveCustomerLocale({
    preferredLang: input.preferredLang,
    langChosenByUser: input.langChosenByUser,
    name: input.name,
  });

  const data = TIERS[input.tier];

  try {
    const html = await render(
      MembershipWelcome({
        appUrl: APP_URL,
        customerName: input.name ?? (locale === "es" ? "hola" : "there"),
        tierName: data.name,
        pointsMultiplier: data.pointsMultiplier,
        benefits: benefitLines(input.tier, input.benefitMode, input.pointsGranted, locale),
        locale,
      })
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject:
        locale === "es"
          ? `Bienvenido a ${data.name} — Karyana Bakery`
          : `Welcome to ${data.name} — Karyana Bakery`,
      html,
    });
    return true;
  } catch (err: any) {
    // The membership is paid for either way; a bounced email must not undo it.
    console.error(`[membership-email] ${input.email} failed:`, err?.message ?? err);
    return false;
  }
}
