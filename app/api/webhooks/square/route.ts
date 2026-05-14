import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { TIERS } from "@/lib/membership/tiers";

/**
 * Square webhook handler.
 * Documentation: https://developer.squareup.com/docs/webhooks/build-with-webhooks
 *
 * Events handled:
 * - subscription.created / subscription.updated / subscription.canceled
 * - invoice.payment_made
 *
 * Setup: configure webhook endpoint in Square Dashboard:
 *   {NEXT_PUBLIC_APP_URL}/api/webhooks/square
 * Set SQUARE_WEBHOOK_SIGNATURE_KEY in env.
 */

const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";

function verifySignature(rawBody: string, sig: string, url: string): boolean {
  if (!SIGNATURE_KEY) return process.env.NODE_ENV === "development";
  const stringToSign = url + rawBody;
  const expected = crypto
    .createHmac("sha256", SIGNATURE_KEY)
    .update(stringToSign)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(sig)
    );
  } catch {
    return false;
  }
}

function variationIdToTier(
  variationId?: string
): "ARTESANO" | "SELECTO" | "LEGENDARIO" | null {
  if (!variationId) return null;
  if (variationId === process.env.SQUARE_PLAN_ARTESANO_VARIATION_ID)
    return "ARTESANO";
  if (variationId === process.env.SQUARE_PLAN_SELECTO_VARIATION_ID)
    return "SELECTO";
  if (variationId === process.env.SQUARE_PLAN_LEGENDARIO_VARIATION_ID)
    return "LEGENDARIO";
  return null;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-square-hmacsha256-signature") ?? "";
  const url = process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/square";

  if (!verifySignature(rawBody, sig, url)) {
    console.warn("[square webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.type as string;
  console.log(`[square webhook] ${type}`);

  try {
    switch (type) {
      case "subscription.created":
      case "subscription.updated": {
        const sub = event.data?.object?.subscription;
        if (!sub) break;
        const tier = variationIdToTier(sub.plan_variation_id);
        if (!tier) {
          console.warn(`[square] unknown plan variation ${sub.plan_variation_id}`);
          break;
        }
        // Find user by Square customer id
        const user = await prisma.user.findFirst({
          where: { squareCustomerId: sub.customer_id },
        });
        if (!user) {
          console.warn(`[square] no user for customer ${sub.customer_id}`);
          break;
        }
        const status = sub.status as string;
        const mappedStatus =
          status === "ACTIVE"
            ? "ACTIVE"
            : status === "CANCELED"
            ? "CANCELED"
            : status === "PAUSED"
            ? "PAUSED"
            : "INACTIVE";

        await prisma.membership.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            tier,
            status: mappedStatus,
            squareSubscriptionId: sub.id,
            startedAt: sub.start_date ? new Date(sub.start_date) : new Date(),
            renewsAt: sub.charged_through_date
              ? new Date(sub.charged_through_date)
              : null,
          },
          update: {
            tier,
            status: mappedStatus,
            squareSubscriptionId: sub.id,
            renewsAt: sub.charged_through_date
              ? new Date(sub.charged_through_date)
              : null,
            // Mark canceled time but keep tier active until period ends
            ...(status === "CANCELED" && sub.canceled_date
              ? { endsAt: new Date(sub.charged_through_date ?? sub.canceled_date) }
              : {}),
          },
        });
        break;
      }

      case "subscription.canceled": {
        const sub = event.data?.object?.subscription;
        if (!sub) break;
        await prisma.membership.updateMany({
          where: { squareSubscriptionId: sub.id },
          data: {
            status: "CANCELED",
            endsAt: sub.charged_through_date
              ? new Date(sub.charged_through_date)
              : new Date(),
          },
        });
        break;
      }

      case "invoice.payment_made": {
        const invoice = event.data?.object?.invoice;
        if (!invoice) break;
        // Award birthday/anniversary bonuses, push renewsAt
        if (invoice.subscription_id) {
          const m = await prisma.membership.findFirst({
            where: { squareSubscriptionId: invoice.subscription_id },
            include: { user: true },
          });
          if (m && m.user) {
            const tierData = TIERS[m.tier as keyof typeof TIERS];
            // Award birthday points if it's the user's birth month
            const now = new Date();
            const birthday = m.user.birthday;
            if (
              birthday &&
              birthday.getMonth() === now.getMonth() &&
              tierData.birthdayPoints > 0 &&
              m.user.pointsBirthdayClaimed !== now.getFullYear()
            ) {
              await prisma.user.update({
                where: { id: m.user.id },
                data: {
                  pointsBalance: { increment: tierData.birthdayPoints },
                  pointsBirthdayClaimed: now.getFullYear(),
                },
              });
              await prisma.pointsTransaction.create({
                data: {
                  userId: m.user.id,
                  amount: tierData.birthdayPoints,
                  type: "BIRTHDAY",
                  note: `Birthday bonus ${now.getFullYear()}`,
                },
              });
            }
          }
        }
        break;
      }

      default:
        // Other events ignored
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[square webhook] processing error", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

// Square sends GET on test/health checks
export async function GET() {
  return NextResponse.json({ ok: true });
}
