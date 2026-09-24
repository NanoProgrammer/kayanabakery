import { defineField, defineType } from "sanity";
import { Users } from "lucide-react";

/**
 * A customer as Studio sees them: the account, their membership if they have
 * one, and what they've spent.
 *
 * Everything here is a mirror of the real record in the database, refreshed by
 * the site — so every field is read-only. Editing a tier here would change
 * nothing about what the customer is actually charged, and the next sync would
 * overwrite it, which is worse than not being able to edit at all.
 *
 * Customers with no membership are included on purpose: the question the
 * bakery asks is usually "who are our people", not "who is paying".
 */
export default defineType({
  name: "customer",
  title: "Customers",
  type: "document",
  icon: Users,
  fields: [
    defineField({ name: "name", title: "Name", type: "string", readOnly: true }),
    defineField({ name: "email", title: "Email", type: "string", readOnly: true }),
    defineField({ name: "phone", title: "Phone", type: "string", readOnly: true }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      readOnly: true,
      description: "Which language this customer gets emails and texts in.",
    }),

    defineField({
      name: "tier",
      title: "Membership",
      type: "string",
      readOnly: true,
      description: "None means they have an account but no membership.",
    }),
    defineField({ name: "membershipStatus", title: "Membership status", type: "string", readOnly: true }),
    defineField({
      name: "isTrial",
      title: "In free trial",
      type: "boolean",
      readOnly: true,
      description: "Artesano is free for the first year — these have paid nothing yet.",
    }),
    defineField({ name: "memberSince", title: "Member since", type: "datetime", readOnly: true }),
    defineField({ name: "renewsAt", title: "Renews", type: "datetime", readOnly: true }),

    defineField({
      name: "weeklyMode",
      title: "Weekly box",
      type: "string",
      readOnly: true,
      description: "How they want their weekly bread decided. Blank means they never chose.",
    }),
    defineField({ name: "weeklyFrequency", title: "Weekly frequency", type: "string", readOnly: true }),
    defineField({ name: "autoDeliveryEnabled", title: "Auto delivery on", type: "boolean", readOnly: true }),
    defineField({
      name: "hasCardOnFile",
      title: "Card on file",
      type: "boolean",
      readOnly: true,
      description: "Without this their weekly box cannot be charged.",
    }),

    defineField({ name: "pointsBalance", title: "Points", type: "number", readOnly: true }),
    defineField({ name: "totalOrders", title: "Orders", type: "number", readOnly: true }),
    defineField({ name: "totalSpent", title: "Total spent", type: "number", readOnly: true }),
    defineField({ name: "lastOrderAt", title: "Last order", type: "datetime", readOnly: true }),

    defineField({ name: "joinedAt", title: "Account created", type: "datetime", readOnly: true }),
    defineField({ name: "syncedAt", title: "Last synced", type: "datetime", readOnly: true }),
    defineField({ name: "prismaId", title: "Internal ID", type: "string", readOnly: true, hidden: true }),
  ],

  preview: {
    select: {
      name: "name",
      email: "email",
      tier: "tier",
      status: "membershipStatus",
      spent: "totalSpent",
      orders: "totalOrders",
    },
    prepare({ name, email, tier, status, spent, orders }) {
      const member = tier && tier !== "NONE" && tier !== "BASICO";
      const money = typeof spent === "number" ? `$${spent.toFixed(2)}` : "$0.00";
      return {
        title: name || email || "(no name)",
        subtitle:
          `${member ? `${tier} · ${status ?? ""}` : tier === "BASICO" ? "Básico" : "No membership"}` +
          ` — ${orders ?? 0} order(s), ${money}`,
        media: Users,
      };
    },
  },
});
