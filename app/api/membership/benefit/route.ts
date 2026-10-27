import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ benefitMode: z.enum(["WEEKLY_BOX", "POINTS"]) });

/**
 * Switches a membership between the weekly box and points.
 *
 * Takes effect from the next Tuesday reminder: a box already confirmed for
 * this week has been paid for and is being made, and quietly cancelling it
 * from a settings toggle would be a worse surprise than one more delivery.
 */
export async function PATCH(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick the weekly box or points" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId },
    select: { id: true, tier: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "No membership" }, { status: 404 });
  }
  if (!["SELECTO", "LEGENDARIO"].includes(membership.tier)) {
    return NextResponse.json(
      { error: "This plan doesn't include a weekly box" },
      { status: 400 }
    );
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { benefitMode: parsed.data.benefitMode },
  });

  return NextResponse.json({ ok: true, benefitMode: parsed.data.benefitMode });
}
