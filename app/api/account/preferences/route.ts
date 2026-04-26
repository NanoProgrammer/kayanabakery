import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone, preferences } = await req.json();

  await prisma.user.update({
    where: { id: userId },
    data: {
      phone: phone || null,
      preferences,
    },
  });

  return NextResponse.json({ ok: true });
}
