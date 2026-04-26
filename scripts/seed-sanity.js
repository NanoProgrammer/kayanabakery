/**
 * Karyana Bakery — Sanity Seed Script (resilient v2)
 *
 * Differences from v1:
 *   - Uses Picsum (always reliable) as primary source
 *   - Falls back gracefully if any image fails (creates doc without image)
 *   - Retries each image once before giving up
 *   - Will NEVER stop seeding because of a broken image URL
 *
 * USAGE:
 *   1. Add SANITY_API_WRITE_TOKEN to .env.local (Editor permissions)
 *   2. npm install -D tsx dotenv
 *   3. npx tsx scripts/seed-sanity.ts
 */

import { createClient } from "next-sanity";
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.example", override: true });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_READ_TOKEN;

if (!projectId) {
  console.error(
    "\n❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local\n" +
      "   Find it at https://sanity.io/manage → your project\n"
  );
  process.exit(1);
}

if (!token) {
  console.error(
    "\n❌ Missing SANITY_API_READ_TOKEN in .env.local\n" +
      "   Go to https://sanity.io/manage → your project → API → Tokens\n" +
      '   Create a token with "Editor" permissions, then add to .env.local:\n' +
      '   SANITY_API_READ_TOKEN="sk..."\n'
  );
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: "2024-10-01",
  token,
  useCdn: false,
});

// ============================================
// IMAGE URLS — using Picsum + reliable Unsplash
// Each gets a stable seed for consistent images
// ============================================
const IMAGES = {
  // Hero & generic — using Picsum with food-themed seeds
  hero: "https://picsum.photos/seed/karyana-hero/1200/1500",
  conchasCategory: "https://picsum.photos/seed/karyana-conchas/800/800",
  cakesCategory: "https://picsum.photos/seed/karyana-cakes/800/800",
  breadCategory: "https://picsum.photos/seed/karyana-bread/800/800",
  churrosCategory: "https://picsum.photos/seed/karyana-churros/800/800",

  // Products
  conchaTradicional: "https://picsum.photos/seed/concha-trad/800/800",
  conchaChocolate: "https://picsum.photos/seed/concha-choc/800/800",
  conchasPack: "https://picsum.photos/seed/concha-pack/800/800",
  megaConcha: "https://picsum.photos/seed/concha-mega/800/800",
  tresLeches: "https://picsum.photos/seed/tres-leches/800/800",
  customCake: "https://picsum.photos/seed/custom-cake/800/800",
  churros: "https://picsum.photos/seed/churros-prod/800/800",
  cornPancakes: "https://picsum.photos/seed/pancakes/800/800",
  panDulceMix: "https://picsum.photos/seed/pan-mix/800/800",
  cuernos: "https://picsum.photos/seed/cuernos/800/800",
  familyBox: "https://picsum.photos/seed/family-box/800/800",
  fiestaBox: "https://picsum.photos/seed/fiesta-box/800/800",
  megaFiesta: "https://picsum.photos/seed/mega-fiesta/800/800",
  polvorones: "https://picsum.photos/seed/polvorones/800/800",
  panDeMuerto: "https://picsum.photos/seed/pan-muerto/800/800",

  // Promo & events
  promoTresLeches: "https://picsum.photos/seed/promo-tres/900/900",
  eventMarket: "https://picsum.photos/seed/event-market/800/600",
  eventMothersDay: "https://picsum.photos/seed/event-mom/800/600",
  eventMuertos: "https://picsum.photos/seed/event-muertos/800/600",
  eventChristmas: "https://picsum.photos/seed/event-xmas/800/600",
};

async function tryFetch(url, retries = 1){
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: { "User-Agent": "karyana-seed-script/1.0" },
      });
      if (!res.ok) {
        if (attempt === retries) return null;
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return Buffer.from(await res.arrayBuffer());
    } catch {
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

async function uploadImageFromUrl(
  url,
  filename
){
  process.stdout.write(`  ⬇️  ${filename}... `);
  const buffer = await tryFetch(url, 1);
  if (!buffer) {
    console.log("⚠️  skipped (couldn't fetch)");
    return null;
  }
  try {
    const asset = await client.assets.upload("image", buffer, { filename });
    console.log("✓");
    return asset._id;
  } catch (err) {
    console.log("⚠️  skipped (upload failed)");
    return null;
  }
}

function imageRef(assetId) {
  if (!assetId) return undefined;
  return { _type: "image", asset: { _type: "reference", _ref: assetId } };
}

async function run() {
  console.log("🥖 Seeding Karyana Bakery Sanity dataset...\n");

  // -----------------------------------------------------------
  // 1. Upload all placeholder images first
  // -----------------------------------------------------------
  console.log("📸 Uploading images...");
  const imageIds = {};
  for (const [key, url] of Object.entries(IMAGES)) {
    imageIds[key] = await uploadImageFromUrl(url, `${key}.jpg`);
  }
  const uploaded = Object.values(imageIds).filter(Boolean).length;
  console.log(`✅ Uploaded ${uploaded}/${Object.keys(IMAGES).length} images\n`);

  // Helper to optionally include image field
  const withImage = (key) => {
    const ref = imageRef(imageIds[key]);
    return ref ? { image: ref } : {};
  };
  const withHeroImage = () => {
    const ref = imageRef(imageIds.hero);
    return ref ? { heroImage: ref } : {};
  };

  // -----------------------------------------------------------
  // 2. Site Settings (singleton)
  // -----------------------------------------------------------
  console.log("⚙️  Creating Site Settings...");
  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    announcementBar: [
      "✦ Free pickup in Calgary",
      "✦ Fresh baked daily — handmade with love",
      "✦ Order 48h in advance for custom cakes",
      "✦ More than bread, a home memory",
    ],
    heroTitle: "More than bread, a home memory.",
    heroSubtitle:
      "Authentic Mexican baked goods bringing the flavors of Mexico to your table — fresh conchas, tres leches cakes, churros, and more. Handmade with love in YYC since 2018.",
    ...withHeroImage(),
    referralDiscount: 10,
    pickupAddress: "Calgary, AB",
    contactEmail: "karyana@karyanabakery.ca",
  });

  // -----------------------------------------------------------
  // 3. Categories
  // -----------------------------------------------------------
  console.log("🏷️  Creating Categories...");
  const categories = [
    { slug: "conchas", name: "Conchas", tagline: "Soft, fluffy, colorful", description: "Our signature soft sweet bread topped with vanilla sugar shells. Baked by Karina and family — each bite feels like home again.", accent: "bg-otomi-red", featured: true, order: 1, image: "conchasCategory" },
    { slug: "cakes", name: "Cakes", tagline: "Next-level cakes", description: "Want to WOW your guests? We create the perfect cakes for your special event — made with premium ingredients and just the right touch of sweetness.", accent: "bg-otomi-teal", featured: true, order: 2, image: "cakesCategory" },
    { slug: "traditional-mexican-bread", name: "Traditional Mexican Bread", tagline: "Daily fresh", description: "Authentic Mexican pan dulce baked with traditional recipes passed down through generations.", accent: "bg-otomi-orange", featured: true, order: 3, image: "breadCategory" },
    { slug: "churros", name: "Churros", tagline: "Crispy outside, soft inside", description: "Rolled in cinnamon sugar and made to order. Dip 'em in Dulce de Leche for the ultimate treat.", accent: "bg-otomi-yellow", featured: true, order: 4, image: "churrosCategory" },
    { slug: "corn-pancakes", name: "Corn Pancakes", tagline: "A hug from abuelita", description: "Fluffy corn pancakes dancing in creamy dulce de leche.", accent: "bg-otomi-green", featured: false, order: 5, image: "cornPancakes" },
    { slug: "mexican-goodies", name: "Mexican Goodies", tagline: "Sweet treats", description: "Traditional Mexican sweets and treats — the kind you grew up with.", accent: "bg-otomi-purple", featured: false, order: 6, image: "polvorones" },
    { slug: "boxes", name: "Boxes", tagline: "Curated assortments", description: "Curated boxes of our most-loved bread and treats — perfect for sharing or gifting.", accent: "bg-concha-rosa", featured: false, order: 7, image: "familyBox" },
    { slug: "pan-de-muerto", name: "Pan de Muerto", tagline: "Día de los Muertos", description: "Traditional bread of the dead — sweet, anise-scented, dusted in sugar.", accent: "bg-otomi-red", featured: false, order: 8, image: "panDeMuerto" },
  ];

  for (const c of categories) {
    await client.createOrReplace({
      _id: `category-${c.slug}`,
      _type: "category",
      name: c.name,
      slug: { _type: "slug", current: c.slug },
      tagline: c.tagline,
      description: c.description,
      ...withImage(c.image),
      accentColor: c.accent,
      isFeatured: c.featured,
      displayOrder: c.order,
    });
  }

  // -----------------------------------------------------------
  // 4. Products
  // -----------------------------------------------------------
  console.log("🥖 Creating Products...");
  const products = [
    { slug: "concha-tradicional", name: "Concha Tradicional", desc: "Soft, fluffy sweet bread with our signature vanilla sugar shell topping.", price: 4.50, tag: "bestseller", featured: true, order: 1, unit: "each", lead: 0, allergens: ["gluten","dairy","eggs"], cats: ["conchas","traditional-mexican-bread"], image: "conchaTradicional" },
    { slug: "concha-de-chocolate", name: "Concha de Chocolate", desc: "Our classic concha with rich chocolate sugar topping. A chocolate lover's dream.", price: 4.50, tag: "bestseller", featured: true, order: 2, unit: "each", lead: 0, allergens: ["gluten","dairy","eggs"], cats: ["conchas"], image: "conchaChocolate" },
    { slug: "conchas-pack-6", name: "Conchas Pack of 6", desc: "Mix of 6 conchas — perfect for sharing or hoarding (we won't judge).", price: 27.00, tag: "bestseller", featured: true, order: 3, unit: "pack of 6", lead: 0, allergens: ["gluten","dairy","eggs"], cats: ["conchas","boxes"], image: "conchasPack" },
    { slug: "mega-concha", name: "Mega Concha", desc: "Like a regular concha, but five times the size. Perfect for parties or one very serious snacker.", price: 35.00, tag: "limited", featured: false, order: 4, unit: "each", lead: 48, allergens: ["gluten","dairy","eggs"], cats: ["conchas"], image: "megaConcha" },
    { slug: "tres-leches-cake", name: "Tres Leches Cake", desc: "Soft sponge soaked in three milks — sweet, creamy, melt-in-your-mouth perfection.", price: 55.00, compareAt: 95.00, tag: "bestseller", featured: true, order: 5, unit: "each", lead: 48, allergens: ["gluten","dairy","eggs"], cats: ["cakes"], image: "tresLeches" },
    { slug: "custom-celebration-cake", name: "Custom Celebration Cake", desc: "Want to WOW your guests? Tell us your theme, flavors, and date — we'll create something unforgettable.", price: 85.00, tag: "new", featured: true, order: 6, unit: "each", lead: 72, allergens: ["gluten","dairy","eggs"], cats: ["cakes"], image: "customCake" },
    { slug: "classic-churros", name: "Classic Churros", desc: "Crispy outside, soft inside, rolled in cinnamon sugar. Dip 'em in dulce de leche for the ultimate treat.", price: 12.00, tag: "bestseller", featured: true, order: 7, unit: "6-pack", lead: 0, allergens: ["gluten","dairy","eggs"], cats: ["churros"], image: "churros" },
    { slug: "corn-pancakes-dulce-de-leche", name: "Corn Pancakes with Dulce de Leche", desc: "Fluffy corn pancakes dancing in creamy dulce de leche — like a hug from abuelita in every bite.", price: 15.00, tag: "new", featured: true, order: 8, unit: "4-pack", lead: 24, allergens: ["dairy","eggs"], cats: ["corn-pancakes"], image: "cornPancakes" },
    { slug: "pan-dulce-mix-box", name: "Pan Dulce Mix Box", desc: "An assortment of our traditional Mexican sweet bread — the perfect introduction to pan dulce.", price: 35.00, tag: "", featured: false, order: 9, unit: "box", lead: 24, allergens: ["gluten","dairy","eggs"], cats: ["traditional-mexican-bread","boxes"], image: "panDulceMix" },
    { slug: "cuernos", name: "Cuernos", desc: "Soft, slightly sweet horn-shaped bread — Mexico's answer to the croissant.", price: 4.00, tag: "", featured: false, order: 10, unit: "each", lead: 0, allergens: ["gluten","dairy","eggs"], cats: ["traditional-mexican-bread"], image: "cuernos" },
    { slug: "family-box", name: "Family Box", desc: "12 pieces of mixed pan dulce — enough for the whole family. Saturday morning sorted.", price: 54.00, tag: "bestseller", featured: false, order: 11, unit: "12 pieces", lead: 24, allergens: ["gluten","dairy","eggs"], cats: ["boxes"], image: "familyBox" },
    { slug: "fiesta-box", name: "Fiesta Box", desc: "24 pieces — perfect for office gatherings, baby showers, or just because you love everyone.", price: 108.00, tag: "", featured: false, order: 12, unit: "24 pieces", lead: 48, allergens: ["gluten","dairy","eggs"], cats: ["boxes"], image: "fiestaBox" },
    { slug: "mega-fiesta-box", name: "Mega Fiesta Box", desc: "30 pieces of pan dulce assortment. The party box.", price: 120.00, tag: "", featured: false, order: 13, unit: "30 pieces", lead: 48, allergens: ["gluten","dairy","eggs"], cats: ["boxes"], image: "megaFiesta" },
    { slug: "polvorones", name: "Polvorones", desc: "Crumbly Mexican shortbread cookies dusted in cinnamon sugar. Goes perfect with coffee.", price: 18.00, tag: "", featured: false, order: 14, unit: "dozen", lead: 0, allergens: ["gluten","dairy"], cats: ["mexican-goodies"], image: "polvorones" },
    { slug: "pan-de-muerto", name: "Pan de Muerto", desc: "Traditional bread of the dead — sweet, anise-scented, dusted in sugar. Available October–November.", price: 8.00, tag: "seasonal", featured: false, order: 15, unit: "each", lead: 24, inStock: false, allergens: ["gluten","dairy","eggs"], cats: ["pan-de-muerto"], image: "panDeMuerto" },
  ];

  for (const p of products) {
    await client.createOrReplace({
      _id: `product-${p.slug}`,
      _type: "product",
      name: p.name,
      slug: { _type: "slug", current: p.slug },
      description: p.desc,
      price: p.price,
      ...(p.compareAt ? { compareAtPrice: p.compareAt } : {}),
      ...withImage(p.image),
      tag: p.tag,
      inStock: p.inStock !== false,
      isFeatured: p.featured,
      displayOrder: p.order,
      unit: p.unit,
      leadTime: p.lead,
      allergens: p.allergens,
      categories: p.cats.map((cs, i) => ({
        _key: `cat-${i}`,
        _type: "reference",
        _ref: `category-${cs}`,
      })),
    });
  }

  // -----------------------------------------------------------
  // 5. Testimonials
  // -----------------------------------------------------------
  console.log("💬 Creating Testimonials...");
  const testimonials = [
    { id: "1", quote: "Best conchas I've had outside of Mexico. Tastes exactly like the ones from my abuelita's panadería.", author: "Maria G.", role: "Calgary, AB", accent: "text-otomi-red", order: 1 },
    { id: "2", quote: "The custom cake for my daughter's quinceañera was absolutely stunning. Everyone is still talking about it.", author: "Sofía R.", role: "Quinceañera client", accent: "text-otomi-teal", order: 2 },
    { id: "3", quote: "Karina and her family bake with so much love. You can taste the tradition in every bite.", author: "Carlos M.", role: "Calgary, AB", accent: "text-otomi-orange", order: 3 },
  ];
  for (const t of testimonials) {
    await client.createOrReplace({
      _id: `testimonial-${t.id}`,
      _type: "testimonial",
      quote: t.quote,
      author: t.author,
      role: t.role,
      accent: t.accent,
      isFeatured: true,
      displayOrder: t.order,
    });
  }

  // -----------------------------------------------------------
  // 6. Home Promo
  // -----------------------------------------------------------
  console.log("🎯 Creating Home Promo...");
  await client.createOrReplace({
    _id: "homePromo-tres-leches",
    _type: "homePromo",
    enabled: true,
    eyebrow: "Limited Time",
    title: "Tres Leches Sale",
    description:
      "Our beloved Tres Leches Cake is on sale this month — soft sponge soaked in three milks, melt-in-your-mouth perfection. Save $40 while supplies last.",
    ...withImage("promoTresLeches"),
    ctaLabel: "Order yours now",
    ctaHref: "/product/tres-leches-cake",
    discount: "$40 OFF",
    validUntil: "Apr 30",
  });

  // -----------------------------------------------------------
  // 7. Events
  // -----------------------------------------------------------
  console.log("📅 Creating Events...");
  const events = [
    { slug: "farmers-makers-market-may-2026", title: "Farmers & Makers Market", start: "2026-05-23T17:00:00.000Z", end: "2026-05-23T21:00:00.000Z", label: "Every Saturday · May 23 – Oct 17", location: "cSpace Marda Loop", address: "1721 29 Ave SW, Calgary, AB", desc: "Find us every Saturday at the Farmers & Makers Market — fresh batches of conchas, churros, and pan dulce.", url: "https://www.farmersmakersmarket.ca/", image: "eventMarket" },
    { slug: "mothers-day-popup-2026", title: "Mother's Day Concha Pop-up", start: "2026-05-10T17:00:00.000Z", label: "May 10, 2026", location: "Calgary, AB", desc: "Special Mother's Day batch — heart-shaped conchas, custom cakes, and limited edition flowers-decorated pan dulce. Pre-orders only.", image: "eventMothersDay" },
    { slug: "dia-de-muertos-2026", title: "Día de los Muertos Celebration", start: "2026-11-01T07:00:00.000Z", end: "2026-11-02T07:00:00.000Z", label: "Nov 1 – 2, 2026", location: "Calgary, AB", desc: "Pre-orders for Pan de Muerto open in October. Traditional anise-scented bread of the dead, baked the way abuelita taught us.", image: "eventMuertos" },
    { slug: "christmas-rosca-reyes-2026", title: "Christmas Market — Rosca de Reyes Pre-orders", start: "2026-12-15T18:00:00.000Z", label: "December 15, 2026", location: "Calgary, AB", desc: "Pre-orders for Rosca de Reyes (Three Kings bread) and holiday gift boxes open in mid-December.", image: "eventChristmas" },
  ];
  for (const e of events) {
    await client.createOrReplace({
      _id: `event-${e.slug}`,
      _type: "event",
      title: e.title,
      slug: { _type: "slug", current: e.slug },
      startDate: e.start,
      ...(e.end ? { endDate: e.end } : {}),
      dateLabel: e.label,
      location: e.location,
      ...(e.address ? { address: e.address } : {}),
      ...(e.desc
        ? {
            description: [
              {
                _type: "block",
                _key: "block1",
                children: [{ _type: "span", _key: "span1", text: e.desc }],
              },
            ],
          }
        : {}),
      ...(e.url ? { externalUrl: e.url } : {}),
      ...withImage(e.image),
      isFeatured: true,
    });
  }

  console.log("\n✅ Seeding complete!");
  console.log(`\n📊 Summary:`);
  console.log(`   • 1 Site Settings`);
  console.log(`   • ${categories.length} Categories`);
  console.log(`   • ${products.length} Products`);
  console.log(`   • ${testimonials.length} Testimonials`);
  console.log(`   • 1 Home Promo`);
  console.log(`   • ${events.length} Events`);
  console.log(`   • ${uploaded}/${Object.keys(IMAGES).length} Images uploaded`);
  console.log("\n👉 Visit http://localhost:3000/ to see your site");
  console.log("👉 Visit http://localhost:3000/studio to edit content");
}

run().catch((err) => {
  console.error("\n❌ Seed failed:", err);
  process.exit(1);
});