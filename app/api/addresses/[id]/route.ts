import { NextResponse } from "next/server";
import { z } from "zod";
import * as field from "@/lib/validation/fields";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { isSECalgary } from "@/lib/checkout/postal-codes";

// Editing an address is held to the same rules as creating one; it used to be
// held to none at all, so anything rejected on the way in could be set here.
const patchSchema = z.object({
  street: field.street.optional(),
  city: field.city.optional(),
  province: field.province.optional(),
  postalCode: field.postalCode.optional(),
  buzzer: field.buzzer,
  notes: field.notes,
  isDefault: z.boolean().optional(),
});

async function ensureOwner(addressId: string, userId: string) {
  const a = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  return a;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await ensureOwner(id, userId);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );

  const data = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: {
        ...data,
        province: data.province?.toUpperCase(),
        postalCode: data.postalCode?.toUpperCase(),
        isSE: data.postalCode
          ? isSECalgary(data.postalCode)
          : existing.isSE,
      },
    });
  });

  return NextResponse.json({ address: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await ensureOwner(id, userId);
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
