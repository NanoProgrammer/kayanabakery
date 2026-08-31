import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Edge-safe auth instance for middleware only — decodes the JWT cookie to
// read role/session, but can't sign in, sign out, or touch the DB (no
// adapter, no providers). Use lib/auth/auth.ts everywhere else.
export const { auth } = NextAuth(authConfig);
