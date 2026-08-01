import { defineField, defineType } from "sanity";

export default defineType({
  name: "order",
  title: "Orders",
  type: "document",
  // Read-only fields are synced from Prisma — only status is editable by Karyana
  fields: [
    defineField({
      name: "orderNumber",
      title: "Order #",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "prismaId",
      title: "Internal ID",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "customerName",
      title: "Customer",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerEmail",
      title: "Email",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "customerPhone",
      title: "Phone",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "fulfillmentType",
      title: "Fulfillment",
      type: "string",
      readOnly: true,
      options: {
        list: ["PICKUP", "DELIVERY"],
      },
    }),
    defineField({
      name: "total",
      title: "Total (CAD)",
      type: "number",
      readOnly: true,
      description: "In dollars (e.g. 14.50)",
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          fields: [
            { name: "name", title: "Product", type: "string" },
            { name: "quantity", title: "Qty", type: "number" },
            { name: "price", title: "Price (CAD)", type: "number" },
          ],
        },
      ],
    }),
    defineField({
      name: "deliveryAddress",
      title: "Delivery address",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "pickupDate",
      title: "Pickup / delivery date",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "notes",
      title: "Customer notes",
      type: "text",
      rows: 2,
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Order status",
      type: "string",
      options: {
        list: [
          { title: "⏳ En preparación", value: "IN_PROGRESS" },
          { title: "✅ Orden lista", value: "READY" },
          { title: "🚚 Enviando", value: "OUT_FOR_DELIVERY" },
          { title: "🎉 Entregado", value: "COMPLETED" },
        ],
        layout: "radio",
      },
      initialValue: "IN_PROGRESS",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "createdAt",
      title: "Order date",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "orderNumber",
      subtitle: "customerName",
      status: "status",
    },
    prepare({ title, subtitle, status }) {
      const emoji: Record<string, string> = {
        IN_PROGRESS: "⏳",
        READY: "✅",
        OUT_FOR_DELIVERY: "🚚",
        COMPLETED: "🎉",
      };
      const isCompleted = status === "COMPLETED";
      // Sanity list titles are plain text — overlay a combining strikethrough
      // character on each glyph so completed orders visually read as "done"
      // without hiding them from the list entirely.
      const strike = (s: string) => s.replace(/./g, (c) => `${c}̶`);

      return {
        title: `${emoji[status] ?? "📦"} ${isCompleted ? strike(title) : title}`,
        subtitle: isCompleted && subtitle ? strike(subtitle) : subtitle,
      };
    },
  },
  orderings: [
    {
      title: "Newest first",
      name: "createdDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Active first (completed last)",
      name: "statusThenDate",
      by: [
        // Alphabetical desc happens to sort COMPLETED last among this
        // schema's 4 statuses (READY, OUT_FOR_DELIVERY, IN_PROGRESS, COMPLETED).
        { field: "status", direction: "desc" },
        { field: "createdAt", direction: "desc" },
      ],
    },
  ],
});