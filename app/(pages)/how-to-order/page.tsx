import Link from "next/link";
import { ShoppingBag, MapPin, Truck, Calendar } from "lucide-react";

const steps = [
  {
    icon: ShoppingBag,
    title: "Browse & add",
    description:
      "Browse our menu, add what speaks to you. Custom cakes need 48h notice — plan ahead for special orders.",
  },
  {
    icon: Calendar,
    title: "Pick your date",
    description:
      "Choose a pickup date that works for you. Everything is baked fresh the morning of pickup.",
  },
  {
    icon: MapPin,
    title: "Pay & confirm",
    description:
      "Secure checkout with Square. You'll receive an order confirmation with pickup details via email.",
  },
  {
    icon: Truck,
    title: "Pick up & enjoy",
    description:
      "Come grab your order at our Calgary location. Still warm, still perfect.",
  },
];

export const metadata = { title: "How to Order · Karyana Bakery" };

export default function HowToOrderPage() {
  return (
    <div className="container-bakery py-16 md:py-24">
      <header className="mb-16 text-center">
        <span className="eyebrow mb-3">The process</span>
        <h1 className="section-title mx-auto max-w-3xl">
          Ordering is as easy as{" "}
          <span className="italic text-otomi-red">pan comido.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-ink/70">
          A simple four-step flow from cart to kitchen table.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="relative rounded-3xl border border-canela/15 bg-masa/40 p-8"
            >
              <span className="absolute right-6 top-6 font-display text-5xl text-canela/10">
                0{i + 1}
              </span>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-canela text-cream">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl text-ink">{step.title}</h3>
              <p className="mt-3 text-sm text-ink/70">{step.description}</p>
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-20 max-w-3xl rounded-3xl bg-concha-rosa/40 p-10 text-center md:p-14">
        <h2 className="font-display text-3xl text-ink md:text-4xl">
          Questions? <span className="italic">We&apos;re happy to help.</span>
        </h2>
        <p className="mt-4 text-ink/70">
          Check our FAQ or reach out directly. Custom orders always welcome.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/faq" className="btn-primary">
            Read the FAQ
          </Link>
          <Link href="/contact" className="btn-ghost">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
