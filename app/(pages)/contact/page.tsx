"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Message sent! We'll get back to you within 24h.");
      (e.target as HTMLFormElement).reset();
    } catch {
      toast.error("Something went wrong. Try again?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-bakery py-16 md:py-24">
      <header className="mb-14 text-center">
        <span className="eyebrow mb-3">Say hello</span>
        <h1 className="section-title mx-auto max-w-3xl">
          Let&apos;s <span className="italic text-otomi-red">talk.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-ink/70">
          Custom cake? Large order? Just want to chat about pan? We&apos;re here.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
        <aside className="lg:col-span-2">
          <div className="space-y-6 rounded-3xl border border-canela/15 bg-masa/40 p-8">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-canela">
                <Mail className="h-4 w-4" /> Email
              </div>
              <a
                href="mailto:karyana@karyanabakery.ca"
                className="font-display text-lg text-ink hover:text-otomi-red"
              >
                karyana@karyanabakery.ca
              </a>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-canela">
                <Phone className="h-4 w-4" /> Phone
              </div>
              <a
                href="tel:+1"
                className="font-display text-lg text-ink hover:text-otomi-red"
              >
                (403) 555-0199
              </a>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-canela">
                <MapPin className="h-4 w-4" /> Pickup
              </div>
              <p className="font-display text-lg text-ink">Calgary, AB</p>
              <p className="text-sm text-ink/60">Address shared upon order.</p>
            </div>
          </div>
        </aside>

        <form onSubmit={onSubmit} className="space-y-5 lg:col-span-3">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
          </div>
          <Field label="Subject" name="subject" required />
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              Message
            </label>
            <textarea
              name="message"
              required
              rows={6}
              className="w-full rounded-2xl border border-canela/20 bg-cream p-4 text-sm text-ink placeholder:text-ink/40 focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
              placeholder="Tell us about your order, event, or question..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary group disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send message"}
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="h-12 w-full rounded-full border border-canela/20 bg-cream px-5 text-sm text-ink placeholder:text-ink/40 focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
      />
    </div>
  );
}
