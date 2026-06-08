import { sanityFetch } from "@/sanity/lib/fetch";
import { siteSettingsQuery } from "@/sanity/lib/queries";
import { ContactPageClient } from "@/components/contact/ContactPageClient";
import type { SiteSettings } from "@/types";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await sanityFetch<SiteSettings>({
    query: siteSettingsQuery,
    tags: ["siteSettings"],
  });

  return (
    <ContactPageClient
      phone={settings?.contactPhone ?? null}
      email={settings?.contactEmail ?? "hello@karyanabakery.ca"}
    />
  );
}