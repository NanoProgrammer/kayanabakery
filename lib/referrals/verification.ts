import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { resend, FROM_EMAIL } from "@/lib/email/resend";

const TTL_MS = 48 * 60 * 60 * 1000;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.karyanabakery.ca";

function secret() {
  const value = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET required for referral verification");
  return value;
}

function mac(encoded: string, email: string): string {
  return createHmac("sha256", secret())
    .update(encoded + ":" + email.trim().toLowerCase())
    .digest("base64url");
}

export function referralVerificationToken(userId: string, email: string, now = new Date()): string {
  const payload = JSON.stringify({ userId, until: now.getTime() + TTL_MS, nonce: randomUUID() });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return encoded + "." + mac(encoded, email);
}

export function readReferralVerificationId(token: string): string | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature || token.length > 2048) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (typeof payload.userId !== "string" || typeof payload.until !== "number") return null;
    if (payload.until < Date.now() || payload.until > Date.now() + TTL_MS) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export function validateReferralVerification(token: string, email: string): boolean {
  const [encoded, signature] = token.split(".");
  if (!readReferralVerificationId(token) || !encoded || !signature) return false;
  const expected = mac(encoded, email);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function sendReferralVerificationEmail(input: {
  id: string;
  email: string;
  name: string | null;
  locale: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error("[referrals] RESEND_API_KEY missing: cannot verify referred member");
    return false;
  }
  const token = referralVerificationToken(input.id, input.email);
  const verifyUrl = APP_URL.replace(/\/$/, "") + "/api/referrals/verify?token=" + encodeURIComponent(token);
  const spanish = input.locale === "es";
  const message = spanish
    ? "Hola " + (input.name || "") + ",\n\nConfirma tu email para completar tu registro en Karyana Club. No necesitas hacer una compra.\n\n" + verifyUrl + "\n\nEste enlace vence en 48 horas. Si no solicitaste esta cuenta, ignora el mensaje."
    : "Hello " + (input.name || "") + ",\n\nConfirm your email to complete your Karyana Club registration. No purchase is required.\n\n" + verifyUrl + "\n\nThis link expires in 48 hours. Ignore it if you did not register.";
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: input.email,
      subject: spanish ? "Confirma tu registro en Karyana Club" : "Verify your Karyana Club registration",
      text: message,
    });
    if (result.error) throw new Error(result.error.message);
    return true;
  } catch (err) {
    console.error("[referrals] verification email failed", err);
    return false;
  }
}
