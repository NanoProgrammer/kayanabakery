import { defineField, defineType } from "sanity";

/**
 * MembershipPlan — public-facing copy for each tier.
 * The actual pricing/business logic is enforced server-side in lib/membership/tiers.ts.
 * This schema lets the owner edit copy/marketing without redeploying.
 */
export const membershipPlan = defineType({
  name: "membershipPlan",
  title: "Membership Plan",
  type: "document",
  fields: [
    defineField({
      name: "tier",
      title: "Tier",
      type: "string",
      options: {
        list: [
          { title: "Básico (Free)", value: "BASICO" },
          { title: "Artesano ($39/year)", value: "ARTESANO" },
          { title: "Selecto ($30/month)", value: "SELECTO" },
          { title: "Legendario ($50/month)", value: "LEGENDARIO" },
          { title: "Embajador (free, approval)", value: "EMBAJADOR" },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      initialValue: 100,
    }),
    defineField({
      name: "tagEn",
      title: "Tagline (EN)",
      type: "string",
    }),
    defineField({
      name: "tagEs",
      title: "Tagline (ES)",
      type: "string",
    }),
    defineField({
      name: "descriptionEn",
      title: "Description (EN)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "descriptionEs",
      title: "Description (ES)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "highlightEn",
      title: "Highlight banner (EN, optional)",
      type: "string",
      description: "e.g. 'Most popular'",
    }),
    defineField({
      name: "highlightEs",
      title: "Highlight banner (ES, optional)",
      type: "string",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "isFeatured",
      title: "Featured (highlight in pricing table)",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "tier", subtitle: "tagEn" },
  },
});
