/**
 * Checks the live sitemap and says what is actually in it.
 *
 * Exists because the sitemap is the one thing you cannot verify by opening the
 * site: it looks fine with 30 URLs and fine with 300. Run it after a deploy.
 *
 *   node scripts/check-sitemap.mjs
 *   node scripts/check-sitemap.mjs https://karyanabakery.com   (check the mirror)
 */

const SITE = process.argv[2] ?? "https://www.karyanabakery.ca";
const CANONICAL_HOST = "www.karyanabakery.ca";

// Public pages that must always be listed. Kept here rather than imported so
// the script also works against a deployment built from older code.
const REQUIRED_PAGES = [
  "/", "/shop", "/memberships", "/custom-cake", "/blog", "/events",
  "/about", "/contact", "/how-to-order", "/faq", "/refer-a-friend",
  "/ambassador", "/track-order", "/cake-terms", "/terms", "/privacy",
];

let res;
try {
  res = await fetch(`${SITE}/sitemap.xml`, {
    headers: { "user-agent": "karyana-sitemap-check" },
    redirect: "follow",
  });
} catch (err) {
  console.error(`✗ Could not reach ${SITE}: ${err.message}`);
  process.exit(1);
}

if (!res.ok) {
  console.error(`✗ ${SITE}/sitemap.xml returned HTTP ${res.status}`);
  process.exit(1);
}

const xml = await res.text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (urls.length === 0) {
  console.error("✗ The sitemap has no <loc> entries at all.");
  console.error(xml.slice(0, 400));
  process.exit(1);
}

const hosts = new Set(urls.map((u) => new URL(u).host));
const paths = urls.map((u) => new URL(u).pathname.replace(/\/$/, "") || "/");

const products = paths.filter((p) => p.startsWith("/product/"));
const categories = paths.filter((p) => p.startsWith("/category/"));
const posts = paths.filter((p) => p.startsWith("/blog/"));
const missing = REQUIRED_PAGES.filter((p) => !paths.includes(p));
const wrongHost = [...hosts].filter((h) => h !== CANONICAL_HOST);

console.log(`Sitemap: ${SITE}/sitemap.xml`);
console.log(`  URLs total .......... ${urls.length}`);
console.log(`  Products ............ ${products.length}`);
console.log(`  Categories .......... ${categories.length}`);
console.log(`  Blog posts .......... ${posts.length}`);
console.log(`  Static pages ........ ${paths.length - products.length - categories.length - posts.length}`);
console.log(`  Domains used ........ ${[...hosts].join(", ")}`);
console.log("");

let failed = false;

if (wrongHost.length) {
  console.error(`✗ Wrong domain in the sitemap: ${wrongHost.join(", ")}`);
  console.error(`  Everything must be ${CANONICAL_HOST}.`);
  failed = true;
} else {
  console.log(`✓ Every URL is on ${CANONICAL_HOST}`);
}

if (missing.length) {
  console.error(`✗ Missing public pages: ${missing.join(", ")}`);
  failed = true;
} else {
  console.log(`✓ All ${REQUIRED_PAGES.length} public pages are listed`);
}

if (products.length === 0) {
  console.error("✗ No product URLs. The Sanity fetch failed, or the deploy is older than the sitemap fix.");
  failed = true;
} else {
  console.log(`✓ ${products.length} products listed`);
}

process.exit(failed ? 1 : 0);
