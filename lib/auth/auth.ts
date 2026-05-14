import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
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
          include: { membership: true },
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
          tier: user.membership?.tier ?? "BASICO",
          points: user.pointsBalance,
        } as any;
      },
    }),
  ],
  callbacks: {
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
            include: { membership: true },
          });
          if (u) {
            token.tier = u.membership?.tier ?? "BASICO";
            token.points = u.pointsBalance;
            token.role = u.role;
            (token as any).refreshedAt = Date.now();
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).tier = token.tier;
        (session.user as any).points = token.points;
      }
      return session;
    },
  },
});

function shouldRefresh(token: any): boolean {
  const last = token.refreshedAt as number | undefined;
  if (!last) return true;
  return Date.now() - last > 5 * 60 * 1000;
}
