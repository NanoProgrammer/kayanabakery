import { defineField, defineType } from "sanity";
import { PhoneInput } from "../structure/components/PhoneInput";
import { PickupDateTimeInput } from "../structure/components/PickupDateTimeInput";

// What the money says is settled; what the kitchen does is not.
//
// An order's total and number record a payment that already happened — editing
// them here would change the paperwork without changing a cent that moved, so
// they stay locked on anything that came from checkout. Everything the bakery
// works from — who to call, what to bake, when it's for, what the customer
// asked for — is editable on every order, because customers get these wrong
// and someone has to be able to fix it without opening the database.
const lockedOnCheckoutOrders = (context: { document?: Record<string, any> }) =>
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
      readOnly: lockedOnCheckoutOrders,
      // Orders synced from the online checkout get a real KAR-YYYYMM-XXXXX
      // number from Prisma before this ever renders. A manually-created
      // order has no such number yet, so count the existing manual orders
      // and hand it the next one — no guessing what to type.
      initialValue: async (_, context) => {
        const client = context.getClient({ apiVersion: "2024-10-01" });
        const count: number = await client.fetch(
          `count(*[_type == "order" && !defined(prismaId)])`
        );
        return `Custom Order #${count + 1}`;
      },
    }),
    defineField({
      name: "printedAt",
      title: "Printed at",
      type: "datetime",
      readOnly: true,
      hidden: true,
      description:
        "Set by the kitchen printer once this order's slip came out, so a restart doesn't print it twice.",
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
      description: "Editable. Saved back to the customer's record.",
    }),
    defineField({
      name: "customerEmail",
      title: "Email",
      type: "string",
      description: "Editable. Order emails go here, so fixing a typo fixes delivery.",
    }),
    defineField({
      name: "customerPhone",
      title: "Phone",
      type: "string",
      description: "Editable. Order texts go here.",
      components: { input: PhoneInput },
    }),
    defineField({
      name: "fulfillmentType",
      title: "Fulfillment",
      type: "string",
      readOnly: lockedOnCheckoutOrders,
      options: {
        list: ["PICKUP", "DELIVERY"],
      },
    }),
    defineField({
      name: "total",
      title: "Total (CAD)",
      type: "number",
      readOnly: lockedOnCheckoutOrders,
      description:
        "In dollars. What the customer was actually charged — changing the items below does not change this. Refund or charge the difference in Square.",
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      description:
        "What the kitchen makes. Editable — this is what the packing slip prints. Prices stay as charged.",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", title: "Product", type: "string" },
            { name: "quantity", title: "Qty", type: "number" },
            {
              name: "price",
              title: "Price (CAD)",
              type: "number",
              // Part of the payment record, not the recipe.
              readOnly: lockedOnCheckoutOrders,
            },
          ],
          preview: {
            select: { name: "name", quantity: "quantity" },
            prepare: ({ name, quantity }: any) => ({
              title: `${quantity ?? 1} × ${name ?? "(no name)"}`,
            }),
          },
        },
      ],
    }),
    defineField({
      name: "deliveryAddress",
      title: "Delivery address",
      type: "string",
      description: "Editable.",
    }),
    defineField({
      name: "pickupDate",
      title: "Pickup / delivery date & time",
      type: "string",
      description: "Editable — use this to reschedule.",
      components: { input: PickupDateTimeInput },
    }),
    defineField({
      name: "notes",
      title: "Customer notes",
      type: "text",
      rows: 3,
      description: "Editable. Prints on the packing slip.",
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
      readOnly: lockedOnCheckoutOrders,
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