import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

const VALID_STATUSES = [
  "IN_PROGRESS",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
] as const;

type ValidStatus = (typeof VALID_STATUSES)[number];

function verify(req: Request, body: string): boolean {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) return true; // skip in dev if not set
  const sig = req.headers.get("sanity-webhook-signature") || "";
  const [, hash] = sig.split("=");
  const expected = createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return hash === expected;
}

export async function POST(req: Request) {
  const raw = await req.text();

  if (!verify(req, raw)) {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { _id, prismaId, status } = payload;

  // Extract prismaId from _id if not present
  const id = prismaId || _id?.replace("order-", "");

  if (!id) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status as ValidStatus)) {
    return NextResponse.json(
      { error: `Invalid status: ${status}` },
      { status: 400 }
    );
  }

  // Map status to timestamp field
  const timestampField: Record<ValidStatus, string> = {
    IN_PROGRESS: "inProgressAt",
    READY: "readyAt",
    OUT_FOR_DELIVERY: "outForDeliveryAt",
    COMPLETED: "completedAt",
  };

  const now = new Date();

  await prisma.order.update({
    where: { id },
    data: {
      status: status as any,
      [timestampField[status as ValidStatus]]: now,
    },
  });

  console.log(`[sanity-order webhook] ${id} → ${status}`);

  return NextResponse.json({ ok: true });
}