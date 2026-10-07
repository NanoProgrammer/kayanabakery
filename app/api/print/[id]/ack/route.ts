import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeClient as sanityClient } from "@/sanity/lib/client";
import { printerAuthorized, printerUnauthorized } from "../../_auth";
import { parsePrintId } from "../../_ids";

export const dynamic = "force-dynamic";

/**
 * The printer confirming a slip actually came out.
 *
 * Called after printing, never before: if the agent marked orders on the way
 * out, a paper jam or a crash between fetch and print would lose that ticket
 * silently, and nothing downstream would ever ask for it again.
 *
 * Checkout orders record it in the database; orders typed into Studio record it
 * on their own document, since they have no database row.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!printerAuthorized(req)) return printerUnauthorized();

  const { id } = await params;
  const target = parsePrintId(id);

  if (target.kind === "studio") {
    try {
      const doc = await sanityClient.fetch<{ _id: string; printedAt?: string } | null>(
        `*[_id == $id][0]{ _id, printedAt }`,
        { id: target.sanityId }
      );

      if (!doc?._id) {
        return NextResponse.json({ error: "No such order" }, { status: 404 });
      }

      // A repeated ack is the agent retrying, not a second print.
      if (doc.printedAt) {
        return NextResponse.json({ ok: true, alreadyPrinted: true, printedAt: doc.printedAt });
      }

      const printedAt = new Date().toISOString();
      await sanityClient.patch(doc._id).set({ printedAt }).commit();
      console.log(`[print] Studio order ${target.sanityId} printed`);

      return NextResponse.json({ ok: true, printedAt });
    } catch (err: any) {
      console.error(`[print] could not mark ${target.sanityId} printed:`, err?.message ?? err);
      return NextResponse.json(
        { error: "Could not reach Studio", retryable: true },
        { status: 503 }
      );
    }
  }

  const order = await prisma.order.findUnique({
    where: { id: target.prismaId },
    select: { orderNumber: true, printedAt: true },
  });

  if (!order) {
    return NextResponse.json({ error: "No such order" }, { status: 404 });
  }

  // Keep the first timestamp: it's when the kitchen actually got the paper.
  if (order.printedAt) {
    return NextResponse.json({
      ok: true,
      alreadyPrinted: true,
      printedAt: order.printedAt.toISOString(),
    });
  }

  const updated = await prisma.order.update({
    where: { id: target.prismaId },
    data: { printedAt: new Date() },
    select: { printedAt: true },
  });

  console.log(`[print] ${order.orderNumber} printed`);

  return NextResponse.json({
    ok: true,
    printedAt: updated.printedAt?.toISOString() ?? null,
  });
}
