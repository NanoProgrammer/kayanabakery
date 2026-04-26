import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";

const shopLinks = [
  { href: "/category/conchas", label: "Conchas" },
  { href: "/category/cakes", label: "Cakes" },
  { href: "/category/traditional-bread", label: "Traditional Bread" },
  { href: "/category/corn-pancakes", label: "Corn Pancakes" },
  { href: "/shop", label: "All products" },
];

const helpLinks = [
  { href: "/how-to-order", label: "How to Order" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact Us" },
  { href: "/refer-a-friend", label: "Refer a Friend" },
];

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/events", label: "Events" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-cream">
      <div className="grain absolute inset-0" />
      <div className="container-bakery relative py-20 md:py-24">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
          <div className="col-span-2 md:col-span-5">
            <Link href="/" className="inline-flex flex-col">
              <span className="font-display text-4xl leading-none tracking-tight md:text-5xl">
                Karyana
              </span>
              <span className="mt-1 font-script text-2xl text-otomi-yellow">
                bakery
              </span>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-cream/60">
              Handcrafted Mexican pan dulce, conchas, and cakes. Baked in
              Calgary with the warmth of home since 2018.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <a
                href="https://www.instagram.com/karyanaruiz_bakery/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 transition-all hover:border-otomi-yellow hover:text-otomi-yellow"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/KaryanaRuizbakery"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 transition-all hover:border-otomi-yellow hover:text-otomi-yellow"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.youtube.com/@KaryanaBakery"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 transition-all hover:border-otomi-yellow hover:text-otomi-yellow"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-cream/50">
              Shop
            </h4>
            <ul className="space-y-3">
              {shopLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-cream/80 transition-colors hover:text-otomi-yellow"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-cream/50">
              Help
            </h4>
            <ul className="space-y-3">
              {helpLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-cream/80 transition-colors hover:text-otomi-yellow"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-cream/50">
              Company
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-cream/80 transition-colors hover:text-otomi-yellow"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-cream/10 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} Karyana Bakery. Made with{" "}
            <span className="text-otomi-red">♥</span> in Calgary.
          </p>
          <p className="font-script text-lg text-otomi-yellow">
            More than bread, a home memory.
          </p>
        </div>
      </div>
    </footer>
  );
}
