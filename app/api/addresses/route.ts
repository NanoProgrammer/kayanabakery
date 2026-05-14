import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { isSECalgary } from "@/lib/checkout/postal-codes";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ addresses });
}

const addressSchema = z.object({
  street: z.string().min(2),
  city: z.string().min(2),
  province: z.string().min(2).max(3),
  postalCode: z.string().min(6).max(7),
  buzzer: z.string().optional(),
  notes: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = addressSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = parsed.data;
  const isSE = isSECalgary(data.postalCode);

  const created = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: {
        userId,
        street: data.street,
        city: data.city,
        province: data.province.toUpperCase(),
        postalCode: data.postalCode.toUpperCase(),
        buzzer: data.buzzer,
        notes: data.notes,
        isDefault: data.isDefault ?? false,
        isSE,
      },
    });
  });

  return NextResponse.json({ address: created });
}
