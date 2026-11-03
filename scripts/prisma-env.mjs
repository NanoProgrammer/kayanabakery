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

// Set PROD_DATABASE_URL to aim a single command at the live database without
// editing .env.local — and so without leaving it edited afterwards, pointing
// everyday local work at production.
if (process.env.PROD_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.PROD_DATABASE_URL;
  process.env.DIRECT_URL = process.env.PROD_DATABASE_URL;
  console.log("*** Using PROD_DATABASE_URL — this is the live database. ***");
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env or .env.local.");
  process.exit(1);
}

// Say which database is about to be touched — the whole point is to make the
// silent disagreement between the two files visible.
//
// It names the database, the schema and the role, not just the host, and in
// the same shape as `db:verify` and the build guard. A push once reported
// success while the build still reported the column missing, and both outputs
// named the same host: a Neon endpoint can hold several databases, so the host
// alone cannot tell two connections apart. These lines are meant to be
// compared side by side, so they have to match in format.
//
// Hand-parsed rather than `new URL()`: a password containing a slash or a hash
// makes URL() throw, and this script used to exit 1 and refuse to push at all
// in that case.
function describe(url) {
  const withoutScheme = url.replace(/^[a-zA-Z0-9+.-]+:\/\//, "");
  const at = withoutScheme.lastIndexOf("@");
  const userinfo = at === -1 ? "" : withoutScheme.slice(0, at);
  const rest = at === -1 ? withoutScheme : withoutScheme.slice(at + 1);
  const dec = (v) => {
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const q = rest.indexOf("?");
  const query = q === -1 ? "" : rest.slice(q + 1);
  const beforeQuery = q === -1 ? rest : rest.slice(0, q);
  const slash = beforeQuery.indexOf("/");
  const host = (slash === -1 ? beforeQuery : beforeQuery.slice(0, slash)) || "(unknown)";
  const path = slash === -1 ? "" : beforeQuery.slice(slash + 1);
  const database = path ? dec(path.split("/")[0]) || "(default)" : "(default)";
  let schema = "(default)";
  for (const pair of query.split("&")) {
    const eq = pair.indexOf("=");
    const key = (eq === -1 ? pair : pair.slice(0, eq)).toLowerCase();
    if (key === "schema" || key === "search_path") schema = dec(pair.slice(eq + 1)) || "(default)";
  }
  const role = userinfo ? dec(userinfo.split(":")[0]) : "";
  return { host, database, schema, role };
}

const id = describe(process.env.DATABASE_URL);
const source = process.env.PROD_DATABASE_URL
  ? "PROD_DATABASE_URL"
  : existsSync(".env.local")
  ? ".env.local (or .env)"
  : ".env";
console.log(
  `Target: host ${id.host}  \u00b7  db ${id.database}  \u00b7  schema ${id.schema}` +
    (id.role ? `  \u00b7  role ${id.role}` : "")
);
console.log(`From:   ${source}\n`);

const result = spawnSync("npx", ["prisma", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

process.exit(result.status ?? 1);
