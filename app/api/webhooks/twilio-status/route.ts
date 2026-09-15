import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { sendSms } from "@/lib/sms/twilio";

/**
 * Delivery reports for WhatsApp messages.
 *
 * Twilio accepts a WhatsApp message even when the recipient has no WhatsApp
 * account, then reports the failure here minutes later. That makes this the
 * only place the "no WhatsApp → send an SMS instead" fallback can actually
 * happen; a synchronous check at send time would never catch it.
 *
 * The original recipient and message ride along in the callback URL, so no
 * pending-message table is needed.
 */

// Delivery failed for good — retrying WhatsApp won't help, send an SMS.
const FAILED_STATUSES = new Set(["failed", "undelivered"]);

function secretMatches(provided: string | null): boolean {
  const expected = process.env.TWILIO_STATUS_CALLBACK_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, so guard first.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const url = new URL(req.url);

  // Without this the endpoint would be an open SMS relay: anyone who found
  // the URL could make the bakery send messages at its own expense.
  if (!secretMatches(url.searchParams.get("k"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = url.searchParams.get("to");
  const encodedBody = url.searchParams.get("body");
  if (!to || !encodedBody) {
    return NextResponse.json({ error: "Missing to/body" }, { status: 400 });
  }

  const form = await req.formData().catch(() => null);
  const status = String(form?.get("MessageStatus") ?? "").toLowerCase();
  const errorCode = String(form?.get("ErrorCode") ?? "");

  if (!FAILED_STATUSES.has(status)) {
    // delivered/sent/read/queued — nothing to do.
    return NextResponse.json({ ok: true, status });
  }

  const body = Buffer.from(encodedBody, "base64url").toString("utf8");

  try {
    await sendSms(to, body);
    console.log(
      `[twilio-status] WhatsApp ${status} (code ${errorCode}) → SMS fallback sent to ${to}`
    );
    return NextResponse.json({ ok: true, fallback: "sms" });
  } catch (err) {
    console.error("[twilio-status] SMS fallback failed", err);
    return NextResponse.json({ ok: false, error: "SMS fallback failed" });
  }
}
