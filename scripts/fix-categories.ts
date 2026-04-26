/**
 * Karyana — Fix product/category references
 *
 * This script fixes broken category references on products by:
 *   1. Fetching all categories
 *   2. Mapping product slugs → category slugs
 *   3. Patching each product with the correct category refs
 *
 * USAGE:
 *   npx tsx scripts/fix-categories.ts
 */

import { createClient } from "next-sanity";
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.example", override: true });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_READ_TOKEN;

if (!projectId || !token) {
  console.error("❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID or SANITY_API_READ_TOKEN in .env.example");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-10-01",
  token,
  useCdn: false,
});

// Mapping: product slug -> [category slugs]
const PRODUCT_CATEGORIES: Record<string, string[]> = {
  "concha-tradicional": ["conchas", "traditional-mexican-bread"],
  "concha-de-chocolate": ["conchas"],
  "conchas-pack-6": ["conchas", "boxes"],
  "mega-concha": ["conchas"],
  "tres-leches-cake": ["cakes"],
  "custom-celebration-cake": ["cakes"],
  "classic-churros": ["churros"],
  "corn-pancakes-dulce-de-leche": ["corn-pancakes"],
  "pan-dulce-mix-box": ["traditional-mexican-bread", "boxes"],
  cuernos: ["traditional-mexican-bread"],
  "family-box": ["boxes"],
  "fiesta-box": ["boxes"],
  "mega-fiesta-box": ["boxes"],
  polvorones: ["mexican-goodies"],
  "pan-de-muerto": ["pan-de-muerto"],
};

async function run() {
  console.log("🔍 Fetching all categories...");
  const categories = await client.fetch<{ _id: string; slug: string }[]>(
    `*[_type == "category"] { _id, "slug": slug.current }`
  );
  console.log(`   Found ${categories.length} categories.`);
  console.table(categories.map((c) => ({ slug: c.slug, id: c._id })));

  console.log("\n🔍 Fetching all products...");
  const products = await client.fetch<{ _id: string; slug: string; name: string }[]>(
    `*[_type == "product"] { _id, "slug": slug.current, name }`
  );
  console.log(`   Found ${products.length} products.\n`);

  // Build slug -> id map
  const catBySlug = new Map(categories.map((c) => [c.slug, c._id]));

  let patched = 0;
  let skipped = 0;

  for (const p of products) {
    const targetCats = PRODUCT_CATEGORIES[p.slug];
    if (!targetCats) {
      console.log(`  ⏭️  ${p.name} — no mapping defined, skipping`);
      skipped++;
      continue;
    }

    const refs = targetCats
      .map((slug, i) => {
        const id = catBySlug.get(slug);
        if (!id) {
          console.log(`     ⚠️  category "${slug}" not found in dataset`);
          return null;
        }
        return {
          _key: `cat-${i}-${slug}`,
          _type: "reference" as const,
          _ref: id,
        };
      })
      .filter(Boolean);

    if (refs.length === 0) {
      console.log(`  ⏭️  ${p.name} — no valid category refs, skipping`);
      skipped++;
      continue;
    }

    try {
      await client.patch(p._id).set({ categories: refs }).commit();
      console.log(`  ✓ ${p.name} → [${targetCats.join(", ")}]`);
      patched++;
    } catch (err: any) {
      console.error(`  ✗ ${p.name} — ${err.message}`);
    }
  }

  console.log(`\n✅ Done! Patched ${patched} products, skipped ${skipped}.`);
  console.log("\n👉 Wait ~60s OR restart `npm run dev` then visit http://localhost:3000/category/cakes");
}

run().catch((err) => {
  console.error("\n❌ Failed:", err);
  process.exit(1);
});