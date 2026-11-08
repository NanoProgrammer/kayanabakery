import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { sendReferralVerificationEmail } from "@/lib/referrals/verification";

export async function POST() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, preferredLang: true, referredById: true, referralVerificationProcessedAt: true },
  });
  if (!user?.referredById || user.referralVerificationProcessedAt) {
    return NextResponse.json({ error: "No pending verification" }, { status: 400 });
  }

  // One email per five minutes, enforced in the database across servers.
  const now = new Date();
  const changed = await prisma.user.updateMany({
    where: {
      id: user.id,
      referralVerificationProcessedAt: null,
      OR: [
        { referralVerifySentAt: null },
        { referralVerifySentAt: { lt: new Date(now.getTime() - 5 * 60 * 1000) } },
      ],
    },
    data: { referralVerifySentAt: now },
  });
  if (changed.count !== 1) return NextResponse.json({ error: "Try again in five minutes" }, { status: 429 });

  const sent = await sendReferralVerificationEmail({
    id: user.id, email: user.email, name: user.name, locale: user.preferredLang,
  });
  return sent
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Could not send verification email" }, { status: 503 });
}
