import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  userId: z.string(),
  amount: z.number().int(),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { userId, amount, note } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { pointsBalance: { increment: amount } },
    });
    await tx.pointsTransaction.create({
      data: {
        userId,
        amount,
        type: amount > 0 ? "ADJUSTMENT" : "ADJUSTMENT",
        note: note ?? "Manual adjustment by admin",
      },
    });
  });

  return NextResponse.json({ ok: true });
}
