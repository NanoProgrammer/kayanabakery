import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { syncWeeklyAutoDeliveryToggle } from "@/lib/brevo/sync";
import { weekStartOf } from "@/lib/membership/weekly";
import { sendFrequencyChangedEmail } from "@/lib/email/weekly-frequency";

const VALID_MODES = ["REPEAT_LAST", "CURATED", "MANUAL"] as const;
const VALID_FREQUENCIES = ["WEEKLY", "EVERY_4_WEEKS"] as const;

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { weeklyMode, autoDeliveryEnabled, weeklyFrequency } = await req.json();

    if (weeklyMode !== undefined && weeklyMode !== null && !VALID_MODES.includes(weeklyMode)) {
      return NextResponse.json({ error: "Invalid weekly mode" }, { status: 400 });
    }

    if (weeklyFrequency !== undefined && !VALID_FREQUENCIES.includes(weeklyFrequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 });
    }

    const membership = await prisma.membership.findUnique({ where: { userId } });
    if (!membership || membership.status !== "ACTIVE") {
      return NextResponse.json({ error: "No active membership" }, { status: 404 });
    }
    if (membership.tier !== "SELECTO" && membership.tier !== "LEGENDARIO") {
      return NextResponse.json(
        { error: "Weekly box delivery is only available for Selecto and Legendario" },
        { status: 403 }
      );
    }

    const frequencyChanged =
      weeklyFrequency !== undefined && weeklyFrequency !== membership.weeklyFrequency;

    const updated = await prisma.membership.update({
      where: { userId },
      data: {
        ...(weeklyMode !== undefined ? { weeklyMode } : {}),
        ...(typeof autoDeliveryEnabled === "boolean" ? { autoDeliveryEnabled } : {}),
        ...(weeklyFrequency !== undefined ? { weeklyFrequency } : {}),
        // Restart the 4-week rhythm from the week they switched, so the first
        // monthly box lands this week instead of wherever the old anchor fell.
        ...(frequencyChanged && weeklyFrequency === "EVERY_4_WEEKS"
          ? { weeklyAnchorAt: weekStartOf(new Date()) }
          : {}),
      },
    });

    // Fire the Brevo ON/OFF automation trigger whenever the toggle actually changes.
    if (
      typeof autoDeliveryEnabled === "boolean" &&
      autoDeliveryEnabled !== membership.autoDeliveryEnabled
    ) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, preferredLang: true },
      });
      if (user?.email) {
        syncWeeklyAutoDeliveryToggle({
          email: user.email,
          name: user.name,
          enabled: autoDeliveryEnabled,
          language: user.preferredLang,
        });
      }
    }

    // Confirm the change by email: the cadence decides whether bread shows up,
    // so it should not be a setting that changes with no paper trail.
    if (frequencyChanged) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, preferredLang: true },
      });
      if (user?.email) {
        await sendFrequencyChangedEmail({
          email: user.email,
          name: user.name,
          frequency: weeklyFrequency,
          preferredLang: user.preferredLang,
        });
      }
    }

    return NextResponse.json({
      success: true,
      weeklyMode: updated.weeklyMode,
      autoDeliveryEnabled: updated.autoDeliveryEnabled,
      weeklyFrequency: updated.weeklyFrequency,
    });
  } catch (err: any) {
    console.error("[membership/weekly-preferences]", err);
    return NextResponse.json({ error: err.message || "Failed to save" }, { status: 500 });
  }
}
