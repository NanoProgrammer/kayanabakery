import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  if (!userId || (role !== "ADMIN" && role !== "STAFF")) return null;
  return userId;
}

export async function GET() {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const policies = await prisma.creditExpirationPolicy.findMany({
    orderBy: { year: "desc" },
    take: 10,
  });
  return NextResponse.json({ policies });
}

export async function PATCH(req: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { year, mode } = await req.json();
  if (!year || (mode !== "FORFEIT" && mode !== "DONATE")) {
    return NextResponse.json({ error: "Invalid year or mode" }, { status: 400 });
  }

  const policy = await prisma.creditExpirationPolicy.upsert({
    where: { year },
    create: { year, mode, decidedById: adminId },
    update: { mode, decidedById: adminId, decidedAt: new Date() },
  });

  return NextResponse.json({ policy });
}
