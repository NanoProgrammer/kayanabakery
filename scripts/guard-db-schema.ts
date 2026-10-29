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
  const prisma = new PrismaClient();

  let drift;
  try {
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
  if (!missingTables.length && !missingColumns.length) {
    console.log("[db-guard] The database has everything the code expects.");
    return;
  }

  const host = (process.env.DATABASE_URL ?? "")
    .replace(/^.*@/, "")
    .replace(/\/.*$/, "");

  console.error("\n────────────────────────────────────────────────────────");
  console.error("  BUILD STOPPED — the database is behind the code.");
  console.error(`  Database: ${host}\n`);
  if (missingTables.length) {
    console.error("  Missing tables:");
    for (const t of missingTables) console.error(`    ${t}`);
  }
  if (missingColumns.length) {
    console.error("  Missing columns:");
    for (const c of missingColumns) console.error(`    ${c}`);
  }
  console.error("\n  Deploying this would break every write to those tables:");
  console.error("  registration answers 500 and sign-in reports a wrong password.");
  console.error("\n  Fix it with:  npm run db:push");
  console.error("────────────────────────────────────────────────────────\n");

  process.exit(1);
}

main().catch((err) => {
  // A broken guard must not block a deploy that is otherwise fine.
  console.warn(`[db-guard] skipped: ${err?.message ?? err}`);
});
