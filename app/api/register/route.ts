import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import * as field from "@/lib/validation/fields";
import { syncUserRegistered } from "@/lib/brevo/sync";
import { syncCustomerToSanity } from "@/lib/sanity/sync-customers";
import { getServerLocale } from "@/lib/i18n/server";
import { auth } from "@/lib/auth/auth";
import { sendReferralVerificationEmail } from "@/lib/referrals/verification";

const schema = z.object({
  name: field.personName,
  email: field.email,
  // Length only: a password is the one field whose contents are nobody's
  // business, and rules about its shape make it weaker, not stronger.
  password: z.string().min(8, "Use at least 8 characters").max(200),
  // The form sends an empty string when there is no referral.
  turnstileToken: z.string().max(2048).optional(),
  refCode: z.preprocess(
    (value) => typeof value === "string" && field.cleanText(value) === "" ? undefined : value,
    field.code.optional()
  ),
});

export async function POST(req: Request) {
  // Creating an account requires not having one open. The sign-up page is
  // already closed to a signed-in browser, but the page is only the door —
  // the endpoint is what actually creates the account, and a second account
  // made here is one the customer's orders, points and addresses get split
  // across. 409 rather than 401: the request is understood and refused, and
  // the form turns this into "sign out first" with a button.
  const session = await auth();
  if ((session?.user as any)?.id) {
    return NextResponse.json(
      {
        error: "SIGNED_IN",
        message:
          "You are already signed in. Sign out before creating another account.",
      },
      { status: 409 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, email, password, refCode, turnstileToken } = parsed.data;

  // Anti-bot verification is required for every rewarded referral signup.
  if (refCode) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret || !turnstileToken) {
      return NextResponse.json({ error: "Complete the human verification challenge" }, { status: 503 });
    }
    let result: { success?: boolean; hostname?: string };
    try {
      const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: turnstileToken }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Turnstile unavailable");
      result = await response.json();
    } catch {
      return NextResponse.json({ error: "Security verification unavailable" }, { status: 503 });
    }
    const hosts = ["karyanabakery.ca", "www.karyanabakery.ca", "karyanabakery.com", "www.karyanabakery.com"];
    if (!result.success || !result.hostname || !hosts.includes(result.hostname)) {
      return NextResponse.json({ error: "Human verification failed" }, { status: 403 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  let referredById: string | undefined;
  if (refCode) {
    // Stored cuid() referral codes are lower-case; shared validator uppercases.
    const referrer = await prisma.user.findUnique({
      where: { referralCode: refCode.toLowerCase() },
      select: { id: true, referralRewardCount: true, referralRewardLimit: true },
    });
    if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
    // Invites can continue while paused, but only an available block earns points.
    if (referrer.referralRewardCount < referrer.referralRewardLimit) referredById = referrer.id;
  }

  const hashed = await bcrypt.hash(password, 10);
  const locale = await getServerLocale(); // reads the karyana-lang cookie set by the language toggle

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      referredById,
      referralVerifySentAt: referredById ? new Date() : undefined,
      role: "CUSTOMER",
      preferredLang: locale,
      // Auto-create Basico membership
      membership: {
        create: {
          tier: "BASICO",
          status: "ACTIVE",
        },
      },
    },
  });
  // Registering never put the customer in Studio: they appeared only when the
  // daily cron swept everybody, so the bakery could sign someone up and not
  // see them for most of a day with no way to tell whether it had worked.
  //
  // `after` rather than a loose promise — a plain fire-and-forget here is cut
  // off the instant the response goes out on serverless, which is how a sync
  // that looks written down never runs.
  after(async () => {
    syncUserRegistered({
      email: parsed.data.email,
      name: parsed.data.name,
      language: locale,
    });
    await syncCustomerToSanity(user.id);
    if (referredById) {
      await sendReferralVerificationEmail({ id: user.id, email: user.email, name: user.name, locale });
    }
  });

  return NextResponse.json({ ok: true, id: user.id });
}
