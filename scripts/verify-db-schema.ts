/**
 * Checks that the live database actually has every column the code expects.
 *
 *   npm run db:verify
 *
 * This project uses `prisma db push` and keeps no migrations folder, so a
 * column added to schema.prisma only reaches a database when someone runs that
 * command against it. Forget production and the site half-works: Prisma asks
 * for every column of a row, so a page reading a whole User or Order throws
 * "Application error: a server-side exception", while a page that happens to
 * read another table keeps rendering — which looks like anything except a
 * missing column.
 *
 * Read-only. It changes nothing; `npm run db:push` is what fixes what it finds.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

/**
 * The local .env.local points wherever the developer's own database is, which
 * is not necessarily the one the live site uses — and a check that quietly
 * passes against the wrong database is worse than no check at all. Setting
 * PROD_DATABASE_URL aims this at that database for one run without editing,
 * and therefore without forgetting to un-edit, any file.
 */
export function useProdUrlIfGiven(): boolean {
  const prod = process.env.PROD_DATABASE_URL;
  if (!prod) return false;
  process.env.DATABASE_URL = prod;
  process.env.DIRECT_URL = prod;
  console.log("\n*** Using PROD_DATABASE_URL — this is the live database. ***");
  return true;
}

async function main() {
  useProdUrlIfGiven();
  const { Prisma, PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  const { findSchemaDrift } = await import("../lib/db/schema-drift");
  const { missingTables, missingColumns } = await findSchemaDrift(
    prisma as never,
    Prisma.dmmf.datamodel
  );
  const expectedCount = Prisma.dmmf.datamodel.models.length;

  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^.*@/, "").replace(/\/.*$/, "") || "(unknown)";
  console.log(`\nDatabase: ${host}`);
  console.log(`${expectedCount} tables expected\n`);

  if (!missingTables.length && !missingColumns.length) {
    console.log("  Everything the code expects is there.\n");
    await prisma.$disconnect();
    return;
  }

  if (missingTables.length) {
    console.log(`  ${missingTables.length} table(s) missing:`);
    for (const t of missingTables) console.log(`      ${t}`);
    console.log("");
  }

  if (missingColumns.length) {
    console.log(`  ${missingColumns.length} column(s) missing:`);
    for (const c of missingColumns) console.log(`      ${c}`);
    console.log("");
  }

  console.log("  Any page that reads a whole row from these tables is crashing.");
  console.log("  Fix it with:  npm run db:push\n");

  await prisma.$disconnect();
  process.exit(1);
}

main().catch((err) => {
  console.error(`\nCould not reach the database: ${err?.message ?? err}\n`);
  process.exit(1);
});
