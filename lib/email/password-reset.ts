import { render } from "@react-email/render";
import { resend, FROM_EMAIL } from "@/lib/email/resend";
import PasswordReset from "@/emails/PasswordReset";
import { resolveCustomerLocale } from "@/lib/notifications/order-messages";
import { resetLink } from "@/lib/auth/password-reset";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

const SUBJECT = {
  reset: { en: "Reset your Karyana password", es: "Restablece tu contraseña de Karyana" },
  set: { en: "Set your Karyana password", es: "Crea tu contraseña de Karyana" },
};

export async function sendPasswordResetEmail(input: {
  email: string;
  name: string | null;
  token: string;
  hasPassword: boolean;
  preferredLang?: string | null;
  langChosenByUser?: boolean | null;
}): Promise<boolean> {
  const locale = resolveCustomerLocale({
    preferredLang: input.preferredLang,
    langChosenByUser: input.langChosenByUser,
    name: input.name,
  });

  try {
    const html = await render(
      PasswordReset({
        appUrl: APP_URL,
        customerName: input.name ?? (locale === "es" ? "hola" : "there"),
        resetUrl: resetLink(APP_URL, input.token),
        hasPassword: input.hasPassword,
        locale,
      })
    );

    await resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject: SUBJECT[input.hasPassword ? "reset" : "set"][locale],
      html,
    });
    return true;
  } catch (err: any) {
    // Logged rather than returned: the endpoint answers the same either way,
    // so a bounce must not become a way to tell whether an account exists.
    console.error(`[password-reset] could not email ${input.email}:`, err?.message ?? err);
    return false;
  }
}
