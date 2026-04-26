import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const address = await prisma.address.create({
    data: {
      userId,
      label: data.label || null,
      fullName: data.fullName,
      phone: data.phone,
      line1: data.line1,
      line2: data.line2 || null,
      city: data.city,
      province: data.province || "AB",
      postalCode: data.postalCode,
      country: data.country || "Canada",
    },
  });
  return NextResponse.json({ ok: true, address });
}
