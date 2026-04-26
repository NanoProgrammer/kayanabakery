import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Short description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "longDescription",
      title: "Long description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "price",
      title: "Price (CAD)",
      type: "number",
      description: "Price in dollars (e.g. 18.50)",
      validation: (r) => r.required().positive(),
    }),
    defineField({
      name: "compareAtPrice",
      title: "Compare-at price (sale)",
      type: "number",
      description: "If set, shows as strike-through original price",
    }),
    defineField({
      name: "image",
      title: "Main image",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "gallery",
      title: "Gallery images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "category" }] }],
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      options: {
        list: [
          { title: "None", value: "" },
          { title: "Bestseller", value: "bestseller" },
          { title: "New", value: "new" },
          { title: "Seasonal", value: "seasonal" },
          { title: "Limited", value: "limited" },
        ],
      },
    }),
    defineField({
      name: "inStock",
      title: "In stock",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "stockQuantity",
      title: "Stock quantity (optional)",
      type: "number",
      description: "Leave empty for unlimited. Set a number for auto out-of-stock",
    }),
    defineField({
      name: "isFeatured",
      title: "Show in Signature Products (Home)",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      description: "Lower = shown first",
      initialValue: 100,
    }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      description: "e.g. each, dozen, 6-pack",
      initialValue: "each",
    }),
    defineField({
      name: "leadTime",
      title: "Lead time (hours)",
      type: "number",
      description: "Hours required to prepare (48 for custom cakes)",
      initialValue: 0,
    }),
    defineField({
      name: "allergens",
      title: "Allergens",
      type: "array",
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
