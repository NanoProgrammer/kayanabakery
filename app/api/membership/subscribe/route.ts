import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureSquareCustomer,
  saveCardOnFile,
  createSquareSubscription,
} from "@/lib/square/subscriptions";

/**
 * POST /api/membership/subscribe
 *
 * Creates a membership for the logged-in user.
 * REQUIRES a sourceId (card token from Square Web Payments SDK).
 * No card on file = no membership. Period.
 *
 * Body: { sourceId: string, tier: "ARTESANO" | "SELECTO" | "LEGENDARIO" }
 *
 * For ARTESANO: first year free (trial), then $39/year auto-renew.
 * For SELECTO/LEGENDARIO: charges immediately.
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { sourceId, tier } = body;

    // Validate tier
    const validTiers = ["ARTESANO", "SELECTO", "LEGENDARIO"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json(
        { error: `Invalid tier. Must be one of: ${validTiers.join(", ")}` },
        { status: 400 }
      );
    }

    // REQUIRE card token
    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { error: "Card is required. Please enter your payment details." },
        { status: 400 }
      );
    }

    // Check existing active membership at this tier or higher
    const existing = await prisma.membership.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        tier: { in: ["ARTESANO", "SELECTO", "LEGENDARIO", "EMBAJADOR"] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already a member", tier: existing.tier },
        { status: 409 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        phone: true,
        squareCustomerId: true,
      },
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Ensure Square Customer exists
    const squareCustomerId = await ensureSquareCustomer({
      existingCustomerId: user.squareCustomerId,
      email: user.email,
      givenName: user.name?.split(" ")[0],
      familyName: user.name?.split(" ").slice(1).join(" "),
      phone: user.phone,
    });

    // Save Square customer ID if new
    if (squareCustomerId !== user.squareCustomerId) {
      await prisma.user.update({
        where: { id: userId },
        data: { squareCustomerId },
      });
    }

    // 2. Save card on file
    const { cardId } = await saveCardOnFile({
      customerId: squareCustomerId,
      sourceId,
    });

    // 3. Create Square subscription (handles trial for Artesano)
    const { subscriptionId, renewDate } = await createSquareSubscription({
      customerId: squareCustomerId,
      cardId,
      tier: tier as any,
    });

    // 4. Create membership in DB
    const now = new Date();
    const renewsAt = renewDate ? new Date(renewDate) : null;

    const membership = await prisma.membership.upsert({
      where: { userId },
      create: {
        userId,
        tier,
        status: "ACTIVE",
        startedAt: now,
        renewsAt,
        squareSubscriptionId: subscriptionId,
      },
      update: {
        tier,
        status: "ACTIVE",
        startedAt: now,
        renewsAt,
        squareSubscriptionId: subscriptionId,
        endsAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      membershipId: membership.id,
      tier,
      squareSubscriptionId: subscriptionId,
      renewDate,
    });
  } catch (err: any) {
    console.error("[membership/subscribe]", err);

    // Square-specific errors
    const squareError = err?.errors?.[0]?.detail;
    if (squareError) {
      return NextResponse.json(
        { error: squareError },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err.message || "Subscription failed" },
      { status: 500 }
    );
  }
}
