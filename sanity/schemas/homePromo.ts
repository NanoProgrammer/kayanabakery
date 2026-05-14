import { defineField, defineType } from "sanity";

export const homePromo = defineType({
  name: "homePromo",
  title: "Home Promo Banner",
  type: "document",
  groups: [
    { name: "en", title: "English" },
    { name: "es", title: "Español" },
    { name: "settings", title: "Settings" },
  ],
  fields: [
    defineField({
      name: "enabled",
      title: "Enabled",
      type: "boolean",
      group: "settings",
      initialValue: true,
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow (EN)",
      type: "string",
      group: "en",
      initialValue: "Holiday Collection",
    }),
    defineField({
      name: "eyebrowEs",
      title: "Eyebrow (ES)",
      type: "string",
      group: "es",
    }),
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
      type: "text",
      group: "en",
      rows: 3,
    }),
    defineField({
      name: "descriptionEs",
      title: "Description (ES)",
      type: "text",
      group: "es",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      group: "settings",
      options: { hotspot: true },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "ctaLabel",
      title: "CTA label (EN)",
      type: "string",
      group: "en",
      initialValue: "Shop now",
    }),
    defineField({
      name: "ctaLabelEs",
      title: "CTA label (ES)",
      type: "string",
      group: "es",
    }),
    defineField({
      name: "ctaHref",
      title: "CTA link",
      type: "string",
      group: "settings",
    }),
    defineField({
      name: "discount",
      title: "Discount badge",
      type: "string",
      group: "settings",
    }),
    defineField({
      name: "validUntil",
      title: "Valid until (label)",
      type: "string",
      group: "settings",
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
