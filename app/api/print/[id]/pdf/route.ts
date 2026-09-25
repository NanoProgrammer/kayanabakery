import { NextResponse } from "next/server";
import { buildPackingSlipPdf } from "@/lib/pdf/packing-slip";
import { printerAuthorized, printerUnauthorized } from "../../_auth";

export const dynamic = "force-dynamic";

/**
 * The slip to print, by Prisma order id — which is what /pending hands out.
 *
 * Same document the Studio button produces: one builder, so the ticket in the
 * kitchen and the one on screen can't drift apart.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!printerAuthorized(req)) return printerUnauthorized();

  const { id } = await params;

  let result;
  try {
    result = await buildPackingSlipPdf({ prismaId: id });
  } catch (err: any) {
    // Studio being unreachable is temporary and worth retrying; an order that
    // isn't there is not. A bare 500 makes the agent retry both forever, so
    // say which one this is.
    console.error(`[print] could not build the slip for ${id}:`, err?.message ?? err);
    return NextResponse.json(
      {
        error: "Could not reach Studio to build the slip",
        retryable: true,
        detail: err?.message ?? String(err),
      },
      { status: 503 }
    );
  }

  if (!result) {
    // The order exists in Prisma but never reached Studio — that is the sync
    // gap, not a printer problem, so say which one it is.
    return NextResponse.json(
      {
        error: "No Studio document for this order — it never synced",
        retryable: false,
      },
      { status: 404 }
    );
  }

  return new NextResponse(result.buffer as never, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="packing-slip-${result.orderNumber}.pdf"`,
    },
  });
}
