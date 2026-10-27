import { defineField, defineType } from "sanity";

/**
 * A choice a customer makes about a cake: a size, a flavour.
 *
 * Products had no options at all, so a tres leches in three sizes had to be
 * three separate products with three prices that drift apart, and a chocoflan
 * in vanilla or strawberry could not be ordered at all.
 *
 * The price is a difference, not a price: the product keeps one price and a
 * 10" adds to it. Two places holding the same number is how a cake ends up
 * costing one thing on the shelf and another at checkout.
 */
export const productOptionChoice = defineType({
  name: "productOptionChoice",
  title: "Choice",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Label (EN)",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({ name: "labelEs", title: "Label (ES)", type: "string" }),
    defineField({
      name: "priceDelta",
      title: "Price difference (CAD)",
      type: "number",
      description:
        "Added to the product's price. 0 for the standard choice, 10 for a size that costs $10 more, -2 to take $2 off. Never the full price.",
      initialValue: 0,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "image",
      title: "Photo for this choice",
      type: "image",
      options: { hotspot: true },
      description:
        "Optional. When set, picking this choice swaps the product photo — a strawberry cake actually looks like one.",
    }),
    defineField({
      name: "soldOut",
      title: "Sold out",
      type: "boolean",
      description: "Still shown, but cannot be picked.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "label", delta: "priceDelta", media: "image", soldOut: "soldOut" },
    prepare: ({ title, delta, media, soldOut }: any) => ({
      title: `${title}${soldOut ? " — sold out" : ""}`,
      subtitle:
        !delta || delta === 0
          ? "same price"
          : delta > 0
          ? `+$${delta.toFixed(2)}`
          : `-$${Math.abs(delta).toFixed(2)}`,
      media,
    }),
  },
});

export const productOption = defineType({
  name: "productOption",
  title: "Option",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Name (EN)",
      type: "string",
      description: 'What the customer is choosing: "Size", "Flavour".',
      validation: (r) => r.required(),
    }),
    defineField({ name: "nameEs", title: "Name (ES)", type: "string" }),
    defineField({
      name: "key",
      title: "Key",
      type: "slug",
      options: { source: "name", maxLength: 24 },
      description:
        "Used on the order and the kitchen slip. Keep it stable — changing it on a product that has been ordered breaks nothing, but the old orders keep the old word.",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "choices",
      title: "Choices",
      type: "array",
      of: [{ type: "productOptionChoice" }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "required",
      title: "Must be chosen",
      type: "boolean",
      description:
        "On for a size — a cake has to be some size. Off for an extra the customer can skip.",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "name", choices: "choices", required: "required" },
    prepare: ({ title, choices, required }: any) => ({
      title,
      subtitle: `${choices?.length ?? 0} choice(s)${required ? "" : " · optional"}`,
    }),
  },
});
