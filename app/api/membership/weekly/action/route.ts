import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWeeklyAction } from "@/lib/membership/weekly";
import { createWeeklyOrder } from "@/lib/membership/weekly-order";

function htmlPage(title: string, message: string, ok: boolean): NextResponse {
  const color = ok ? "#4A2E17" : "#B3261E";
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>body{font-family:system-ui,sans-serif;background:#FFF5F7;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .card{background:#fff;border-radius:24px;padding:40px;max-width:420px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    h1{color:${color};font-size:22px;margin:0 0 12px}p{color:#555;font-size:14px}
    a{color:#4A2E17;font-weight:600;text-decoration:none}</style></head>
    <body><div class="card"><h1>${title}</h1><p>${message}</p><p><a href="/account/membership">${"Volver a mi cuenta / Back to my account"}</a></p></div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const logId = url.searchParams.get("log");
  const action = url.searchParams.get("action");
  const token = url.searchParams.get("token");

  if (!logId || !action || !token || !verifyWeeklyAction(logId, action, token)) {
    return htmlPage("Link invalid", "This link is invalid or has expired.", false);
  }

  const log = await prisma.weeklyOrderLog.findUnique({
    where: { id: logId },
    include: { membership: true },
  });

  if (!log) {
    return htmlPage("Not found", "We couldn't find this week's request.", false);
  }

  if (log.status !== "PENDING") {
    return htmlPage(
      "Already decided",
      "You've already made a decision for this week's box.",
      true
    );
  }

  if (action === "skip") {
    await prisma.weeklyOrderLog.update({
      where: { id: log.id },
      data: { status: "SKIPPED", decidedBy: "USER", decidedAt: new Date() },
    });
    return htmlPage(
      "Skipped this week",
      "Got it — no bread will be sent this week. See you next Thursday!",
      true
    );
  }

  // action === "send"
  const membership = log.membership;
  if (!membership.squareCustomerId || !membership.squareCardId) {
    await prisma.weeklyOrderLog.update({
      where: { id: log.id },
      data: { status: "FAILED", decidedBy: "USER", decidedAt: new Date(), failureNote: "No card on file" },
    });
    return htmlPage(
      "Couldn't charge your card",
      "We don't have a card on file for you. Please add one in your account and contact us.",
      false
    );
  }

  const result = await createWeeklyOrder({
    userId: log.userId,
    tier: membership.tier as any,
    squareCustomerId: membership.squareCustomerId,
    squareCardId: membership.squareCardId,
  });

  if ("error" in result) {
    await prisma.weeklyOrderLog.update({
      where: { id: log.id },
      data: { status: "FAILED", decidedBy: "USER", decidedAt: new Date(), failureNote: result.error },
    });
    return htmlPage("Couldn't send your box", result.error, false);
  }

  await prisma.weeklyOrderLog.update({
    where: { id: log.id },
    data: { status: "CONFIRMED", decidedBy: "USER", decidedAt: new Date(), orderId: result.orderId },
  });

  return htmlPage(
    "Your bread is on its way! 🍞",
    "We've charged your card on file and started preparing your weekly box.",
    true
  );
}
