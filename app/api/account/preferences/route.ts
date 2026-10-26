import { NextResponse } from "next/server";
import { z } from "zod";
import * as field from "@/lib/validation/fields";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: field.personName.optional(),
  // Normalised to E.164 here as everywhere else, so one customer is one
  // number however they typed it — order texts depend on that.
  phone: field.optionalPhone,
  birthday: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional(),
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
      // Saving here is the one place a customer states their language, so
      // it's the one place we can record that they meant it.
      ...(data.preferredLang && {
        preferredLang: data.preferredLang,
        langChosenByUser: true,
      }),
      ...(data.emailMarketing !== undefined && {
        emailMarketing: data.emailMarketing,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
