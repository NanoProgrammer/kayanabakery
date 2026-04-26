import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
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
      name: "tagline",
      title: "Tagline",
      type: "string",
      description: "Short phrase e.g. 'Our signature'",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "accentColor",
      title: "Accent color",
      type: "string",
      description: "Tailwind class for accent dot (e.g. bg-otomi-red)",
      options: {
        list: [
          { title: "Red (Otomí)", value: "bg-otomi-red" },
          { title: "Teal (Otomí)", value: "bg-otomi-teal" },
          { title: "Green (Otomí)", value: "bg-otomi-green" },
          { title: "Orange (Otomí)", value: "bg-otomi-orange" },
          { title: "Yellow (Otomí)", value: "bg-otomi-yellow" },
          { title: "Purple (Otomí)", value: "bg-otomi-purple" },
          { title: "Rosa concha", value: "bg-concha-rosa" },
        ],
      },
      initialValue: "bg-otomi-red",
    }),
    defineField({
      name: "isFeatured",
      title: "Show on Home (Featured Categories)",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
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
    select: {
      title: "name",
      subtitle: "tagline",
      media: "image",
    },
  },
});
