import { defineField, defineType } from "sanity";

export const coupon = defineType({
  name: "coupon",
  title: "Coupon",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Code",
      type: "string",
      description: "The redemption code (e.g. WELCOME10, SUMMER25)",
      validation: (r) =>
        r.required().regex(/^[A-Z0-9_-]+$/, {
          name: "uppercase",
          invert: false,
        }),
    }),
    defineField({
      name: "labelEn",
      title: "Internal label (EN)",
      type: "string",
      description: "Friendly name for staff",
    }),
    defineField({
      name: "labelEs",
      title: "Internal label (ES)",
      type: "string",
    }),
    defineField({
      name: "discountType",
      title: "Discount type",
      type: "string",
      options: {
        list: [
          { title: "Percent (%)", value: "PERCENT" },
          { title: "Fixed $ off", value: "FIXED" },
          { title: "Free shipping", value: "FREE_SHIPPING" },
          // Vale dos panes, no dinero. Los panes van EN LA CAJA y los
          // escoge la panadería: el cliente no elige nada y no hay
          // ningún monto que equivocar.
          { title: "🥖 2 panes gratis (no descuenta dinero)", value: "FREE_BREAD" },
        ],
        layout: "radio",
      },
      initialValue: "PERCENT",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "discountValue",
      title: "Value",
      type: "number",
      description: "Percent (1-100) OR dollars off (e.g. 10 = $10)",
      // Un cupón de panes gratis no tiene monto: dejarlo obligatorio
      // obligaba a escribir un número que después no se usa para nada.
      hidden: ({ document }) =>
        document?.discountType === "FREE_SHIPPING" || document?.discountType === "FREE_BREAD",
      validation: (r) =>
        r.min(0).custom((value, context) => {
          const type = (context.document as any)?.discountType;
          if (type === "FREE_SHIPPING" || type === "FREE_BREAD") return true;
          return value === undefined || value === null ? "Required" : true;
        }),
    }),
    defineField({
      name: "minOrderDollars",
      title: "Minimum order ($)",
      type: "number",
      description: "Leave empty for no minimum",
    }),
    defineField({
      name: "maxUses",
      title: "Total uses allowed",
      type: "number",
      description: "Leave empty for unlimited",
    }),
    defineField({
      name: "perUserLimit",
      title: "Per-user limit",
      type: "number",
      initialValue: 1,
    }),
    defineField({
      name: "startsAt",
      title: "Starts at",
      type: "datetime",
    }),
    defineField({
      name: "expiresAt",
      title: "Expires at",
      type: "datetime",
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "appliesTo",
      title: "Applies to",
      type: "string",
      description: "ALL or CATEGORY:slug or PRODUCT:slug",
      initialValue: "ALL",
    }),
    defineField({
      name: "membershipOnly",
      title: "Members only (tier)",
      type: "string",
      options: {
        list: [
          { title: "Anyone", value: "" },
          { title: "Artesano +", value: "ARTESANO" },
          { title: "Selecto +", value: "SELECTO" },
          { title: "Legendario", value: "LEGENDARIO" },
        ],
      },
      initialValue: "",
    }),
    defineField({
      name: "publicShow",
      title: "Show publicly on home",
      type: "boolean",
      description: "If on, this coupon is broadcast on home banner",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      code: "code",
      type: "discountType",
      val: "discountValue",
      active: "active",
    },
    prepare({ code, type, val, active }) {
      const label =
        type === "PERCENT"
          ? `${val}% off`
          : type === "FIXED"
          ? `$${val} off`
          : type === "FREE_BREAD"
          ? "🥖 2 panes gratis"
          : "Free shipping";
      return {
        title: code,
        subtitle: `${label} ${active ? "✓" : "(disabled)"}`,
      };
    },
  },
});
