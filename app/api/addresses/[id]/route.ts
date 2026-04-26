import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.address.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { default: defaultType } = await req.json();

  if (defaultType === "billing") {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefaultBilling: false },
    });
    await prisma.address.update({
      where: { id },
      data: { isDefaultBilling: true },
    });
  } else if (defaultType === "shipping") {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefaultShipping: false },
    });
    await prisma.address.update({
      where: { id },
      data: { isDefaultShipping: true },
    });
  }
  return NextResponse.json({ ok: true });
}
