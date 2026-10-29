import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { effectiveTier } from "@/lib/membership/access";

const loginSchema = z.object({
  // Lower-cased to match how it was stored. Registration normalises the
  // address; looking it up raw meant one capital letter at sign-in found no
  // account and read as a wrong password.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email(),
  // Length only, and deliberately lower than the 8 new accounts must meet:
  // raising it here would lock out everyone who signed up before that rule.
  password: z.string().min(6),
});

/**
 * The membership fields signing in actually needs.
 *
 * `include: { membership: true }` asked for every column, so adding one to the
 * schema and deploying before the database had it stopped every sign-in on the
 * site — the query threw, and the page said the password was wrong.
 */
const MEMBERSHIP_FOR_SESSION = {
  select: { tier: true, status: true, endsAt: true },
} as const;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: { membership: MEMBERSHIP_FOR_SESSION },
        });
        if (!user?.password) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tier: effectiveTier(user.membership),
          points: user.pointsBalance,
        } as any;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? "CUSTOMER";
        token.tier = (user as any).tier ?? "BASICO";
        token.points = (user as any).points ?? 0;
      }

      // Refresh tier/points on session update or every ~5 min
      if (trigger === "update" || (token.id && shouldRefresh(token))) {
        try {
          const u = await prisma.user.findUnique({
            where: { id: token.id as string },
            include: { membership: MEMBERSHIP_FOR_SESSION },
          });
          if (u) {
            token.tier = effectiveTier(u.membership);
            token.points = u.pointsBalance;
            token.role = u.role;
            (token as any).refreshedAt = Date.now();
          }
        } catch {}
      }
      return token;
    },
  },
});

function shouldRefresh(token: any): boolean {
  const last = token.refreshedAt as number | undefined;
  if (!last) return true;
  return Date.now() - last > 5 * 60 * 1000;
}
