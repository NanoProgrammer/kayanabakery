import { defineField, defineType } from "sanity";

export const googleReview = defineType({
  name: "googleReview",
  title: "Google Review",
  type: "document",
  fields: [
    defineField({
      name: "authorName",
      title: "Author name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "authorPhoto",
      title: "Author photo (optional)",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "rating",
      title: "Rating (1-5)",
      type: "number",
      validation: (r) => r.required().min(1).max(5),
      initialValue: 5,
    }),
    defineField({
      name: "textEn",
      title: "Review text (EN)",
      type: "text",
      rows: 5,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "textEs",
      title: "Review text (ES) — optional translation",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "reviewDate",
      title: "Date posted",
      type: "date",
    }),
    defineField({
      name: "googleUrl",
      title: "Google review URL (optional)",
      type: "url",
    }),
    defineField({
      name: "isFeatured",
      title: "Show on home",
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
    select: {
      title: "authorName",
      rating: "rating",
      text: "textEn",
    },
    prepare({ title, rating, text }) {
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      return {
        title: `${title} — ${stars}`,
        subtitle: text?.slice(0, 80),
      };
    },
  },
});
