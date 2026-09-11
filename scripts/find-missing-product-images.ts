/**
 * Karyana — Find products with no main image (and no gallery photo either)
 *
 * These are exactly the products that fall back to the generic site logo
 * in link previews (WhatsApp/Facebook/etc.), since there's no real photo
 * to show. Fix them by opening each one in Sanity Studio (/studio) and
 * uploading a photo under "Main image".
 *
 * USAGE:
 *   npx tsx scripts/find-missing-product-images.ts
 */

import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-10-01",
  token: process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

async function run() {
  const products = await client.fetch<
    { _id: string; name: string; slug: string; hasImage: boolean; galleryCount: number }[]
  >(`
    *[_type == "product"] | order(name asc) {
      _id, name, "slug": slug.current,
      "hasImage": defined(image),
      "galleryCount": count(gallery)
    }
  `);

  const missing = products.filter((p) => !p.hasImage && p.galleryCount === 0);
  const imageOnlyInGallery = products.filter((p) => !p.hasImage && p.galleryCount > 0);

  console.log(`\nTotal products: ${products.length}\n`);

  if (missing.length) {
    console.log(`❌ ${missing.length} product(s) with NO photo at all (showing the generic logo in previews):\n`);
    for (const p of missing) {
      console.log(`  - ${p.name}  →  karyanabakery.ca/product/${p.slug}`);
    }
  } else {
    console.log(`✅ Every product has at least a main image or a gallery photo.`);
  }

  if (imageOnlyInGallery.length) {
    console.log(`\n⚠️  ${imageOnlyInGallery.length} product(s) with no MAIN image but at least one gallery photo (previews use the gallery photo, but the main image should still be set):\n`);
    for (const p of imageOnlyInGallery) {
      console.log(`  - ${p.name}  →  karyanabakery.ca/product/${p.slug}`);
    }
  }

  console.log(`\n👉 Fix these in Sanity Studio (karyanabakery.ca/studio) — open each product and upload a photo under "Main image".\n`);
}

run().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
