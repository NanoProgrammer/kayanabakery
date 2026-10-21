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

async function main() {
  const { Prisma, PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  // What the code believes exists, straight from the generated schema.
  const expected = new Map<string, Set<string>>();
  for (const model of Prisma.dmmf.datamodel.models) {
    const table = model.dbName ?? model.name;
    const columns = new Set<string>();
    for (const field of model.fields) {
      // Relations are joins, not columns.
      if (field.kind === "object") continue;
      columns.add(field.dbName ?? field.name);
    }
    expected.set(table, columns);
  }

  const rows = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = current_schema()
  `;

  const actual = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!actual.has(r.table_name)) actual.set(r.table_name, new Set());
    actual.get(r.table_name)!.add(r.column_name);
  }

  const missingTables: string[] = [];
  const missingColumns: string[] = [];

  for (const [table, columns] of expected) {
    const live = actual.get(table);
    if (!live) {
      missingTables.push(table);
      continue;
    }
    for (const col of columns) {
      if (!live.has(col)) missingColumns.push(`${table}.${col}`);
    }
  }

  const url = process.env.DATABASE_URL ?? "";
  const host = url.replace(/^.*@/, "").replace(/\/.*$/, "") || "(unknown)";
  console.log(`\nDatabase: ${host}`);
  console.log(`${expected.size} tables expected, ${actual.size} found\n`);

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
