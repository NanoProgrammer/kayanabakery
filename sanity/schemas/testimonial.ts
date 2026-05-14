import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "Quote (EN)",
      type: "text",
      rows: 4,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "quoteEs",
      title: "Quote (ES)",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "role",
      title: "Role / Location",
      type: "string",
    }),
    defineField({
      name: "accent",
      title: "Accent color",
      type: "string",
      options: {
        list: [
          { title: "Rose", value: "text-canela" },
          { title: "Gold", value: "text-gold" },
          { title: "Dark", value: "text-ink" },
        ],
      },
      initialValue: "text-canela",
    }),
    defineField({
      name: "isFeatured",
      title: "Show on Home",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      initialValue: 100,
    }),
  ],
  preview: {
    select: { title: "author", subtitle: "quote" },
  },
});
