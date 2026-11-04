import type { NextAuthConfig } from "next-auth";

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

// Edge-safe subset of the NextAuth config — no Prisma adapter, no
// Credentials provider (which pulls in bcryptjs), so this can be used by
// middleware (which runs on the Edge runtime) without bundling the full
// Node-only auth stack. Session shape must stay identical to the full
// config in lib/auth/auth.ts so both read/write the same JWT cookie.
export const authConfig: NextAuthConfig = {
  // The site is served on two live domains (.ca and .com) — trust the
  // incoming request's Host header to build callback/redirect URLs per
  // request instead of forcing everything through one fixed origin. A
  // hardcoded AUTH_URL env var would override this for whichever single
  // domain it names, breaking Google sign-in on the other one.
  trustHost: true,
  // One month, stated rather than left to the library default, and the same
  // number for the JWT and for the cookie that carries it — if the cookie
  // outlives the token the customer is silently signed out, and if the token
  // outlives the cookie the session dies when the browser closes.
  // `updateAge` slides the month forward on any day the customer visits, so
  // a regular is never signed out.
  session: {
    strategy: "jwt",
    maxAge: THIRTY_DAYS_SECONDS,
    updateAge: 24 * 60 * 60,
  },
  jwt: { maxAge: THIRTY_DAYS_SECONDS },
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
