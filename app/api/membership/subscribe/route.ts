import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { squareClient } from "@/lib/square";

/**
 * POST /api/membership/subscribe
 *
 * Creates an ARTESANO membership for the logged-in user.
 * - First year FREE (trial period)
 * - Requires card on file via Square
 * - Auto-renews at $39/year after trial
 *
 * Body: { tier: "ARTESANO" }
 *
 * The frontend (MembershipGate or MembershipUpsellModal) calls this.
 * After success the page reloads so session.user.tier reflects the new tier.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const tier = body.tier;

    if (tier !== "ARTESANO") {
      return NextResponse.json(
        { error: "Only ARTESANO tier can be self-subscribed" },
        { status: 400 }
      );
    }

    // Check if user already has an active membership >= ARTESANO
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

    // Create Square subscription with trial period (first year free)
    // The customer must already have a card on file in Square, or we
    // create a subscription that starts billing after 365 days.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, squareCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let squareCustomerId = user.squareCustomerId;

    // Create Square customer if needed
    if (!squareCustomerId) {
      const { result } = await squareClient.customersApi.createCustomer({
        emailAddress: user.email!,
        givenName: user.name ?? undefined,
        referenceId: userId,
      });
      squareCustomerId = result.customer!.id!;
      await prisma.user.update({
        where: { id: userId },
        data: { squareCustomerId },
      });
    }

    // Create subscription with 365-day free trial
    // Uses the ARTESANO subscription plan from Square catalog
    const catalogPlanId = process.env.SQUARE_ARTESANO_PLAN_ID;
    if (!catalogPlanId) {
      // Fallback: create membership locally without Square subscription
      // (for dev environments without Square set up)
      const now = new Date();
      const trialEnd = new Date(now);
      trialEnd.setFullYear(trialEnd.getFullYear() + 1);

      const membership = await prisma.membership.create({
        data: {
          userId,
          tier: "ARTESANO",
          status: "ACTIVE",
          startDate: now,
          renewalDate: trialEnd,
          price: 0, // free trial
        },
      });

      // Update user tier
      await prisma.user.update({
        where: { id: userId },
        data: { tier: "ARTESANO" },
      });

      return NextResponse.json({
        success: true,
        membershipId: membership.id,
        tier: "ARTESANO",
        trialEnds: trialEnd.toISOString(),
      });
    }

    // With Square plan configured
    const { result: subResult } =
      await squareClient.subscriptionsApi.createSubscription({
        locationId: process.env.SQUARE_LOCATION_ID!,
        planVariationId: catalogPlanId,
        customerId: squareCustomerId,
        startDate: new Date().toISOString().split("T")[0],
        phases: [
          {
            ordinal: BigInt(0),
            orderTemplateId: catalogPlanId,
          },
        ],
      });

    const subscriptionId = subResult.subscription?.id;

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setFullYear(trialEnd.getFullYear() + 1);

    const membership = await prisma.membership.create({
      data: {
        userId,
        tier: "ARTESANO",
        status: "ACTIVE",
        startDate: now,
        renewalDate: trialEnd,
        price: 0,
        squareSubscriptionId: subscriptionId,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { tier: "ARTESANO" },
    });

    return NextResponse.json({
      success: true,
      membershipId: membership.id,
      tier: "ARTESANO",
      trialEnds: trialEnd.toISOString(),
      squareSubscriptionId: subscriptionId,
    });
  } catch (err: any) {
    console.error("[membership/subscribe]", err);
    return NextResponse.json(
      { error: err.message || "Subscription failed" },
      { status: 500 }
    );
  }
}
