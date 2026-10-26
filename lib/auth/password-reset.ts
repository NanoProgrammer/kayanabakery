import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Password reset links, signed rather than stored.
 *
 * There was no way to reset a password at all: a customer who forgot hers got
 * "Invalid credentials" and no way forward, and the bakery had nothing to
 * offer her.
 *
 * The token carries who it is for and when it expires, signed with the app's
 * own secret. Nothing is written to the database — which also means no
 * migration to deploy, and no table of live tokens to leak.
 *
 * The signature covers the account's CURRENT password hash, which is what
 * makes a link single-use: the moment the password changes the hash changes,
 * so the link that set it stops verifying. An account with no password yet —
 * someone who only ever signed in with Google — signs over an empty string,
 * so the same flow lets them set one for the first time.
 */
const TTL_MS = 60 * 60 * 1000; // an hour

function secret(): string {
  const value = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!value) {
    // Signing with a fallback would make every link forgeable, so refuse.
    throw new Error("AUTH_SECRET is not set — password reset links cannot be signed");
  }
  return value;
}

function sign(payload: string, passwordHash: string): string {
  return createHmac("sha256", secret())
    .update(`${payload}.${passwordHash}`)
    .digest("base64url");
}

export type ResetTokenParts = { userId: string; expiresAt: number; nonce: string };

export function createResetToken(
  userId: string,
  passwordHash: string | null,
  now: Date = new Date()
): string {
  // The nonce only varies the token text, so two links requested a second
  // apart don't look identical; it is covered by the signature like the rest.
  const parts = `${userId}.${now.getTime() + TTL_MS}.${randomUUID()}`;
  return `${Buffer.from(parts).toString("base64url")}.${sign(parts, passwordHash ?? "")}`;
}

/** The user the token names, before it can be verified — the hash is needed. */
export function readResetToken(token: string): ResetTokenParts | null {
  const [encoded] = String(token ?? "").split(".");
  if (!encoded) return null;

  let parts: string;
  try {
    parts = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const [userId, expiresAt, nonce] = parts.split(".");
  if (!userId || !expiresAt || !nonce) return null;

  const expires = Number(expiresAt);
  if (!Number.isFinite(expires)) return null;

  return { userId, expiresAt: expires, nonce };
}

export type ResetCheck =
  | { ok: true; userId: string }
  | { ok: false; reason: "malformed" | "expired" | "used" };

export function verifyResetToken(
  token: string,
  passwordHash: string | null,
  now: Date = new Date()
): ResetCheck {
  const [encoded, signature] = String(token ?? "").split(".");
  const parsed = readResetToken(token);
  if (!parsed || !signature || !encoded) return { ok: false, reason: "malformed" };

  const expected = sign(
    Buffer.from(encoded, "base64url").toString("utf8"),
    passwordHash ?? ""
  );

  // Compared in constant time, and only after the lengths match — timingSafeEqual
  // throws on a length mismatch, which would itself be a signal.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    // A good signature over a different hash means the password has since
    // changed: the link was already used, which is worth saying plainly.
    return { ok: false, reason: "used" };
  }

  if (parsed.expiresAt <= now.getTime()) return { ok: false, reason: "expired" };

  return { ok: true, userId: parsed.userId };
}

export function resetLink(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}
