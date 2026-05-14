import { defineField, defineType } from "sanity";

export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  groups: [
    { name: "en", title: "English" },
    { name: "es", title: "Español" },
    { name: "settings", title: "Settings" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title (EN)",
      type: "string",
      group: "en",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "titleEs",
      title: "Title (ES)",
      type: "string",
      group: "es",
    }),
    defineField({
      name: "description",
      title: "Description (EN)",
      type: "array",
      group: "en",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "descriptionEs",
      title: "Description (ES)",
      type: "array",
      group: "es",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "settings",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "datetime",
      group: "settings",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "endDate",
      title: "End date (optional)",
      type: "datetime",
      group: "settings",
    }),
    defineField({
      name: "dateLabel",
      title: "Date label",
      type: "string",
      group: "settings",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "string",
      group: "settings",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "address",
      title: "Full address",
      type: "string",
      group: "settings",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      group: "settings",
      options: { hotspot: true },
    }),
    defineField({
      name: "externalUrl",
      title: "External URL",
      type: "url",
      group: "settings",
    }),
    defineField({
      name: "isFeatured",
      title: "Feature on Home",
      type: "boolean",
      group: "settings",
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
    select: { title: "title", date: "startDate", location: "location", media: "image" },
    prepare({ title, date, location, media }) {
      const d = date ? new Date(date).toLocaleDateString() : "TBD";
      return { title, subtitle: `${d} · ${location}`, media };
    },
  },
});
