import { defineField, defineType } from "sanity";

export const popupBanner = defineType({
  name: "popupBanner",
  title: "Popup Banner",
  type: "document",
  fields: [
    defineField({
      name: "internalName",
      title: "Internal name",
      type: "string",
      description: "For your reference only (not shown to users)",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "titleEn",
      title: "Title (EN)",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "titleEs",
      title: "Title (ES)",
      type: "string",
    }),
    defineField({
      name: "messageEn",
      title: "Message (EN)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "messageEs",
      title: "Message (ES)",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "image",
      title: "Image (optional)",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "ctaLabelEn",
      title: "CTA label (EN)",
      type: "string",
    }),
    defineField({
      name: "ctaLabelEs",
      title: "CTA label (ES)",
      type: "string",
    }),
    defineField({
      name: "ctaHref",
      title: "CTA link",
      type: "string",
      description: "Internal path (e.g. /shop) or external URL",
    }),
    defineField({
      name: "showOnPaths",
      title: "Show on paths",
      type: "array",
      of: [{ type: "string" }],
      description: "Paths where it shows. Use / for home, /shop, etc. Empty = all pages",
    }),
    defineField({
      name: "displayMode",
      title: "Display mode",
      type: "string",
      options: {
        list: [
          { title: "Modal popup (centered)", value: "modal" },
          { title: "Top bar", value: "top-bar" },
          { title: "Bottom slide-in", value: "bottom-slide" },
        ],
      },
      initialValue: "modal",
    }),
    defineField({
      name: "frequency",
      title: "How often to show (per visitor)",
      type: "string",
      options: {
        list: [
          { title: "Once ever", value: "once" },
          { title: "Once per session", value: "session" },
          { title: "Every visit", value: "always" },
        ],
      },
      initialValue: "session",
    }),
    defineField({
      name: "delaySeconds",
      title: "Delay before showing (seconds)",
      type: "number",
      initialValue: 3,
    }),
    defineField({
      name: "startsAt",
      title: "Starts at",
      type: "datetime",
    }),
    defineField({
      name: "endsAt",
      title: "Ends at",
      type: "datetime",
    }),
  ],
  preview: {
    select: {
      title: "internalName",
      titleEn: "titleEn",
      active: "active",
      media: "image",
    },
    prepare({ title, titleEn, active, media }) {
      return {
        title: title || titleEn || "Untitled banner",
        subtitle: active ? "✓ ACTIVE" : "✗ disabled",
        media,
      };
    },
  },
});
