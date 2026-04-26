import { NextResponse } from "next/server";
import { resend } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Add to Resend audience if configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_AUDIENCE_ID) {
      await resend.contacts.create({
        email,
        audienceId: process.env.RESEND_AUDIENCE_ID,
        unsubscribed: false,
      });
    }

    // Send owner notification
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: process.env.OWNER_EMAIL || "karyana@karyanabakery.ca",
        subject: "New newsletter subscriber",
        html: `<p>New subscriber: <strong>${email}</strong></p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
