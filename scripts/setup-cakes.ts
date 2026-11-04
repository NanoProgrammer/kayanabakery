/**
 * Writes the cake menu to Sanity: the subcategories under Cakes, and the
 * options each product is sold with.
 *
 *   npm run cakes:setup          show what it would do
 *   npm run cakes:setup:apply    do it
 *
 * The menu itself lives in lib/products/cake-menu.ts and is tested by
 * `npm run test:cakes`. This file is only the part that talks to Sanity.
 *
 * It does NOT invent prices. A new choice is created at +$0, because a 10"
 * cake priced like a 6" is a loss on every order and only Karyana knows the
 * numbers. Set them in Studio: Product → Options → the choice → "Price
 * difference".
 *
 * It does not destroy them either. Products already in Studio carry price
 * differences typed in by hand, so a choice that survives keeps its price and
 * its sold-out flag; only the set of choices changes. Anything being removed
 * is listed before it happens.
 *
 * Safe to run twice: categories are matched by slug and options by key.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

import {
  SUBCATEGORIES,
  optionsForProduct,
  ruleForProduct,
  mergeProductOptions,
  type MergedOption,
} from "../lib/products/cake-menu";

function optionDoc(o: MergedOption) {
  return {
    _type: "productOption",
    _key: o.key,
    name: o.name,
    nameEs: o.nameEs,
    key: { _type: "slug", current: o.key },
    required: true,
    choices: o.choices.map((c, i) => ({
      _type: "productOptionChoice",
      _key: `${o.key}-${i}`,
      label: c.label,
      labelEs: c.labelEs,
      priceDelta: c.priceDelta,
      soldOut: c.soldOut,
    })),
  };
}

async function main() {
  const apply = process.argv.slice(2).includes("apply");
  const { writeClient } = await import("../sanity/lib/client");

  const cakes = await writeClient.fetch<{ _id: string; name: string } | null>(
    `*[_type == "category" && slug.current == "cakes"][0]{ _id, name }`
  );

  if (!cakes) {
    console.error(
      '\nNo category with the slug "cakes". Create it in Studio first, then run this again.\n'
    );
    process.exit(1);
  }

  console.log(`\nParent: ${cakes.name}\n`);

  const plan: string[] = [];
  const writes: (() => Promise<unknown>)[] = [];

  for (const [index, sub] of SUBCATEGORIES.entries()) {
    const existing = await writeClient.fetch<{ _id: string; parent?: any } | null>(
      `*[_type == "category" && slug.current == $slug][0]{ _id, parent }`,
      { slug: sub.slug }
    );

    if (existing) {
      const needsParent = existing.parent?._ref !== cakes._id;
      plan.push(
        `\n  ${sub.name}${needsParent ? " — will be moved under Cakes" : " — already under Cakes"}`
      );
      if (needsParent) {
        writes.push(() =>
          writeClient
            .patch(existing._id)
            .set({ parent: { _type: "reference", _ref: cakes._id } })
            .commit()
        );
      }
    } else {
      plan.push(`\n  ${sub.name} — will be created under Cakes`);
      writes.push(() =>
        writeClient.create({
          _type: "category",
          name: sub.name,
          nameEs: sub.nameEs,
          ...(sub.tagline ? { tagline: sub.tagline, taglineEs: sub.taglineEs } : {}),
          slug: { _type: "slug", current: sub.slug },
          parent: { _type: "reference", _ref: cakes._id },
          displayOrder: 10 + index,
        })
      );
    }

    const products = await writeClient.fetch<
      { _id: string; name: string; options?: any[] }[]
    >(`*[_type == "product" && $slug in categories[]->slug.current]{ _id, name, options }`, {
      slug: sub.slug,
    });

    if (!products.length) {
      plan.push(`      (no products filed under ${sub.name} yet)`);
      continue;
    }

    for (const product of products) {
      const desired = optionsForProduct(product.name, sub);
      const rule = ruleForProduct(product.name);
      const merged = mergeProductOptions(product.options, desired);

      if (merged.unchanged) {
        plan.push(`      ${product.name} — already correct`);
        continue;
      }

      plan.push(
        `      ${product.name}${rule ? `  (rule: ${rule.label})` : ""}` +
          (desired.length ? "" : "  → sold one way only, no options")
      );
      for (const change of merged.changes) plan.push(`          ${change}`);

      writes.push(() =>
        writeClient
          .patch(product._id)
          .set({ options: merged.options.map(optionDoc) })
          .commit()
      );
    }
  }

  console.log(plan.join("\n"));

  if (!writes.length) {
    console.log("\nNothing to change.\n");
    return;
  }

  if (!apply) {
    console.log(`\n${writes.length} change(s). Dry run — nothing was written.`);
    console.log("To write them:  npm run cakes:setup:apply\n");
    return;
  }

  for (const write of writes) await write();

  console.log(`\n${writes.length} change(s) written.`);
  console.log(
    "\n  ⚠ Any NEW size or flavour was created at +$0. Set the real price\n" +
      "    differences in Studio: Product → Options → the choice →\n" +
      '    "Price difference". Prices already set were kept.\n'
  );
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
