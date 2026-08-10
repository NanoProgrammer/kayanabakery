import { NextResponse } from "next/server";
import { resend, FROM_EMAIL, OWNER_EMAIL } from "@/lib/email/resend";
import { z } from "zod";

const schema = z.object({
  yourName: z.string().min(2),
  yourEmail: z.string().email(),
  friendName: z.string().min(2),
  friendEmail: z.string().email(),
  situation: z.string().min(1),
  personalMessage: z.string().max(800).optional(),
});

function escapeHtml(s: string) {
  return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { yourName, yourEmail, friendName, friendEmail, situation, personalMessage } = parsed.data;

  if (yourEmail.toLowerCase() === friendEmail.toLowerCase()) {
    return NextResponse.json({ error: "You can't nominate yourself" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.log("[refer-a-friend] RESEND_API_KEY missing, skipping email send");
    return NextResponse.json({ ok: true, dryRun: true });
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      replyTo: yourEmail,
      subject: `[Las penas con pan son menos] Nomination: ${friendName}`,
      html: `
        <h2>New community nomination</h2>
        <p><b>Nominated by:</b> ${escapeHtml(yourName)} &lt;${escapeHtml(yourEmail)}&gt;</p>
        <hr/>
        <p><b>Nominee:</b> ${escapeHtml(friendName)} &lt;${escapeHtml(friendEmail)}&gt;</p>
        <p><b>Situation:</b> ${escapeHtml(situation)}</p>
        ${
          personalMessage
            ? `<p><b>Message:</b></p><p style="white-space:pre-wrap">${escapeHtml(personalMessage)}</p>`
            : ""
        }
      `,
    });
  } catch (err: any) {
    console.error("[refer-a-friend] email send failed", err);
    return NextResponse.json({ error: "Failed to send nomination" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
