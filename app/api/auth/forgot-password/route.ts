import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import * as field from "@/lib/validation/fields";
import { createResetToken } from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/password-reset";

export const dynamic = "force-dynamic";

const schema = z.object({ email: field.email });

/**
 * Starts a password reset.
 *
 * Always answers the same whether or not the address has an account. Saying
 * "no account with that email" turns this endpoint into a way to find out who
 * shops here, and the customer gets no useful help from it either — they
 * mistyped, or they used another address, and "check your email" sends them
 * to look in both places.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "That email doesn't look right" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, name: true, password: true, preferredLang: true, langChosenByUser: true },
  });

  if (user) {
    // A Google-only account has no password; the link lets them set one,
    // which is the likeliest reason a long-standing customer cannot sign in.
    const token = createResetToken(user.id, user.password);
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      token,
      hasPassword: Boolean(user.password),
      preferredLang: user.preferredLang,
      langChosenByUser: user.langChosenByUser,
    });
  } else {
    console.log(`[forgot-password] no account for ${parsed.data.email}`);
  }

  return NextResponse.json({ ok: true });
}
