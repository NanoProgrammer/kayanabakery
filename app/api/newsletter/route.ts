import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email/resend";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  language: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email, language, source } = parsed.data;

  // Upsert local DB
  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      language: language || "en",
      active: true,
      source: source || "home",
    },
    update: { active: true, language: language || "en" },
  });

  // Optional: add to Resend audience
  if (process.env.RESEND_AUDIENCE_ID && process.env.RESEND_API_KEY) {
    try {
      await resend.contacts.create({
        audienceId: process.env.RESEND_AUDIENCE_ID,
        email,
      });
    } catch (e) {
      console.warn("[newsletter] resend audience add failed", e);
    }
  }

  return NextResponse.json({ ok: true });
}
