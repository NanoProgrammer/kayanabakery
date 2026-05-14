import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  groups: [
    { name: "en", title: "English" },
    { name: "es", title: "Español" },
    { name: "settings", title: "Settings" },
  ],
  fields: [
    // ── EN ──
    defineField({
      name: "name",
      title: "Name (EN)",
      type: "string",
      group: "en",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Short description (EN)",
      type: "text",
      group: "en",
      rows: 3,
    }),
    defineField({
      name: "longDescription",
      title: "Long description (EN)",
      type: "array",
      group: "en",
      of: [{ type: "block" }],
    }),

    // ── ES ──
    defineField({
      name: "nameEs",
      title: "Name (ES)",
      type: "string",
      group: "es",
      description: "Translation in Spanish",
    }),
    defineField({
      name: "descriptionEs",
      title: "Short description (ES)",
      type: "text",
      group: "es",
      rows: 3,
    }),
    defineField({
      name: "longDescriptionEs",
      title: "Long description (ES)",
      type: "array",
      group: "es",
      of: [{ type: "block" }],
    }),

    // ── Pricing & images ──
    defineField({
      name: "price",
      title: "Price (CAD)",
      type: "number",
      group: "settings",
      validation: (r) => r.required().positive(),
    }),
    defineField({
      name: "compareAtPrice",
      title: "Compare-at price (sale)",
      type: "number",
      group: "settings",
    }),
    defineField({
      name: "image",
      title: "Main image",
      type: "image",
      group: "settings",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "gallery",
      title: "Gallery images",
      type: "array",
      group: "settings",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      group: "settings",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      group: "settings",
      options: {
        list: [
          { title: "None", value: "" },
          { title: "Bestseller", value: "bestseller" },
          { title: "New", value: "new" },
          { title: "Seasonal", value: "seasonal" },
          { title: "Limited", value: "limited" },
          { title: "Members only", value: "members-only" },
        ],
      },
    }),
    defineField({
      name: "inStock",
      title: "In stock",
      type: "boolean",
      group: "settings",
      initialValue: true,
    }),
    defineField({
      name: "stockQuantity",
      title: "Stock quantity (optional)",
      type: "number",
      group: "settings",
    }),
    defineField({
      name: "isFeatured",
      title: "Show in Signature Products",
      type: "boolean",
      group: "settings",
      initialValue: false,
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      group: "settings",
      initialValue: 100,
    }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      group: "settings",
      initialValue: "each",
    }),
    defineField({
      name: "leadTime",
      title: "Lead time (hours)",
      type: "number",
      group: "settings",
      initialValue: 0,
    }),
    defineField({
      name: "allergens",
      title: "Allergens",
      type: "array",
      group: "settings",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Gluten", value: "gluten" },
          { title: "Dairy", value: "dairy" },
          { title: "Eggs", value: "eggs" },
          { title: "Nuts", value: "nuts" },
          { title: "Soy", value: "soy" },
        ],
      },
    }),
    defineField({
      name: "membersOnly",
      title: "Members only",
      type: "boolean",
      group: "settings",
      description: "Hide from non-members (out-of-stock/seasonal access)",
      initialValue: false,
    }),
    defineField({
      name: "isOffSeason",
      title: "Off-season item",
      type: "boolean",
      group: "settings",
      description: "Members can still order even if marked out-of-stock",
      initialValue: false,
    }),
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrderAsc",
      by: [{ field: "displayOrder", direction: "asc" }],
    },
    {
      title: "Name A-Z",
      name: "nameAsc",
      by: [{ field: "name", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "name",
      price: "price",
      media: "image",
      inStock: "inStock",
    },
    prepare({ title, price, media, inStock }) {
      return {
        title,
        subtitle: `$${price?.toFixed(2)} ${inStock ? "" : "— OUT OF STOCK"}`,
        media,
      };
    },
  },
});
