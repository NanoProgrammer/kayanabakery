import { defineField, defineType } from "sanity";

export const faq = defineType({
  name: "faq",
  title: "FAQ",
  type: "document",
  fields: [
    defineField({
      name: "questionEn",
      title: "Question (EN)",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "questionEs",
      title: "Question (ES)",
      type: "string",
    }),
    defineField({
      name: "answerEn",
      title: "Answer (EN)",
      type: "text",
      rows: 4,
      validation: (r) => r.required(),
    }),
    defineField({
      name: "answerEs",
      title: "Answer (ES)",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "General", value: "general" },
          { title: "Orders", value: "orders" },
          { title: "Delivery", value: "delivery" },
          { title: "Custom Cakes", value: "custom-cakes" },
          { title: "Memberships", value: "memberships" },
          { title: "Payment", value: "payment" },
        ],
      },
      initialValue: "general",
    }),
    defineField({
      name: "displayOrder",
      title: "Display order",
      type: "number",
      initialValue: 100,
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "questionEn", subtitle: "category" },
  },
});
