import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { readReferralVerificationId, validateReferralVerification } from "@/lib/referrals/verification";
import { confirmVerifiedReferral } from "@/lib/referrals/program";

export const dynamic = "force-dynamic";

// POST, not GET: automatic email-link scanners must never confirm a member.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ token: z.string().min(20).max(2048) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid link" }, { status: 400 });

  const id = readReferralVerificationId(parsed.data.token);
  if (!id) return NextResponse.json({ error: "Expired or invalid link" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, referredById: true },
  });
  if (!user?.referredById || !validateReferralVerification(parsed.data.token, user.email)) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  }

  try {
    const status = await confirmVerifiedReferral(id);
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error("[referrals] unable to verify registration", err);
    return NextResponse.json({ error: "Verification temporarily unavailable" }, { status: 503 });
  }
}
