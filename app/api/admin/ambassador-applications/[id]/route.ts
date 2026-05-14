import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { resend, FROM_EMAIL } from "@/lib/email/resend";

const schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const application = await prisma.ambassadorApplication.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!application)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.ambassadorApplication.update({
      where: { id },
      data: {
        status: parsed.data.status,
        reviewedAt: new Date(),
      },
    });

    if (parsed.data.status === "APPROVED" && application.userId) {
      // Promote user to AMBASSADOR + create EMBAJADOR membership
      await tx.user.update({
        where: { id: application.userId },
        data: { role: "AMBASSADOR" },
      });
      await tx.membership.upsert({
        where: { userId: application.userId },
        create: {
          userId: application.userId,
          tier: "EMBAJADOR",
          status: "ACTIVE",
          startedAt: new Date(),
        },
        update: {
          tier: "EMBAJADOR",
          status: "ACTIVE",
          startedAt: new Date(),
          endsAt: null,
        },
      });
    }
  });

  // Send email
  if (process.env.RESEND_API_KEY) {
    try {
      const subject =
        parsed.data.status === "APPROVED"
          ? "Welcome to Karyana Ambassadors 🎉"
          : "About your Ambassador application";
      const html =
        parsed.data.status === "APPROVED"
          ? `
            <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:24px;color:#2B2B2B">
              <h1 style="font-size:28px">Welcome, ${application.fullName}!</h1>
              <p>Your Ambassador application has been approved. Your Embajador membership is now active.</p>
              <p>You now have:</p>
              <ul>
                <li>10x points on every order</li>
                <li>Full access to off-season and out-of-stock items</li>
                <li>Up to 4 free new breads per month</li>
                <li>Paid deliveries ($8–$10 per delivery)</li>
              </ul>
              <p>Sign in to your account to see all your benefits.</p>
              <p style="margin-top:24px;font-size:12px;color:#777">— Karyana Ruiz Bakery</p>
            </div>
          `
          : `
            <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:24px;color:#2B2B2B">
              <h1 style="font-size:24px">Hi ${application.fullName},</h1>
              <p>Thank you for applying to the Karyana Ambassador program.</p>
              <p>Unfortunately we can't move forward with your application at this time. We appreciate your interest in supporting Karyana and hope you'll continue enjoying our bread.</p>
              <p style="margin-top:24px;font-size:12px;color:#777">— Karyana Ruiz Bakery</p>
            </div>
          `;
      await resend.emails.send({
        from: FROM_EMAIL,
        to: application.email,
        subject,
        html,
      });
    } catch (err) {
      console.warn("[ambassador-decision] email failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
