import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { writeClient } from "@/sanity/lib/client";
import {
  inboundIntent,
  confirmationFor,
  optOutDocId,
  phoneKey,
} from "@/lib/notifications/consent";

/**
 * Replies from customers: STOP, BAJA, START, ALTA. Situación 10.
 *
 * Twilio enforces the English SMS keywords itself, but not the Spanish
 * ones and not on WhatsApp — and most of this customer base writes in
 * Spanish. Somebody who replies BAJA and keeps getting messages has been
 * ignored, whatever the carrier technically did.
 *
 * The reply is TwiML, which is how Twilio wants an answer to an inbound
 * message: the confirmation goes back on the same channel the customer
 * used, so they see their STOP worked.
 *
 * Point Twilio's "A message comes in" webhook at:
 *   /api/webhooks/twilio-inbound?k=<TWILIO_STATUS_CALLBACK_SECRET>
 */
function secretMatches(provided: string | null): boolean {
  const expected = process.env.TWILIO_STATUS_CALLBACK_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function twiml(message: string | null): NextResponse {
  const body = message
    ? `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</Message></Response>`
    : `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
  return new NextResponse(body, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  // Without this anyone who found the URL could opt a customer out, or
  // back in, by posting a number.
  if (!secretMatches(url.searchParams.get("k"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return twiml(null);

  // WhatsApp arrives as "whatsapp:+14035550100"; phoneKey strips all of it.
  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "");
  const key = phoneKey(from);
  if (key.length !== 10) return twiml(null);

  const intent = inboundIntent(body);
  if (intent === "OTHER") {
    // A real message from a customer. Not answered automatically — an
    // auto-reply to someone asking a question is worse than silence,
    // and the bakery reads these in Twilio.
    return twiml(null);
  }

  const docId = optOutDocId(key);
  if (!docId) return twiml(null);

  try {
    if (intent === "STOP") {
      await writeClient.createOrReplace({
        _id: docId,
        _type: "smsOptOut",
        phone: key,
        optedOutAt: new Date().toISOString(),
        keyword: body.trim().slice(0, 40),
      });
    } else {
      // Deleting rather than flagging: the record exists to answer "may
      // we message this number", and a customer who opted back in is a
      // number we may message.
      await writeClient.delete(docId).catch(() => undefined);
    }
  } catch (err) {
    console.error("[twilio-inbound] could not record the request:", err);
    // Still confirm. The customer did their part, and a silence here
    // reads as being ignored; the bakery sees the error in the logs.
  }

  // Spanish if they wrote a Spanish keyword, English otherwise — the one
  // moment we know for certain which language they chose.
  const wroteSpanish = /baja|alta|parar|cancelar|detener|reanudar|sí|si$/i.test(body.trim());
  return twiml(confirmationFor(intent, wroteSpanish ? "es" : "en"));
}
