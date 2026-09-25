import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { toE164 } from "@/lib/sms/twilio";
import { syncCustomerToSanity } from "@/lib/sanity/sync-customers";

/**
 * Carries a phone number edited in Studio back to the customer's real record.
 *
 * Studio is a mirror — the site rewrites those documents from the database
 * daily. Without this, a corrected number would look saved, sit there until the
 * next sync, and quietly revert. Worse, the customer's texts would keep going
 * to the old number the whole time, with the screen showing the new one.
 *
 * Phone is the only field this accepts. Everything else in that document is
 * read-only in Studio for the same reason, and an endpoint that took whatever
 * it was handed would be a way to rewrite customer records from outside.
 */
function verify(req: Request, body: string): boolean {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) return true; // dev convenience, same as the order webhook

  const sig = req.headers.get("sanity-webhook-signature") ?? "";
  const [, hash = ""] = sig.split("=");
  const expected = createHmac("sha256", secret).update(body).digest("hex");

  const a = Buffer.from(hash);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 10 or 11 digits, nothing else — a typo must not silently become a phone number. */
function normalizePhone(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return toE164(digits);
  if (digits.length === 11 && digits.startsWith("1")) return toE164(`+${digits}`);
  return null;
}

export async function POST(req: Request) {
  const raw = await req.text();

  if (!verify(req, raw)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const prismaId: string | undefined = payload?.prismaId;
  if (!prismaId) {
    return NextResponse.json({ error: "Missing prismaId" }, { status: 400 });
  }

  // An empty field is a deliberate "we don't have a number", which is different
  // from a value we couldn't make sense of.
  const hasPhoneKey = "phone" in (payload ?? {});
  if (!hasPhoneKey) {
    return NextResponse.json({ ok: true, ignored: "no phone in payload" });
  }

  const cleared = payload.phone === null || payload.phone === "";
  const phone = cleared ? null : normalizePhone(payload.phone);

  if (!cleared && phone === null) {
    return NextResponse.json(
      { error: `Not a valid phone number: ${String(payload.phone)}` },
      { status: 400 }
    );
  }

  try {
    const before = await prisma.user.findUnique({
      where: { id: prismaId },
      select: { phone: true, email: true },
    });

    if (!before) {
      return NextResponse.json({ error: "No such customer" }, { status: 404 });
    }

    if (before.phone === phone) {
      return NextResponse.json({ ok: true, unchanged: true });
    }

    await prisma.user.update({ where: { id: prismaId }, data: { phone } });

    console.log(
      `[sanity-customer webhook] ${before.email}: phone ${before.phone ?? "(none)"} → ${phone ?? "(none)"}`
    );

    // Write the document back from the database, so Studio shows the stored,
    // normalized value rather than whatever was typed.
    await syncCustomerToSanity(prismaId);

    return NextResponse.json({ ok: true, phone });
  } catch (err: any) {
    console.error("[sanity-customer webhook] update failed:", err?.message ?? err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
