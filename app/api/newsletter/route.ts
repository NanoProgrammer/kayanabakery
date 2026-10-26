import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email/resend";
import { z } from "zod";
import * as field from "@/lib/validation/fields";
import { syncNewsletterSubscribe } from "@/lib/brevo/sync";

const schema = z.object({
  email: field.email,
  language: z.enum(["en", "es"]).optional(),
  source: field.optionalText(40, "Source"),
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
  syncNewsletterSubscribe(email, language);
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
