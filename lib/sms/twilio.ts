/**
 * Minimal Twilio REST API client — plain fetch, no SDK dependency.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.
 * WhatsApp sending additionally needs TWILIO_WHATSAPP_FROM.
 */

/** Twilio rejects scheduled sends less than 15 minutes out. */
export const MIN_SCHEDULE_LEAD_MS = 15 * 60 * 1000;

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
 * Hands a message to Twilio now to be delivered later, so order
 * notifications don't need anything polling for their send time.
 *
 * Twilio's constraints shape the callers:
 *  - Scheduling requires a Messaging Service; a bare From number can't do it.
 *  - The send time must be at least 15 minutes out, so anything sooner has to
 *    be sent immediately instead.
 *  - A scheduled WhatsApp message always lands outside the 24-hour customer
 *    service window, where free-form text is rejected — it has to go out as an
 *    approved template (a Content SID). Without one configured, this falls
 *    back to scheduling an SMS rather than scheduling something that will fail.
 *
 * Returns the message SID (needed to cancel it later), or null when the
 * message couldn't be scheduled and a caller-side fallback should take over.
 */
export async function scheduleMessage(opts: {
  to: string;
  body: string;
  sendAt: Date;
  contentSid?: string | null;
  contentVariables?: Record<string, string>;
}): Promise<string | null> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || !messagingServiceSid) {
    console.log(
      "[twilio] TWILIO_MESSAGING_SERVICE_SID missing — cannot schedule, caller should fall back"
    );
    return null;
  }

  if (opts.sendAt.getTime() - Date.now() < MIN_SCHEDULE_LEAD_MS) {
    return null;
  }

  const useWhatsAppTemplate = Boolean(
    opts.contentSid && process.env.TWILIO_WHATSAPP_FROM
  );

  const params = new URLSearchParams({
    To: useWhatsAppTemplate ? `whatsapp:${toE164(opts.to)}` : toE164(opts.to),
    MessagingServiceSid: messagingServiceSid,
    ScheduleType: "fixed",
    SendAt: opts.sendAt.toISOString(),
  });

  if (useWhatsAppTemplate) {
    params.set("ContentSid", opts.contentSid!);
    if (opts.contentVariables) {
      params.set("ContentVariables", JSON.stringify(opts.contentVariables));
    }
  } else {
    params.set("Body", opts.body);
  }

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
    throw new Error(`Twilio schedule failed: ${res.status} ${detail}`);
  }

  const json = (await res.json().catch(() => null)) as { sid?: string } | null;
  return json?.sid ?? null;
}

/** Cancels a still-pending scheduled message (e.g. the order was cancelled). */
export async function cancelScheduledMessage(sid: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${sid}.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ Status: "canceled" }),
    }
  );

  // Already sent or already canceled comes back 4xx — not worth throwing over.
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.warn(`[twilio] cancel ${sid} returned ${res.status}: ${detail}`);
  }
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
