import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // Handle payment events
    if (type === "payment.updated" || type === "payment.created") {
      const payment = data?.object?.payment;
      if (payment?.id) {
        const status = payment.status;
        const prismaStatus =
          status === "COMPLETED"
            ? "PAID"
            : status === "CANCELED" || status === "FAILED"
            ? "FAILED"
            : "PENDING";

        await prisma.order.updateMany({
          where: { squarePaymentId: payment.id },
          data: { paymentStatus: prismaStatus },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
