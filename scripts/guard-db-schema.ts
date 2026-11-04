/**
 * Refuses to build against a database the code has outgrown.
 *
 * Three times now a column has been added to schema.prisma and deployed
 * without `prisma db push` having been run against production, and each time
 * the site broke in a way that blamed something else: registration answered
 * 500, sign-in told customers their password was wrong, the daily cron
 * returned an HTML error page. Prisma names every column in the RETURNING
 * clause of a write, so one missing column takes down every write to that
 * table.
 *
 * A deploy that cannot work is better stopped here, where the message says
 * what to run, than discovered by a customer.
 *
 * It only ever fails on drift it can actually see. No DATABASE_URL, or a
 * database it cannot reach, means it cannot tell — and a build that fails
 * because a network blipped is its own kind of outage. Those warn and pass.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("[db-guard] No DATABASE_URL — skipping the schema check.");
    return;
  }

  const { Prisma, PrismaClient } = await import("@prisma/client");
  const { findSchemaDrift } = await import("../lib/db/schema-drift");
  const { liveIdentity } = await import("../lib/db/identity");
  const prisma = new PrismaClient();

  let drift;
  let identity = "(not reached)";
  try {
    identity = await liveIdentity(prisma as never, process.env.DATABASE_URL);
    drift = await findSchemaDrift(prisma as never, Prisma.dmmf.datamodel);
  } catch (err: any) {
    console.warn(
      `[db-guard] Could not reach the database (${err?.message ?? err}) — skipping the schema check.`
    );
    await prisma.$disconnect().catch(() => {});
    return;
  }
  await prisma.$disconnect().catch(() => {});

  const { missingTables, missingColumns } = drift;
  // Printed on success as well as on failure. When this guard failed on
  // Vercel while `db:verify` passed locally, the only way to tell whether the
  // two runs were even talking to the same database was to compare these two
  // lines — so both have to exist.
  if (!missingTables.length && !missingColumns.length) {
    console.log(`[db-guard] The database has everything the code expects.`);
    console.log(`[db-guard] ${identity}`);
    return;
  }

  console.error("\n────────────────────────────────────────────────────────");
  console.error("  BUILD STOPPED — the database is behind the code.");
  console.error(`  Database: ${identity}\n`);
  if (missingTables.length) {
    console.error("  Missing tables:");
    for (const t of missingTables) console.error(`    ${t}`);
  }
  if (missingColumns.length) {
    console.error("  Missing columns:");
    for (const c of missingColumns) console.error(`    ${c}`);
  }
  // Naming the consequence generically. An earlier version gave registration
  // and sign-in as the example, which is only what happens when the missing
  // column is on User or Membership — it reads as wrong when it is on Order.
  const tables = [
    ...new Set([...missingTables, ...missingColumns.map((c) => c.split(".")[0])]),
  ];
  console.error(
    `\n  Prisma names every column when it writes, so deploying this would`
  );
  console.error(
    `  fail every create and update on: ${tables.join(", ")}.`
  );
  console.error("\n  Fix it with:  npm run db:push");
  // The trap this guard walked into itself: a push can succeed against a
  // database that is not the one being built against. The host alone does not
  // tell them apart, which is why the line above names the database, the
  // schema and the role as well.
  console.error("  If that already passed, compare the line above against the");
  console.error("  one `npm run db:verify` prints — same host is not the same");
  console.error("  database. If they differ, run:");
  console.error("    PowerShell:  $env:PROD_DATABASE_URL=\"<this build\u2019s DATABASE_URL>\"; npm run db:push");
  console.error("    bash:        PROD_DATABASE_URL=\"<this build\u2019s DATABASE_URL>\" npm run db:push");
  console.error("────────────────────────────────────────────────────────\n");

  process.exit(1);
}

main().catch((err) => {
  // A broken guard must not block a deploy that is otherwise fine.
  console.warn(`[db-guard] skipped: ${err?.message ?? err}`);
});
