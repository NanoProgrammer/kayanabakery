import { defineField, defineType } from "sanity";

export const homePromo = defineType({
  name: "homePromo",
  title: "Home Promo Banner",
  type: "document",
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow",
      type: "string",
      initialValue: "Holiday Collection",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "ctaLabel",
      title: "CTA label",
      type: "string",
      initialValue: "Shop now",
    }),
    defineField({
      name: "ctaHref",
      title: "CTA link",
      type: "string",
      description: "Internal path (e.g. /category/pan-de-muerto)",
    }),
    defineField({
      name: "discount",
      title: "Discount badge (optional)",
      type: "string",
      description: "e.g. '20% OFF'",
    }),
    defineField({
      name: "validUntil",
      title: "Valid until (label)",
      type: "string",
      description: "e.g. 'Nov 5'",
    }),
  ],
  preview: {
    select: { title: "title", media: "image", enabled: "enabled" },
    prepare({ title, media, enabled }) {
      return {
        title: title || "Home Promo",
        subtitle: enabled ? "✓ Enabled" : "✗ Disabled",
        media,
      };
    },
  },
});
