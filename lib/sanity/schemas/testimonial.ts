import { defineField, defineType } from "sanity";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
      rows: 4,
      validation: (r) => r.required(),
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
          { title: "Red", value: "text-otomi-red" },
          { title: "Teal", value: "text-otomi-teal" },
          { title: "Green", value: "text-otomi-green" },
          { title: "Orange", value: "text-otomi-orange" },
        ],
      },
      initialValue: "text-otomi-red",
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
