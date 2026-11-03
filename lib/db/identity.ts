/**
 * Which database a script is actually talking to.
 *
 * This matters more than it sounds. A build on Vercel reported one column
 * missing while `db:push` and `db:verify` had just succeeded locally, and both
 * outputs named the same host — because both printed ONLY the host:
 *
 *     Database: ep-withered-lab-an08erpu.c-6.us-east-1.aws.neon.tech
 *
 * A Neon endpoint can hold several databases, and a connection string can
 * point at a different schema with `?schema=`. Two connections that differ in
 * either look identical in a line like that, so "same host" was read as "same
 * database" and the real difference stayed invisible.
 *
 * So: name the database, the schema and the role as well, and read them from
 * the live connection rather than from the URL, because that is what the
 * drift check itself queried.
 */
export type UrlIdentity = {
  host: string;
  /** The database name from the URL path, when the URL carries one. */
  database: string | null;
  /** The role from the URL's userinfo, when the URL carries one. */
  user: string | null;
  /** An explicit ?schema= / ?search_path= override, when present. */
  schema: string | null;
};

/**
 * Pulls what it can out of a connection string without connecting, and
 * without ever touching the password. Hand-parsed rather than `new URL()`
 * because passwords routinely contain characters that make URL() throw, and a
 * diagnostic that crashes on the thing it is diagnosing is no use.
 */
export function describeDatabaseUrl(url: string | undefined | null): UrlIdentity {
  const blank: UrlIdentity = { host: "(unknown)", database: null, user: null, schema: null };
  if (!url) return blank;

  const withoutScheme = url.replace(/^[a-zA-Z0-9+.-]+:\/\//, "");
  const at = withoutScheme.lastIndexOf("@");
  const userinfo = at === -1 ? "" : withoutScheme.slice(0, at);
  const rest = at === -1 ? withoutScheme : withoutScheme.slice(at + 1);

  const user = userinfo ? decodeOrRaw(userinfo.split(":")[0]) || null : null;

  const [beforeQuery, query = ""] = splitOnce(rest, "?");
  const [hostPart, path = ""] = splitOnce(beforeQuery, "/");

  const host = hostPart || "(unknown)";
  const database = path ? decodeOrRaw(path.split("/")[0]) || null : null;

  let schema: string | null = null;
  for (const pair of query.split("&")) {
    const [rawKey, rawValue = ""] = splitOnce(pair, "=");
    const key = rawKey.toLowerCase();
    if (key === "schema" || key === "search_path") {
      schema = decodeOrRaw(rawValue) || null;
    }
  }

  return { host, database, user, schema };
}

function splitOnce(s: string, sep: string): [string, string?] {
  const i = s.indexOf(sep);
  if (i === -1) return [s, undefined];
  return [s.slice(0, i), s.slice(i + sep.length)];
}

function decodeOrRaw(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * One line naming the connection, for a log a human will compare against
 * another log. Every part the URL gave us appears, so two runs against
 * different databases on one host cannot produce the same line.
 */
export function formatIdentity(id: {
  host: string;
  database?: string | null;
  schema?: string | null;
  user?: string | null;
}): string {
  const parts = [`host ${id.host}`];
  parts.push(`db ${id.database ?? "(default)"}`);
  parts.push(`schema ${id.schema ?? "(default)"}`);
  if (id.user) parts.push(`role ${id.user}`);
  return parts.join("  ·  ");
}

type MinimalPrisma = {
  $queryRaw: <T>(q: TemplateStringsArray) => Promise<T>;
};

/**
 * What the server itself says the connection resolved to. Preferred over the
 * URL: it reflects defaults, `search_path`, and anything a pooler rewrote.
 * Falls back to the URL if the query fails, since this is only a label.
 */
export async function liveIdentity(
  prisma: MinimalPrisma,
  url: string | undefined | null
): Promise<string> {
  const fromUrl = describeDatabaseUrl(url);
  try {
    const rows = await prisma.$queryRaw<
      { database: string; schema: string | null; role: string }[]
    >`SELECT current_database() AS database, current_schema() AS schema, current_user AS role`;
    const row = rows?.[0];
    if (row) {
      return formatIdentity({
        host: fromUrl.host,
        database: row.database,
        schema: row.schema,
        user: row.role,
      });
    }
  } catch {
    // Keep the URL-derived line; a label is not worth failing over.
  }
  return formatIdentity(fromUrl);
}
