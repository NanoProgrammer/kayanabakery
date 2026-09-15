/**
 * Minimal Twilio REST API client — plain fetch, no SDK dependency.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.
 * WhatsApp sending additionally needs TWILIO_WHATSAPP_FROM.
 */

export function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+")) return `+${digits}`;
  // Assume North American number when no country code is present.
  if (digits.length === 10) return `+1${digits}`;
  return `+${digits}`;
}

async function postMessage(params: URLSearchParams): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Twilio send failed: ${res.status} ${detail}`);
  }
}

export async function sendSms(to: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log("[sms] Twilio env vars missing — skipping SMS send");
    return;
  }

  await postMessage(
    new URLSearchParams({
      To: toE164(to),
      From: fromNumber,
      Body: body,
    })
  );
}

/**
 * Sends over WhatsApp. `statusCallbackUrl` matters more than it looks:
 * Twilio accepts a WhatsApp message for a number that has no WhatsApp
 * account and only reports the failure asynchronously, so without a
 * callback there's no way to know the message never arrived — and no way
 * to fall back to SMS. See app/api/webhooks/twilio-status.
 */
export async function sendWhatsApp(
  to: string,
  body: string,
  statusCallbackUrl?: string
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !whatsappFrom) {
    throw new Error("Twilio WhatsApp env vars missing");
  }

  const from = whatsappFrom.startsWith("whatsapp:")
    ? whatsappFrom
    : `whatsapp:${toE164(whatsappFrom)}`;

  const params = new URLSearchParams({
    To: `whatsapp:${toE164(to)}`,
    From: from,
    Body: body,
  });

  if (statusCallbackUrl) params.set("StatusCallback", statusCallbackUrl);

  await postMessage(params);
}
