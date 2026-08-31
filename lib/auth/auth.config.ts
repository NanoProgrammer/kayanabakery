import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the NextAuth config — no Prisma adapter, no
// Credentials provider (which pulls in bcryptjs), so this can be used by
// middleware (which runs on the Edge runtime) without bundling the full
// Node-only auth stack. Session shape must stay identical to the full
// config in lib/auth/auth.ts so both read/write the same JWT cookie.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
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
};
