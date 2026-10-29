/**
 * What the code expects from the database that the database doesn't have.
 *
 * This project uses `prisma db push` and keeps no migrations folder, so a
 * column added to schema.prisma reaches a database only when someone runs that
 * command against it. Forgetting production has now broken the live site three
 * times, and the failure is close to unreadable: Prisma names every column in
 * the RETURNING clause of a write, so one missing column makes every create on
 * that table throw — registration answers 500, sign-in reports a wrong
 * password, a cron returns an HTML error page.
 *
 * Shared by `db:verify`, which reports, and by the build, which refuses.
 */
export type SchemaDrift = {
  missingTables: string[];
  missingColumns: string[];
};

type MinimalPrisma = {
  $queryRaw: <T>(q: TemplateStringsArray) => Promise<T>;
};

export async function findSchemaDrift(
  prisma: MinimalPrisma,
  dmmf: { models: readonly any[] }
): Promise<SchemaDrift> {
  const expected = new Map<string, Set<string>>();
  for (const model of dmmf.models) {
    const table = model.dbName ?? model.name;
    const columns = new Set<string>();
    for (const f of model.fields) {
      // Relations are joins, not columns.
      if (f.kind === "object") continue;
      columns.add(f.dbName ?? f.name);
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

  return { missingTables, missingColumns };
}
