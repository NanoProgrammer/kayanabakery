import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TIERS = [
  "BASICO",
  "ARTESANO", 
  "SELECTO",
  "LEGENDARIO",
  "EMBAJADOR",
] as const;

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const { userId, tier } = await req.json();

  if (!userId || !VALID_TIERS.includes(tier)) {
    return NextResponse.json(
      { error: "Missing userId or invalid tier" },
      { status: 400 }
    );
  }

  if (tier === "BASICO") {
    await prisma.membership.deleteMany({ where: { userId } });
    return NextResponse.json({ ok: true, tier: "BASICO" });
  }

  const membership = await prisma.membership.upsert({
    where: { userId },
    update: {
      tier,
      status: "ACTIVE",
      startedAt: new Date(),
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endsAt: null,
    },
    create: {
      userId,
      tier,
      status: "ACTIVE",
      startedAt: new Date(),
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ ok: true, membership });
}