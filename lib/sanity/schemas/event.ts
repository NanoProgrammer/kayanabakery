import { defineField, defineType } from "sanity";

export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "datetime",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "endDate",
      title: "End date (optional)",
      type: "datetime",
    }),
    defineField({
      name: "dateLabel",
      title: "Date label",
      type: "string",
      description: "Human readable e.g. 'May 1 – 2, 2026'",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "address",
      title: "Full address",
      type: "string",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "externalUrl",
      title: "External URL (tickets)",
      type: "url",
    }),
    defineField({
      name: "isFeatured",
      title: "Feature on Home",
      type: "boolean",
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: "Date (soonest first)",
      name: "startDateAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      date: "startDate",
      location: "location",
      media: "image",
    },
    prepare({ title, date, location, media }) {
      const d = date ? new Date(date).toLocaleDateString() : "TBD";
      return { title, subtitle: `${d} · ${location}`, media };
    },
  },
});
