import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "announcementBar",
      title: "Announcement bar messages",
      type: "array",
      of: [{ type: "string" }],
      description: "Rotating messages at top of site",
      initialValue: [
        "✦ Free pickup in Calgary",
        "✦ Fresh baked daily",
        "✦ Order 48h in advance for custom cakes",
      ],
    }),
    defineField({
      name: "heroTitle",
      title: "Hero title (HTML allowed)",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "heroSubtitle",
      title: "Hero subtitle",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "heroImage",
      title: "Hero image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "referralDiscount",
      title: "Referral discount ($)",
      type: "number",
      initialValue: 10,
    }),
    defineField({
      name: "pickupAddress",
      title: "Pickup address",
      type: "string",
    }),
    defineField({
      name: "contactPhone",
      title: "Contact phone",
      type: "string",
    }),
    defineField({
      name: "contactEmail",
      title: "Contact email",
      type: "string",
    }),
  ],
});
