"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";

export default function ContactPage() {
  const { locale } = useLocale();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      subject: fd.get("subject"),
      message: fd.get("message"),
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(
        locale === "es" ? "Mensaje enviado" : "Message sent"
      );
      e.currentTarget.reset();
    } catch {
      toast.error(
        locale === "es" ? "Error al enviar" : "Failed to send"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-bakery py-16 md:py-20">
      <div className="grid gap-12 md:grid-cols-2">
        <div>
          <span className="eyebrow">
            {locale === "es" ? "Contacto" : "Get in touch"}
          </span>
          <h1 className="mt-2 font-display text-[length:var(--text-display-md)] leading-tight">
            {locale === "es" ? "Hablemos." : "Let's talk."}
          </h1>
          <p className="mt-4 text-ink-soft">
            {locale === "es"
              ? "¿Pasteles personalizados? ¿Eventos? ¿Solo decir hola? Escríbenos."
              : "Custom cakes? Events? Just want to say hi? Drop us a line."}
          </p>

          <div className="mt-10 space-y-4">
            <ContactItem
              icon={Mail}
              label="Email"
              value="hola@karyanabakery.ca"
              href="mailto:hola@karyanabakery.ca"
            />
            <ContactItem
              icon={Phone}
              label={locale === "es" ? "Teléfono" : "Phone"}
              value="(403) 555-1234"
              href="tel:+14035551234"
            />
            <ContactItem
              icon={MapPin}
              label={locale === "es" ? "Calgary" : "Calgary"}
              value="Southeast Calgary, AB"
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-canela/15 bg-cream p-8"
        >
          <div className="space-y-5">
            <Field
              name="name"
              label={locale === "es" ? "Nombre" : "Name"}
              required
            />
            <Field name="email" type="email" label="Email" required />
            <Field
              name="subject"
              label={locale === "es" ? "Asunto" : "Subject"}
              required
            />
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
                {locale === "es" ? "Mensaje" : "Message"} *
              </label>
              <textarea
                name="message"
                required
                rows={5}
                className="mt-2 w-full rounded-2xl border border-canela/30 bg-cream px-4 py-3 text-sm focus:border-canela-dark focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting
                ? locale === "es"
                  ? "Enviando…"
                  : "Sending…"
                : locale === "es"
                ? "Enviar"
                : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: any;
  label: string;
  value: string;
  href?: string;
}) {
  const Inner = (
    <div className="flex items-center gap-4 rounded-2xl border border-canela/15 p-4 transition-colors hover:bg-canela-light">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-canela-light">
        <Icon className="h-5 w-5 text-canela-dark" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{Inner}</a> : Inner;
}

function Field({
  name,
  label,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {label} {required && "*"}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
      />
    </div>
  );
}
