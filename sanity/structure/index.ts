import type { StructureBuilder } from "sanity/desk";
import {
  Cookie,
  Tag,
  Megaphone,
  Star,
  Users,
  HelpCircle,
  Crown,
  Calendar,
  Settings,
  Layers,
  ShoppingBag,
  ClipboardList,
} from "lucide-react";

export const karyanaStructure = (S: StructureBuilder) =>
  S.list()
    .title("Karyana CMS")
    .items([
      // ── Orders ──────────────────────────────────────────────
      S.listItem()
        .title("Orders")
        .icon(ClipboardList)
        .child(
          S.documentTypeList("order")
            .title("Orders")
            .defaultOrdering([{ field: "createdAt", direction: "desc" }])
            .filter('_type == "order"')
        ),

      S.divider(),

      // ── Catalog ─────────────────────────────────────────────
      S.listItem()
        .title("Catalog")
        .icon(ShoppingBag)
        .child(
          S.list()
            .title("Catalog")
            .items([
              S.documentTypeListItem("product").title("Products"),
              S.documentTypeListItem("category").title("Categories"),
            ])
        ),

      S.divider(),

      // ── Content ─────────────────────────────────────────────
      S.listItem()
        .title("Content")
        .icon(Layers)
        .child(
          S.list()
            .title("Content")
            .items([
              S.documentTypeListItem("event").title("Events").icon(Calendar),
              S.documentTypeListItem("testimonial")
                .title("Testimonials")
                .icon(Star),
              S.documentTypeListItem("googleReview")
                .title("Google reviews")
                .icon(Star),
            ])
        ),

      // ── Marketing ───────────────────────────────────────────
      S.listItem()
        .title("Marketing")
        .icon(Megaphone)
        .child(
          S.list()
            .title("Marketing")
            .items([
              S.documentTypeListItem("homePromo")
                .title("Home promo banner")
                .icon(Megaphone),
              S.documentTypeListItem("popupBanner")
                .title("Popup banners")
                .icon(Megaphone),
              S.documentTypeListItem("coupon").title("Coupons").icon(Tag),
            ])
        ),

      // ── Memberships ─────────────────────────────────────────
      S.listItem()
        .title("Memberships")
        .icon(Crown)
        .child(
          S.list()
            .title("Memberships")
            .items([
              S.documentTypeListItem("membershipPlan")
                .title("Plan copy")
                .icon(Crown),
            ])
        ),

      // ── Help ────────────────────────────────────────────────
      S.listItem()
        .title("Help")
        .icon(HelpCircle)
        .child(
          S.list()
            .title("Help")
            .items([
              S.documentTypeListItem("faq")
                .title("FAQ entries")
                .icon(HelpCircle),
            ])
        ),

      S.divider(),

      // ── Site Settings ────────────────────────────────────────
      S.listItem()
        .title("Site Settings")
        .icon(Settings)
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
        ),
    ]);