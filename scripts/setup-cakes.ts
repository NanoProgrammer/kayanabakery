/**
 * Sets up the cake menu: three subcategories under Cakes, and the options
 * each one's products need.
 *
 *   npm run cakes:setup          show what it would do
 *   npm run cakes:setup:apply    do it
 *
 *   Tres Leches  — Size: 6", 8", 10"
 *   Gourmet      — Size: 6", 8"            (flan, tres leches)
 *   Clásicos     — Flavour: vanilla, chocolate, strawberry
 *                                          (chocoflan, pineapple upside down, bundt)
 *
 * It does NOT invent prices. Every choice is created at +$0, because a 10"
 * cake priced like a 6" is a loss on every order and only Karyana knows the
 * numbers. Set them in Studio afterwards: Product → Options → the choice →
 * "Price difference".
 *
 * Safe to run twice: categories are matched by slug and options by key, so a
 * second run updates rather than duplicates.
 */
import { config as loadEnv } from "dotenv";
loadEnv();
loadEnv({ path: ".env.local", override: true });

type Choice = { label: string; labelEs: string };

const SUBCATEGORIES: {
  slug: string;
  name: string;
  nameEs: string;
  option: { name: string; nameEs: string; key: string; choices: Choice[] };
}[] = [
  {
    slug: "tres-leches",
    name: "Tres Leches",
    nameEs: "Tres Leches",
    option: {
      name: "Size",
      nameEs: "Tamaño",
      key: "size",
      choices: [
        { label: '6 inch', labelEs: '6 pulgadas' },
        { label: '8 inch', labelEs: '8 pulgadas' },
        { label: '10 inch', labelEs: '10 pulgadas' },
      ],
    },
  },
  {
    slug: "gourmet",
    name: "Gourmet",
    nameEs: "Gourmet",
    option: {
      name: "Size",
      nameEs: "Tamaño",
      key: "size",
      choices: [
        { label: '6 inch', labelEs: '6 pulgadas' },
        { label: '8 inch', labelEs: '8 pulgadas' },
      ],
    },
  },
  {
    slug: "clasicos",
    name: "Clásicos",
    nameEs: "Clásicos",
    option: {
      name: "Flavour",
      nameEs: "Sabor",
      key: "flavour",
      choices: [
        { label: "Vanilla", labelEs: "Vainilla" },
        { label: "Chocolate", labelEs: "Chocolate" },
        { label: "Strawberry", labelEs: "Fresa" },
      ],
    },
  },
];

function optionDoc(o: (typeof SUBCATEGORIES)[number]["option"]) {
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
      // Deliberately zero. See the note at the top of this file.
      priceDelta: 0,
      soldOut: false,
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
        `  ${sub.name.padEnd(14)} exists${needsParent ? " — will be moved under Cakes" : " — already under Cakes"}`
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
      plan.push(`  ${sub.name.padEnd(14)} will be created under Cakes`);
      writes.push(() =>
        writeClient.create({
          _type: "category",
          name: sub.name,
          nameEs: sub.nameEs,
          slug: { _type: "slug", current: sub.slug },
          parent: { _type: "reference", _ref: cakes._id },
          displayOrder: 10 + index,
        })
      );
    }

    // Products already filed under this subcategory get its option.
    const products = await writeClient.fetch<{ _id: string; name: string; options?: any[] }[]>(
      `*[_type == "product" && $slug in categories[]->slug.current]{ _id, name, options }`,
      { slug: sub.slug }
    );

    for (const product of products) {
      const already = (product.options ?? []).some(
        (o: any) => (o?.key?.current ?? o?.key) === sub.option.key
      );
      plan.push(
        `      ${product.name.padEnd(28)} ${already ? `already has ${sub.option.key}` : `+ ${sub.option.name}: ${sub.option.choices.map((c) => c.label).join(", ")}`}`
      );
      if (!already) {
        writes.push(() =>
          writeClient
            .patch(product._id)
            .setIfMissing({ options: [] })
            .append("options", [optionDoc(sub.option)])
            .commit()
        );
      }
    }

    if (!products.length) {
      plan.push(`      (no products filed under ${sub.name} yet)`);
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
    "\n  ⚠ Every size and flavour was created at +$0. Set the real price\n" +
      "    differences in Studio: Product → Options → the choice →\n" +
      '    "Price difference". A 10" priced like a 6" loses money on every order.\n'
  );
}

main().catch((err) => {
  console.error(`\nFailed: ${err?.message ?? err}\n`);
  process.exit(1);
});
