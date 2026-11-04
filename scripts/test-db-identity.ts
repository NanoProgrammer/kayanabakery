/**
 * Naming the database a script is really connected to.
 *
 *   npm run test:identity
 *
 * Written because a build log and a local check printed the same line while
 * disagreeing about whether a column existed. Both printed only the host, and
 * a Neon endpoint can serve more than one database. The whole point of these
 * tests is that two different connections must never format alike — and that
 * the parser never throws on a real-world password.
 */
import { describeDatabaseUrl, formatIdentity } from "../lib/db/identity";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

console.log("\nIdentifying the database\n");

const neon =
  "postgresql://neondb_owner:npg_SeCrEt@ep-withered-lab-an08erpu.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

check("the host comes out", describeDatabaseUrl(neon).host, "ep-withered-lab-an08erpu.c-6.us-east-1.aws.neon.tech");
check("the database name comes out", describeDatabaseUrl(neon).database, "neondb");
check("the role comes out", describeDatabaseUrl(neon).user, "neondb_owner");
check("no ?schema= means no override", describeDatabaseUrl(neon).schema, null);

// The case the old one-line output could not show.
const sameHostOtherDb = neon.replace("/neondb?", "/neondb_preview?");
check(
  "two databases on one host format differently",
  formatIdentity(describeDatabaseUrl(neon)) !== formatIdentity(describeDatabaseUrl(sameHostOtherDb)),
  true
);
check(
  "and the line says which",
  formatIdentity(describeDatabaseUrl(sameHostOtherDb)).includes("db neondb_preview"),
  true
);

const otherSchema = neon + "&schema=staging";
check("an explicit schema is picked up", describeDatabaseUrl(otherSchema).schema, "staging");
check(
  "a schema override changes the line",
  formatIdentity(describeDatabaseUrl(neon)) !== formatIdentity(describeDatabaseUrl(otherSchema)),
  true
);
check("search_path is honoured too", describeDatabaseUrl(neon + "&search_path=other").schema, "other");
check("the schema key is case-insensitive", describeDatabaseUrl(neon + "&SCHEMA=Caps").schema, "Caps");

// Passwords are where a naive `new URL()` falls over.
check(
  "a password full of punctuation does not break parsing",
  describeDatabaseUrl("postgres://me:p@ss/w%rd!#?@db.example.com/appdb").host,
  "db.example.com"
);
check(
  "and its database still comes out",
  describeDatabaseUrl("postgres://me:p@ss/w%rd!#?@db.example.com/appdb").database,
  "appdb"
);
check(
  "a percent that is not an escape is left alone",
  describeDatabaseUrl("postgres://u:p@h/100%raw").database,
  "100%raw"
);
check("a percent-escaped name is decoded", describeDatabaseUrl("postgres://u:p@h/my%20db").database, "my db");

check("a URL with no credentials still parses", describeDatabaseUrl("postgresql://localhost:5432/karyana").host, "localhost:5432");
check("...and names the database", describeDatabaseUrl("postgresql://localhost:5432/karyana").database, "karyana");
check("...and reports no role", describeDatabaseUrl("postgresql://localhost:5432/karyana").user, null);

check("no path means no database name", describeDatabaseUrl("postgresql://u:p@h:5432").database, null);
check("a bare slash is not a database name", describeDatabaseUrl("postgresql://u:p@h:5432/").database, null);
check("a missing URL is unknown, not a crash", describeDatabaseUrl(undefined).host, "(unknown)");
check("an empty URL is unknown too", describeDatabaseUrl("").host, "(unknown)");

// The pooled and direct Neon hosts differ by one word; the line must show it.
check(
  "pooled and direct hosts do not format alike",
  formatIdentity(describeDatabaseUrl(neon)) !==
    formatIdentity(describeDatabaseUrl(neon.replace("ep-withered-lab-an08erpu", "ep-withered-lab-an08erpu-pooler"))),
  true
);

check(
  "the password never reaches the output",
  formatIdentity(describeDatabaseUrl(neon)).includes("npg_SeCrEt"),
  false
);
check(
  "a missing database reads as the default, not as blank",
  formatIdentity({ host: "h" }),
  "host h  ·  db (default)  ·  schema (default)"
);
check(
  "a full line reads in one glance",
  formatIdentity({ host: "h", database: "neondb", schema: "public", user: "neondb_owner" }),
  "host h  ·  db neondb  ·  schema public  ·  role neondb_owner"
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
