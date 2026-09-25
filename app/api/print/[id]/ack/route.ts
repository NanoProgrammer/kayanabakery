import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { printerAuthorized, printerUnauthorized } from "../../_auth";

export const dynamic = "force-dynamic";

/**
 * The printer confirming a slip actually came out.
 *
 * Called after printing, never before: if the agent marked orders on the way
 * out, a paper jam or a crash between fetch and print would lose that ticket
 * silently, and nothing downstream would ever ask for it again.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!printerAuthorized(req)) return printerUnauthorized();

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true, printedAt: true },
  });

  if (!order) {
    return NextResponse.json({ error: "No such order" }, { status: 404 });
  }

  // A repeated ack is the agent retrying, not a second print. Keep the first
  // timestamp: it's when the kitchen actually got the paper.
  if (order.printedAt) {
    return NextResponse.json({
      ok: true,
      alreadyPrinted: true,
      printedAt: order.printedAt.toISOString(),
    });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { printedAt: new Date() },
    select: { printedAt: true },
  });

  console.log(`[print] ${order.orderNumber} printed`);

  return NextResponse.json({
    ok: true,
    printedAt: updated.printedAt?.toISOString() ?? null,
  });
}
