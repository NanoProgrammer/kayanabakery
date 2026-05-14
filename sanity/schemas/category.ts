import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  groups: [
    { name: "en", title: "English" },
    { name: "es", title: "Español" },
    { name: "settings", title: "Settings" },
  ],
  fields: [
    defineField({
      name: "name",
      title: "Name (EN)",
      type: "string",
      group: "en",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline (EN)",
      type: "string",
      group: "en",
    }),
    defineField({
      name: "description",
      title: "Description (EN)",
      type: "text",
      group: "en",
      rows: 3,
    }),
    defineField({
      name: "nameEs",
      title: "Name (ES)",
      type: "string",
      group: "es",
    }),
    defineField({
      name: "taglineEs",
      title: "Tagline (ES)",
      type: "string",
      group: "es",
    }),
    defineField({
      name: "descriptionEs",
      title: "Description (ES)",
      type: "text",
      group: "es",
      rows: 3,
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
      name: "image",
      title: "Cover image",
      type: "image",
      group: "settings",
      options: { hotspot: true },
    }),
    defineField({
      name: "accentColor",
      title: "Accent color",
      type: "string",
      group: "settings",
      options: {
        list: [
          { title: "Rose primary", value: "bg-canela" },
          { title: "Rose dark", value: "bg-canela-dark" },
          { title: "Gold", value: "bg-gold" },
          { title: "Soft pink", value: "bg-canela-light" },
        ],
      },
      initialValue: "bg-canela",
    }),
    defineField({
      name: "isFeatured",
      title: "Show on Home (Featured Categories)",
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
  ],
  orderings: [
    {
      title: "Display order",
      name: "displayOrderAsc",
      by: [{ field: "displayOrder", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "name", subtitle: "tagline", media: "image" },
  },
});
