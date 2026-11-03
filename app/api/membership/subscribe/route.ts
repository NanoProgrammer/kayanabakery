import { NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureSquareCustomer,
  saveCardOnFile,
  chargeCardOnFile,
  tierPriceCents,
  nextRenewDate,
} from "@/lib/square/subscriptions";
import { syncMembershipChange } from "@/lib/brevo/sync";
import { syncCustomerToSanity } from "@/lib/sanity/sync-customers";
import { sendMembershipWelcomeEmail } from "@/lib/email/membership";
import type { BenefitMode } from "@/lib/membership/benefit";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { sourceId, tier, benefitMode } = await req.json();

    // What the fee buys. Anything but an explicit "POINTS" is the weekly box,
    // which is what the membership is sold as.
    const chosenBenefit: BenefitMode = benefitMode === "POINTS" ? "POINTS" : "WEEKLY_BOX";

    const validTiers = ["ARTESANO", "SELECTO", "LEGENDARIO"];
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }
    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json({ error: "Card is required" }, { status: 400 });
    }

    // Check existing membership — block only if already on this exact tier.
    // Switching between paid tiers (e.g. Artesano → Selecto) is allowed without cancelling first.
    const existing = await prisma.membership.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        tier: { in: ["ARTESANO", "SELECTO", "LEGENDARIO", "EMBAJADOR"] },
      },
    });
    if (existing && existing.tier === tier) {
      return NextResponse.json(
        { error: "Already a member of this plan", tier: existing.tier },
        { status: 409 }
      );
    }
    if (existing?.tier === "EMBAJADOR") {
      return NextResponse.json(
        { error: "Ambassador membership can't be changed here — contact support" },
        { status: 403 }
      );
    }
    const isSwitching = !!existing;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, phone: true, squareCustomerId: true, preferredLang: true, langChosenByUser: true },
    });
    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Ensure Square customer
    const squareCustomerId = await ensureSquareCustomer({
      existingCustomerId: user.squareCustomerId,
      email: user.email,
      givenName: user.name?.split(" ")[0],
      familyName: user.name?.split(" ").slice(1).join(" "),
      phone: user.phone,
    });
    if (squareCustomerId !== user.squareCustomerId) {
      await prisma.user.update({
        where: { id: userId },
        data: { squareCustomerId },
      });
    }

    // 2. Save card on file. The owner Square reports back is what gets
    // stored: asking for one customer and getting another is how a member
    // ended up with a card that could never be charged.
    const { cardId, customerId: cardOwnerId } = await saveCardOnFile({
      customerId: squareCustomerId,
      sourceId,
    });

    // 3. Charge (or skip for Artesano free trial)
    const now = new Date();
    const renewsAt = nextRenewDate(tier as any, now);
    const priceCents = tierPriceCents(tier as any);
    const isFreeTrial = tier === "ARTESANO"; // first year free

    let squarePaymentId: string | null = null;

    if (!isFreeTrial && priceCents > 0) {
      const { paymentId } = await chargeCardOnFile({
        customerId: squareCustomerId,
        cardId,
        amountCents: priceCents,
        note: `Karyana ${tier} membership`,
      });
      squarePaymentId = paymentId;
    }

    // 4. Save membership in DB
    const membership = await prisma.membership.upsert({
      where: { userId },
      create: {
        userId,
        tier,
        status: "ACTIVE",
        startedAt: now,
        renewsAt,
        squareCardId: cardId,
        squareCustomerId: cardOwnerId,
        benefitMode: chosenBenefit,
        isTrial: isFreeTrial,
        lastPaymentId: squarePaymentId,
      },
      update: {
        tier,
        status: "ACTIVE",
        startedAt: now,
        renewsAt,
        squareCardId: cardId,
        squareCustomerId,
        isTrial: isFreeTrial,
        lastPaymentId: squarePaymentId,
        endsAt: null,
      },
    });

    // 5. Convert membership fee to points for Selecto & Legendario only
    // (Artesano's fee does NOT convert — matches the membership benefits table).
    // 1 point = 1 cent, so the fee paid becomes spendable balance at face value —
    // no tier multiplier here, otherwise every renewal would mint free money.
    let pointsGranted = 0;
    if (!isFreeTrial && priceCents > 0 && (tier === "SELECTO" || tier === "LEGENDARIO")) {
      pointsGranted = priceCents;
      await prisma.user.update({
        where: { id: userId },
        data: { pointsBalance: { increment: pointsGranted } },
      });
      await prisma.pointsTransaction.create({
        data: {
          userId,
          amount: pointsGranted,
          type: "BONUS",
          note: `${isSwitching ? "Switched to" : "Subscribed to"} ${tier} — membership fee converted to points`,
        },
      });
    }

    // Nothing used to send this. Somebody paid and heard nothing at all, so
    // the first word they had from their membership was a bank statement.
    await sendMembershipWelcomeEmail({
      email: user.email,
      name: user.name,
      tier,
      benefitMode: chosenBenefit,
      pointsGranted,
      preferredLang: user.preferredLang,
      langChosenByUser: (user as any).langChosenByUser,
    });

    syncMembershipChange({ email: user.email, tier, status: "ACTIVE", language: user.preferredLang });
    // Kept alive past the response. A loose promise is cut off the moment
    // the response goes out on serverless, so the mirror in Studio quietly
    // stayed stale.
    after(async () => {
      await syncCustomerToSanity(userId);
    });

    return NextResponse.json({
      success: true,
      membershipId: membership.id,
      tier,
      renewsAt: renewsAt.toISOString(),
      charged: !isFreeTrial,
      amountCents: isFreeTrial ? 0 : priceCents,
      pointsGranted,
    });
  } catch (err: any) {
    console.error("[membership/subscribe]", err);
    const squareError = err?.errors?.[0]?.detail;
    return NextResponse.json(
      { error: squareError || err.message || "Subscription failed" },
      { status: squareError ? 400 : 500 }
    );
  }
}