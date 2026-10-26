import { NextResponse } from "next/server";
import { z } from "zod";
import * as field from "@/lib/validation/fields";
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

// Shared field rules, so an address saved here, typed at checkout or edited
// later is held to the same standard. These used to be min(2) on everything,
// which accepted "db drop table" as a street and "T3M4TB" as a postal code.
const addressSchema = z.object({
  street: field.street,
  city: field.city,
  province: field.province,
  postalCode: field.postalCode,
  buzzer: field.buzzer,
  notes: field.notes,
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
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

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
