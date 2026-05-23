import { NextResponse } from "next/server";
import { resend, FROM_EMAIL, OWNER_EMAIL } from "@/lib/email/resend";

export async function POST(req: Request) {
  try {
    const fd = await req.formData();

    const data = {
      date: fd.get("date") as string,
      theme: fd.get("theme") as string,
      eventType: fd.get("eventType") as string,
      guests: fd.get("guests") as string,
      flavor: fd.get("flavor") as string,
      filling: fd.get("filling") as string,
      frosting: fd.get("frosting") as string,
      extras: fd.get("extras") as string,
      notes: fd.get("notes") as string,
      referenceDescription: fd.get("referenceDescription") as string,
      contactName: fd.get("contactName") as string,
      contactEmail: fd.get("contactEmail") as string,
      contactPhone: fd.get("contactPhone") as string,
    };

    if (!data.contactName || !data.contactEmail || !data.contactPhone) {
      return NextResponse.json(
        { error: "Missing contact information" },
        { status: 400 }
      );
    }

    if (!data.date || !data.eventType || !data.guests) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build email
    const html = `
      <div style="font-family:system-ui;max-width:600px;margin:0 auto;padding:24px;color:#2B2B2B">
        <h1 style="font-size:24px;color:#4A2E17">🎂 New Custom Cake Request</h1>
        
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px 0;font-weight:bold;width:140px">Date</td>
            <td style="padding:8px 0">${data.date}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px 0;font-weight:bold">Event type</td>
            <td style="padding:8px 0">${data.eventType}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px 0;font-weight:bold">Theme</td>
            <td style="padding:8px 0">${data.theme || "—"}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px 0;font-weight:bold">Guests</td>
            <td style="padding:8px 0">${data.guests}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px 0;font-weight:bold">Flavor</td>
            <td style="padding:8px 0">${data.flavor || "—"}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px 0;font-weight:bold">Filling</td>
            <td style="padding:8px 0">${data.filling || "—"}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px 0;font-weight:bold">Frosting</td>
            <td style="padding:8px 0">${data.frosting || "—"}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:8px 0;font-weight:bold">Extras</td>
            <td style="padding:8px 0">${data.extras || "None"}</td>
          </tr>
        </table>

        ${data.referenceDescription ? `<h3 style="margin:16px 0 8px">Reference Notes</h3><p style="white-space:pre-wrap">${data.referenceDescription.replace(/</g, "&lt;")}</p>` : ""}

        ${data.notes ? `<h3 style="margin:16px 0 8px">Additional Notes</h3><p style="white-space:pre-wrap">${data.notes.replace(/</g, "&lt;")}</p>` : ""}

        <h3 style="margin:24px 0 8px;color:#4A2E17">Contact</h3>
        <p><strong>${data.contactName}</strong><br/>
        ${data.contactEmail}<br/>
        ${data.contactPhone}</p>

        <p style="margin-top:24px;font-size:11px;color:#999">
          ⚠ Image reference (if any) was uploaded but not attached to this email.
          Check the form submission storage or ask the customer to send directly.
        </p>
      </div>
    `;

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: OWNER_EMAIL,
        replyTo: data.contactEmail,
        subject: `🎂 Custom Cake — ${data.contactName} · ${data.eventType} · ${data.date}`,
        html,
      });
    } else {
      console.log("[custom-cake] No RESEND_API_KEY, logging:", data);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[custom-cake]", err);
    return NextResponse.json(
      { error: err.message || "Failed" },
      { status: 500 }
    );
  }
}
