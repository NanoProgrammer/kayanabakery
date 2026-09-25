import { NextResponse } from "next/server";
import { buildPackingSlipPdf } from "@/lib/pdf/packing-slip";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // No separate site-account login required — this link is only ever
  // generated and shown from inside Sanity Studio (which has its own
  // login), and the order id is an unguessable string, not a login gate.
  const { id } = await params;

  const result = await buildPackingSlipPdf({ sanityId: id });
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(result.buffer as never, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="packing-slip-${result.orderNumber}.pdf"`,
    },
  });
}
