import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import * as field from "@/lib/validation/fields";
import { syncUserRegistered } from "@/lib/brevo/sync";
import { getServerLocale } from "@/lib/i18n/server";

const schema = z.object({
  name: field.personName,
  email: field.email,
  // Length only: a password is the one field whose contents are nobody's
  // business, and rules about its shape make it weaker, not stronger.
  password: z.string().min(8, "Use at least 8 characters").max(200),
  // The form sends an empty string when there is no referral.
  refCode: z.preprocess(
    (value) => typeof value === "string" && field.cleanText(value) === "" ? undefined : value,
    field.code.optional()
  ),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { name, email, password, refCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 }
    );
  }

  let referredById: string | undefined;
  if (refCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: refCode },
    });
    if (referrer) referredById = referrer.id;
  }

  const hashed = await bcrypt.hash(password, 10);
  const locale = await getServerLocale(); // reads the karyana-lang cookie set by the language toggle

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      referredById,
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
  syncUserRegistered({
    email: parsed.data.email,
    name: parsed.data.name,
    language: locale,
  });

  return NextResponse.json({ ok: true, id: user.id });
}
