import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { syncWeeklyAutoDeliveryToggle } from "@/lib/brevo/sync";

const VALID_MODES = ["REPEAT_LAST", "CURATED", "MANUAL"] as const;

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { weeklyMode, autoDeliveryEnabled } = await req.json();

    if (weeklyMode !== undefined && weeklyMode !== null && !VALID_MODES.includes(weeklyMode)) {
      return NextResponse.json({ error: "Invalid weekly mode" }, { status: 400 });
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

    const updated = await prisma.membership.update({
      where: { userId },
      data: {
        ...(weeklyMode !== undefined ? { weeklyMode } : {}),
        ...(typeof autoDeliveryEnabled === "boolean" ? { autoDeliveryEnabled } : {}),
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

    return NextResponse.json({
      success: true,
      weeklyMode: updated.weeklyMode,
      autoDeliveryEnabled: updated.autoDeliveryEnabled,
    });
  } catch (err: any) {
    console.error("[membership/weekly-preferences]", err);
    return NextResponse.json({ error: err.message || "Failed to save" }, { status: 500 });
  }
}
