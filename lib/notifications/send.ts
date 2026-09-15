import { sendSms, sendWhatsApp } from "@/lib/sms/twilio";

export type SendChannel = "whatsapp" | "sms" | "none";

/**
 * Sends a customer message over WhatsApp, falling back to SMS.
 *
 * The fallback happens in two places, because Twilio reports the two kinds of
 * failure differently:
 *  - Rejected outright (bad number, misconfigured sender) → the API call
 *    throws here, and we send the SMS immediately.
 *  - Accepted but undeliverable (the number has no WhatsApp account) → Twilio
 *    returns 201 and only reports it later, so the message carries a
 *    StatusCallback and app/api/webhooks/twilio-status sends the SMS when the
 *    delivery report comes back failed.
 *
 * STATUS (Sept 2026): WhatsApp is OFF. The bakery doesn't have a WhatsApp
 * sender approved through Twilio yet, so TWILIO_WHATSAPP_FROM is unset and
 * every notification below goes out as plain SMS — which works fine and needs
 * nothing else configured. The WhatsApp path is left in place rather than
 * deleted: the day the sender is approved, setting TWILIO_WHATSAPP_FROM (and
 * TWILIO_STATUS_CALLBACK_SECRET, so a WhatsApp that fails late still becomes
 * an SMS) turns it on with no code change.
 */
export async function sendCustomerMessage(
  phone: string | null | undefined,
  body: string,
  appUrl: string
): Promise<SendChannel> {
  if (!phone) return "none";

  if (process.env.TWILIO_WHATSAPP_FROM) {
    try {
      await sendWhatsApp(phone, body, buildStatusCallbackUrl(phone, body, appUrl));
      return "whatsapp";
    } catch (err) {
      console.warn(
        "[notify] WhatsApp send rejected, falling back to SMS:",
        err instanceof Error ? err.message : err
      );
    }
  }

  try {
    await sendSms(phone, body);
    return "sms";
  } catch (err) {
    console.error(
      "[notify] SMS send failed:",
      err instanceof Error ? err.message : err
    );
    return "none";
  }
}

function buildStatusCallbackUrl(
  phone: string,
  body: string,
  appUrl: string
): string | undefined {
  const secret = process.env.TWILIO_STATUS_CALLBACK_SECRET;
  if (!secret) return undefined;

  const url = new URL("/api/webhooks/twilio-status", appUrl);
  url.searchParams.set("to", phone);
  url.searchParams.set("body", Buffer.from(body, "utf8").toString("base64url"));
  url.searchParams.set("k", secret);
  return url.toString();
}
