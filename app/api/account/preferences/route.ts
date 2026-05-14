import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  birthday: z.string().optional(),
  preferredLang: z.enum(["en", "es"]).optional(),
  emailMarketing: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id;
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = parsed.data;
  await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.birthday !== undefined && {
        birthday: data.birthday ? new Date(data.birthday) : null,
      }),
      ...(data.preferredLang && { preferredLang: data.preferredLang }),
      ...(data.emailMarketing !== undefined && {
        emailMarketing: data.emailMarketing,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
