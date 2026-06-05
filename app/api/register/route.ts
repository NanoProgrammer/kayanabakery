import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { syncUserRegistered } from "@/lib/brevo/sync";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  refCode: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
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

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      referredById,
      role: "CUSTOMER",
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
  language: "en",
});

  return NextResponse.json({ ok: true, id: user.id });
}
