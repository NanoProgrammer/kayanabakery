import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "How far in advance do I need to order?",
    a: "Standard items like conchas, churros, and our everyday bread can often be picked up same-day or next-day. For custom cakes, please order at least 48 hours in advance. Large orders (30+ items) should be placed a week ahead.",
  },
  {
    q: "Do you deliver?",
    a: "We offer pickup at our Calgary location as the primary option. Delivery is available for large orders within Calgary — contact us for details and rates.",
  },
  {
    q: "Can I customize a cake?",
    a: "Absolutely. Custom cakes are our specialty. Message us via Contact with the theme, size, dietary needs, and date, and we'll design something beautiful for you.",
  },
  {
    q: "Do you offer gluten-free or vegan options?",
    a: "We do a limited number of gluten-free and dairy-free items by special request. Please contact us 72 hours in advance and we'll see what we can do.",
  },
  {
    q: "How long do your products stay fresh?",
    a: "Our bread is best enjoyed within 2 days. Cakes keep in the fridge for 3 days. Conchas are heavenly the same day but still great the next morning — a few seconds in the microwave brings them right back.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards through our secure Square checkout. E-transfer is available for large custom orders.",
  },
  {
    q: "Can I cancel or modify my order?",
    a: "Orders can be modified or cancelled up to 24 hours before your pickup date. Within 24 hours, please contact us directly and we'll do our best.",
  },
  {
    q: "Do you cater for events?",
    a: "Yes! We love catering weddings, quinceañeras, baby showers, and corporate events. Contact us for a custom quote.",
  },
];

export const metadata = { title: "FAQ · Karyana Bakery" };

export default function FAQPage() {
  return (
    <div className="container-bakery py-16 md:py-24">
      <header className="mb-14 text-center">
        <span className="eyebrow mb-3">Good to know</span>
        <h1 className="section-title mx-auto max-w-3xl">
          Frequently asked{" "}
          <span className="italic text-otomi-red">questions.</span>
        </h1>
      </header>

      <div className="mx-auto max-w-3xl">
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="overflow-hidden rounded-2xl border border-canela/15 bg-masa/30 px-6 data-[state=open]:bg-masa/60"
            >
              <AccordionTrigger className="py-5 text-left font-display text-lg text-ink hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-ink/70">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
