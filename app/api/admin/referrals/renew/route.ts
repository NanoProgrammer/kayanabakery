import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const adminId = (session?.user as any)?.id as string | undefined;
  if (!adminId || (session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  const parsed = z.object({ userId: z.string().min(1) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid member" }, { status: 400 });

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const member = await tx.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, referralRewardCount: true, referralRewardLimit: true },
      });
      if (!member) return "not_found";
      if (member.referralRewardCount < member.referralRewardLimit) return "not_ready";

      // The old limit is a compare-and-swap guard against double approval.
      const updated = await tx.user.updateMany({
        where: {
          id: member.id,
          referralRewardCount: member.referralRewardCount,
          referralRewardLimit: member.referralRewardLimit,
        },
        data: { referralRewardLimit: { increment: 10 } },
      });
      if (updated.count !== 1) return "conflict";
      await tx.referralRenewal.create({
        data: { userId: member.id, approvedById: adminId },
      });
      return "approved";
    });
    if (outcome === "approved") return NextResponse.json({ ok: true });
    return NextResponse.json({ error: outcome }, { status: outcome === "not_found" ? 404 : 409 });
  } catch (err) {
    console.error("[referrals] renewal failed", err);
    return NextResponse.json({ error: "Renewal failed" }, { status: 503 });
  }
}
