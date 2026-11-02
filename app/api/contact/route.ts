import { NextResponse } from "next/server";
import { resend, FROM_EMAIL, OWNER_EMAIL } from "@/lib/email/resend";
import { z } from "zod";
import * as field from "@/lib/validation/fields";

const schema = z.object({
  name: field.personName,
  email: field.email,
  subject: field.text(2, 150, "Subject"),
  turnstileToken: z.string().min(1).max(2048),
  message: field.optionalMultiline(3000, "Message").pipe(
    z.string({ required_error: "Message is required" }).min(5, "Message is too short")
  ),
});

export async function POST(req: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[contact] TURNSTILE_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Contact form temporarily unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const { name, email, subject, message, turnstileToken } = parsed.data;

  let verification: { success?: boolean; hostname?: string };
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: turnstileToken }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Turnstile verification unavailable");
    verification = await response.json();
  } catch {
    return NextResponse.json({ error: "Verification temporarily unavailable" }, { status: 503 });
  }

  const allowedHostnames = ["karyanabakery.ca", "www.karyanabakery.ca", "karyanabakery.com", "www.karyanabakery.com"];
  if (!verification.success || !verification.hostname || !allowedHostnames.includes(verification.hostname)) {
    return NextResponse.json({ error: "Human verification failed" }, { status: 403 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("[contact] RESEND_API_KEY missing, skipping email send");
    return NextResponse.json({ ok: true, dryRun: true });
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: OWNER_EMAIL,
    replyTo: email,
    subject: `[Contact] ${subject}`,
    html: `
      <h2>New contact form message</h2>
      <p><b>From:</b> ${name} &lt;${email}&gt;</p>
      <p><b>Subject:</b> ${subject}</p>
      <hr/>
      <p style="white-space:pre-wrap">${message.replace(/</g, "&lt;")}</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
