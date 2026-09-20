/**
 * Runs a Prisma CLI command with the same environment the app itself uses.
 *
 * Prisma's CLI reads .env and stops there — it does not know about .env.local,
 * which Next.js loads and gives priority to. When the two disagree about
 * DATABASE_URL (an old Neon endpoint left behind in .env, say), the app talks
 * to the right database while `prisma db push` fails against a host that no
 * longer exists, and the error says nothing about which file it came from.
 *
 * Usage:  node scripts/prisma-env.mjs db push
 */
import { config as loadEnv } from "dotenv";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// Same order Next.js uses: .env first, .env.local wins.
loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", override: true, quiet: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env or .env.local.");
  process.exit(1);
}

// Say which database is about to be touched — the whole point is to make the
// silent disagreement between the two files visible.
try {
  const { host, pathname } = new URL(process.env.DATABASE_URL);
  const source = existsSync(".env.local") ? ".env.local (or .env)" : ".env";
  console.log(`Target: ${pathname.replace(/^\//, "")} at ${host}`);
  console.log(`From:   ${source}\n`);
} catch {
  console.error("DATABASE_URL does not look like a valid connection string.");
  process.exit(1);
}

const result = spawnSync("npx", ["prisma", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status ?? 1);
