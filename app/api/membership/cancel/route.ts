import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { squareClient } from "@/lib/square/client";
import { syncMembershipChange } from "@/lib/brevo/sync";

export async function DELETE() {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const membership = await prisma.membership.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });

    if (!membership || membership.status !== "ACTIVE") {
      return NextResponse.json({ error: "No active membership" }, { status: 404 });
    }

    // Disable the saved card in Square so it can't be charged again
    if (membership.squareCardId) {
      try {
        await squareClient.cards.disable({ cardId: membership.squareCardId });
      } catch (err: any) {
        console.warn("[membership/cancel] failed to disable card:", err.message);
        // Don't block cancellation if this fails — continue anyway
      }
    }

    const now = new Date();

    await prisma.membership.update({
      where: { userId },
      data: {
        status: "CANCELED",
        cancelledAt: now,
        endsAt: membership.renewsAt ?? now, // benefits last until renewal date
      },
    });

    if (membership.user?.email) {
      syncMembershipChange({
        email: membership.user.email,
        tier: membership.tier,
        status: "CANCELED",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[membership/cancel]", err);
    return NextResponse.json(
      { error: err.message || "Cancellation failed" },
      { status: 500 }
    );
  }
}