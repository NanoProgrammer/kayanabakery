import { defineField, defineType } from "sanity";

// Orders synced from Prisma (online checkout) carry a prismaId and should stay
// read-only so Karyana can't drift from the source of truth. Orders created by
// hand in Studio (phone/walk-in orders) have no prismaId yet, so their fields
// stay editable until/unless they get linked to a Prisma order.
const readOnlyUnlessManual = (context: { document?: Record<string, any> }) =>
  Boolean(context.document?.prismaId);

export default defineType({
  name: "order",
  title: "Orders",
  type: "document",
  fields: [
    defineField({
      name: "orderNumber",
      title: "Order #",
      type: "string",
      readOnly: readOnlyUnlessManual,
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
      readOnly: readOnlyUnlessManual,
    }),
    defineField({
      name: "customerEmail",
      title: "Email",
      type: "string",
      readOnly: readOnlyUnlessManual,
    }),
    defineField({
      name: "customerPhone",
      title: "Phone",
      type: "string",
      readOnly: readOnlyUnlessManual,
    }),
    defineField({
      name: "fulfillmentType",
      title: "Fulfillment",
      type: "string",
      readOnly: readOnlyUnlessManual,
      options: {
        list: ["PICKUP", "DELIVERY"],
      },
    }),
    defineField({
      name: "total",
      title: "Total (CAD)",
      type: "number",
      readOnly: readOnlyUnlessManual,
      description: "In dollars (e.g. 14.50)",
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      readOnly: readOnlyUnlessManual,
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
      readOnly: readOnlyUnlessManual,
    }),
    defineField({
      name: "pickupDate",
      title: "Pickup / delivery date",
      type: "string",
      readOnly: readOnlyUnlessManual,
    }),
    defineField({
      name: "notes",
      title: "Customer notes",
      type: "text",
      rows: 2,
      readOnly: readOnlyUnlessManual,
    }),
    defineField({
      name: "status",
      title: "Order status",
      type: "string",
      // Dropdown instead of radio — the radio layout is unreliable to tap
      // on the Sanity Studio mobile web app; a native <select> works everywhere.
      options: {
        list: [
          { title: "⏳ En preparación", value: "IN_PROGRESS" },
          { title: "✅ Orden lista", value: "READY" },
          { title: "🚚 Enviando", value: "OUT_FOR_DELIVERY" },
          { title: "🎉 Entregado", value: "COMPLETED" },
        ],
      },
      initialValue: "IN_PROGRESS",
      validation: (R) => R.required(),
    }),
    defineField({
      name: "createdAt",
      title: "Order date",
      type: "datetime",
      readOnly: readOnlyUnlessManual,
      initialValue: () => new Date().toISOString(),
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