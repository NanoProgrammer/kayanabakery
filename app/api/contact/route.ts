import { NextResponse } from "next/server";
import { resend, FROM_EMAIL, OWNER_EMAIL } from "@/lib/email/resend";
import { z } from "zod";
import * as field from "@/lib/validation/fields";

const schema = z.object({
  name: field.personName,
  email: field.email,
  subject: field.text(2, 150, "Subject"),
  message: field.optionalMultiline(3000, "Message").pipe(
    z.string({ required_error: "Message is required" }).min(5, "Message is too short")
  ),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const { name, email, subject, message } = parsed.data;

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
