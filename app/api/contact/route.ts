import { NextResponse } from "next/server";
import { resend, FROM_EMAIL, OWNER_EMAIL } from "@/lib/email/resend";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(2),
  message: z.string().min(5).max(3000),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

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
