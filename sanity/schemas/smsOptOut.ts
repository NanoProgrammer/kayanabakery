import { defineField, defineType } from "sanity";
import { BellOff } from "lucide-react";

/**
 * A phone number that asked us to stop. Situación 10.
 *
 * Kept here rather than as a column on the customer because the people
 * who reply STOP include guests who have no account at all, and because
 * a record of a withdrawn consent should be visible to the bakery
 * without opening the database.
 *
 * Everything is read-only. An opt-out is the customer's decision, not
 * something staff should be able to undo for them with a click: the
 * only way back on is the customer replying ALTA or START themselves.
 */
export default defineType({
  name: "smsOptOut",
  title: "Message opt-outs",
  type: "document",
  icon: BellOff,
  fields: [
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
      readOnly: true,
      description: "Digits only. This is the number that replied STOP or BAJA.",
    }),
    defineField({
      name: "optedOutAt",
      title: "Opted out",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "keyword",
      title: "What they replied",
      type: "string",
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: "phone", subtitle: "optedOutAt", keyword: "keyword" },
    prepare: ({ title, subtitle, keyword }: any) => ({
      title: title || "(no number)",
      subtitle: [keyword, subtitle ? new Date(subtitle).toLocaleDateString() : null]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
