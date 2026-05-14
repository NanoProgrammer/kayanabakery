import { sanityFetch } from "@/sanity/lib/fetch";
import { allFaqsQuery } from "@/sanity/lib/queries";
import { FAQAccordion } from "@/components/faq/FAQAccordion";
import type { FAQ } from "@/types";

export const revalidate = 60;

export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Karyana Bakery.",
};

export default async function FAQPage() {
  const faqs = await sanityFetch<FAQ[]>({
    query: allFaqsQuery,
    tags: ["faq"],
  });

  return (
    <>
      <header className="container-bakery py-16 md:py-20">
        <span className="eyebrow">FAQ</span>
        <h1 className="section-title mt-2">Frequently asked questions</h1>
        <p className="mt-4 max-w-2xl text-ink-soft md:text-lg">
          Everything you need to know about ordering, delivery, and how Karyana works.
        </p>
      </header>
      <FAQAccordion faqs={faqs ?? []} />
    </>
  );
}
