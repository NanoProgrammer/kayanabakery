/**
 * Karyana — Final consolidation
 *
 * Handles remaining duplicate categories where the UUID copy still has products
 * (e.g. mexican-goodies). Re-points products to the canonical "category-X" id
 * and deletes the UUID duplicate.
 *
 * USAGE:
 *   npx tsx scripts/consolidate-categories.ts
 */

import { createClient } from "next-sanity";
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.example", override: true });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_READ_TOKEN;

if (!projectId || !token) {
  console.error("❌ Missing env vars in .env.local");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-02-19",
  token,
  useCdn: false,
});

type Cat = {
  _id: string;
  slug: string;
  productCount: number;
};

async function run() {
  console.log("🔍 Fetching all categories...\n");

  const allCats = await client.fetch<Cat[]>(`
    *[_type == "category"] | order(slug.current asc) {
      _id,
      "slug": slug.current,
      "productCount": count(*[_type == "product" && ^._id in categories[]._ref])
    }
  `);

  // Group by slug
  const bySlug = new Map<string, Cat[]>();
  for (const c of allCats) {
    if (!bySlug.has(c.slug)) bySlug.set(c.slug, []);
    bySlug.get(c.slug)!.push(c);
  }

  // Find slugs with duplicates
  const duplicates = [...bySlug.entries()].filter(([_, cats]) => cats.length > 1);

  if (duplicates.length === 0) {
    console.log("✅ No duplicates found! All clean.");
    return;
  }

  console.log(`Found ${duplicates.length} slugs with duplicates:\n`);

  for (const [slug, cats] of duplicates) {
    // Winner: prefer "category-X" id
    const canonical = cats.find((c) => c._id.startsWith("category-"));
    const others = cats.filter((c) => c._id !== canonical?._id);

    if (!canonical) {
      console.log(`  ⚠️  ${slug}: no canonical (category-X) version found, skipping`);
      continue;
    }

    console.log(`  📋 ${slug}:`);
    console.log(`     Winner: ${canonical._id} (${canonical.productCount} products)`);
    for (const loser of others) {
      console.log(
        `     Loser:  ${loser._id.slice(0, 36)}... (${loser.productCount} products to relink)`
      );
    }

    for (const loser of others) {
      // Find products that reference loser
      const products = await client.fetch<
        { _id: string; categories: any[] }[]
      >(`*[_type == "product" && $loserId in categories[]._ref] {
          _id,
          categories
        }`,
        { loserId: loser._id }
      );

      // Re-link each product
      for (const p of products) {
        const newCats = p.categories
          .map((c: any, i: number) => ({
            _key: c._key || `cat-${i}`,
            _type: "reference",
            _ref: c._ref === loser._id ? canonical._id : c._ref,
          }))
          // Dedup if both winner and loser refs were on the product
          .filter(
            (c: any, i: number, arr: any[]) =>
              arr.findIndex((x) => x._ref === c._ref) === i
          );

        await client.patch(p._id).set({ categories: newCats }).commit();
        console.log(`       ✓ relinked product ${p._id}`);
      }

      // Delete the loser
      try {
        await client.delete(loser._id);
        try {
          await client.delete(`drafts.${loser._id}`);
        } catch {}
        console.log(`       🗑️  deleted ${loser._id.slice(0, 36)}...`);
      } catch (err: any) {
        console.error(`       ✗ failed to delete: ${err.message}`);
      }
    }
  }

  console.log("\n✅ Consolidation complete!");
  console.log("\n👉 Restart `npm run dev` (delete .next first) to bust cache.");
}

run().catch((err) => {
  console.error("\n❌ Failed:", err);
  process.exit(1);
});