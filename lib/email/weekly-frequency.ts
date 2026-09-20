import { resend, FROM_EMAIL } from "@/lib/email/resend";
import { resolveCustomerLocale } from "@/lib/notifications/order-messages";

/**
 * Confirms a change to how often the weekly box goes out.
 *
 * Worth an email of its own: switching to every 4 weeks means three weeks with
 * no bread and no reminder, and a member who doesn't remember making the change
 * would read that silence as the bakery forgetting them.
 */
export async function sendFrequencyChangedEmail(input: {
  email: string;
  name: string | null;
  frequency: "WEEKLY" | "EVERY_4_WEEKS";
  preferredLang: string | null;
}): Promise<boolean> {
  const locale = resolveCustomerLocale({
    preferredLang: input.preferredLang,
    name: input.name,
  });
  const monthly = input.frequency === "EVERY_4_WEEKS";
  const name = input.name ?? (locale === "es" ? "hola" : "there");

  const copy = locale === "es"
    ? {
        subject: monthly
          ? "Tu pan ahora llega cada 4 semanas"
          : "Tu pan vuelve a ser cada semana",
        heading: `Hola, ${name}`,
        body: monthly
          ? "Cambiaste tu entrega de pan a <strong>cada 4 semanas</strong>. Te escribiremos solo en la semana que te toque; las otras tres no vas a recibir nada nuestro, y eso es normal."
          : "Cambiaste tu entrega de pan a <strong>cada semana</strong>. Vuelves a recibir tu aviso todos los martes para decidir si lo mandamos o lo saltas.",
        footer: "Puedes cambiarlo cuando quieras desde tu cuenta.",
      }
    : {
        subject: monthly
          ? "Your bread now comes every 4 weeks"
          : "Your bread is back to every week",
        heading: `Hi ${name}`,
        body: monthly
          ? "You switched your bread delivery to <strong>every 4 weeks</strong>. We'll only write to you on your delivery week — the other three you won't hear from us, and that's expected."
          : "You switched your bread delivery to <strong>every week</strong>. You'll get your Tuesday reminder again to send or skip that week's box.",
        footer: "You can change this any time from your account.",
      };

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject: copy.subject,
      html: `
        <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:24px;color:#2B2B2B">
          <h2 style="margin:0 0 12px">${copy.heading}</h2>
          <p style="font-size:15px;line-height:1.6;margin:0 0 16px">${copy.body}</p>
          <p style="font-size:13px;color:#6B6B6B;margin:0">${copy.footer}</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    // The preference itself already saved — a failed confirmation email must
    // not roll that back or surface as an error on the toggle.
    console.error("[weekly-frequency] confirmation email failed:", err);
    return false;
  }
}
