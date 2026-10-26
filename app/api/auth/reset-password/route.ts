import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { readResetToken, verifyResetToken } from "@/lib/auth/password-reset";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(10),
  // Length only: a password's contents are nobody's business, and rules about
  // its shape make people pick worse ones.
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

const MESSAGE: Record<string, string> = {
  malformed: "That link isn't valid. Ask for a new one.",
  expired: "That link has expired. Ask for a new one.",
  used: "That link has already been used. Ask for a new one.",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const named = readResetToken(parsed.data.token);
  if (!named) {
    return NextResponse.json({ error: MESSAGE.malformed }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: named.userId },
    select: { id: true, password: true },
  });

  // The signature covers the current hash, so verifying needs the account —
  // but a missing account must read exactly like a bad signature.
  const check = verifyResetToken(parsed.data.token, user?.password ?? null);

  if (!user || !check.ok) {
    const reason = !user ? "malformed" : check.ok ? "malformed" : check.reason;
    return NextResponse.json({ error: MESSAGE[reason] }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(parsed.data.password, 10) },
  });

  // Changing the hash invalidates this link and every other one outstanding
  // for the account, because they were all signed over the old hash.
  console.log(`[reset-password] password set for ${user.id}`);

  return NextResponse.json({ ok: true });
}
