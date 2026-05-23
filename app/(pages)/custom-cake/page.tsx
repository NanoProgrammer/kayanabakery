"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";
import {
  Calendar,
  Upload,
  Send,
  Loader2,
  Cake,
  Users,
  CheckCircle2,
  Info,
} from "lucide-react";
import { CakeSizeCalculator } from "@/components/cake/CakeSizeCalculator";

const FLAVORS = [
  "Vanilla",
  "Chocolate",
  "3 Leches",
  "Lemon",
  "Lemon Poppy Seed",
  "Strawberry",
  "Funfetti",
  "Marmalade",
  "Carrot",
  "Red Velvet",
];

const FILLINGS = [
  "Strawberry (handmade jam)",
  "Blueberry (handmade jam)",
  "Raspberry (handmade jam)",
  "Red Fruits (handmade jam)",
  "Nutella",
];

const FROSTINGS = ["Buttercream", "Whipped Cream"];

const EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Baby Shower",
  "Anniversary",
  "Graduation",
  "Quinceañera",
  "Corporate",
  "Holiday",
  "Other",
];

const EXTRAS = [
  "Fresh fruit (add on)",
  "Pecans (add on)",
  "Pistachio (add on)",
  "Chocolate chips (add on)",
];

type FormData = {
  date: string;
  theme: string;
  eventType: string;
  guests: string;
  flavor: string;
  filling: string;
  frosting: string;
  extras: string[];
  notes: string;
  referenceDescription: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

const INITIAL: FormData = {
  date: "",
  theme: "",
  eventType: "",
  guests: "",
  flavor: "",
  filling: "",
  frosting: "",
  extras: [],
  notes: "",
  referenceDescription: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

export default function CustomCakePage() {
  const { locale } = useLocale();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeCakeTerms, setAgreeCakeTerms] = useState(false);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleExtra(extra: string) {
    setForm((f) => ({
      ...f,
      extras: f.extras.includes(extra)
        ? f.extras.filter((e) => e !== extra)
        : [...f.extras, extra],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!agreeTerms || !agreeCakeTerms) {
      toast.error(
        locale === "es"
          ? "Debes aceptar los términos"
          : "You must agree to the terms"
      );
      return;
    }

    if (!form.contactName || !form.contactEmail || !form.contactPhone) {
      toast.error(
        locale === "es"
          ? "Completa tu información de contacto"
          : "Please complete your contact information"
      );
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        fd.append(k, Array.isArray(v) ? v.join(", ") : v);
      });
      if (referenceFile) fd.append("referenceImage", referenceFile);

      const res = await fetch("/api/custom-cake", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      toast.success(
        locale === "es" ? "¡Solicitud enviada!" : "Request sent!"
      );
    } catch {
      toast.error(
        locale === "es" ? "Error al enviar" : "Failed to send"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="container-bakery py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-canela-light">
            <CheckCircle2 className="h-10 w-10 text-canela-dark" />
          </div>
          <h1 className="section-title">
            {locale === "es" ? "¡Solicitud " : "Request "}
            <span className="font-script text-canela-dark">
              {locale === "es" ? "enviada!" : "sent!"}
            </span>
          </h1>
          <p className="mt-4 text-ink-soft">
            {locale === "es"
              ? "Revisaremos tu solicitud y te contactaremos en menos de 24 horas con un presupuesto. Recuerda: el pago completo es necesario antes de iniciar la producción."
              : "We'll review your request and contact you within 24 hours with a quote. Remember: full payment is required before production begins."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setForm(INITIAL);
                setSubmitted(false);
                setAgreeTerms(false);
                setAgreeCakeTerms(false);
                setReferenceFile(null);
              }}
              className="btn-primary"
            >
              {locale === "es" ? "Otra solicitud" : "Another request"}
            </button>
            <Link href="/" className="btn-ghost">
              {locale === "es" ? "Volver al inicio" : "Back home"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const t = {
    heroEyebrow: locale === "es" ? "Pasteles personalizados" : "Custom cakes",
    heroTitle: locale === "es" ? "Tu pastel," : "Your cake,",
    heroTitleAccent: locale === "es" ? "tu historia." : "your story.",
    heroSub: locale === "es"
      ? "Cada pastel que hacemos es una pieza artesanal única. Cuéntanos tu visión y la haremos realidad."
      : "Every cake we make is a unique artisan piece. Tell us your vision and we'll bring it to life.",
  };

  // Min date = 3 days from now
  const minDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="container-bakery py-16 md:py-20">
      {/* Hero */}
      <header className="mb-12 max-w-3xl">
        <span className="eyebrow">{t.heroEyebrow}</span>
        <h1 className="section-title mt-2">
          {t.heroTitle}{" "}
          <span className="font-script text-canela-dark">
            {t.heroTitleAccent}
          </span>
        </h1>
        <p className="mt-4 text-base text-ink-soft md:text-lg">{t.heroSub}</p>
      </header>

      <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event details */}
          <FormSection
            num={1}
            title={locale === "es" ? "Detalles del evento" : "Event details"}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{locale === "es" ? "Fecha del evento *" : "Event date *"}</Label>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <Label>{locale === "es" ? "Tipo de evento *" : "Event type *"}</Label>
                <select
                  required
                  value={form.eventType}
                  onChange={(e) => update("eventType", e.target.value)}
                  className="input-field"
                >
                  <option value="">{locale === "es" ? "Seleccionar..." : "Select..."}</option>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{locale === "es" ? "Tema / temática" : "Theme"}</Label>
                <input
                  type="text"
                  value={form.theme}
                  onChange={(e) => update("theme", e.target.value)}
                  placeholder={locale === "es" ? "Ej: Unicornio, Elegante, Mexicano..." : "e.g. Unicorn, Elegant, Mexican..."}
                  className="input-field"
                />
              </div>
              <div>
                <Label>
                  <Users className="inline h-3 w-3 mr-1" />
                  {locale === "es" ? "Número de personas *" : "Number of guests *"}
                </Label>
                <input
                  type="number"
                  required
                  min={1}
                  max={300}
                  value={form.guests}
                  onChange={(e) => update("guests", e.target.value)}
                  placeholder="e.g. 30"
                  className="input-field"
                />
              </div>
            </div>
          </FormSection>

          {/* Reference image */}
          <FormSection
            num={2}
            title={locale === "es" ? "Imagen de referencia" : "Reference image"}
          >
            <div className="rounded-2xl border-2 border-dashed border-canela/30 bg-cream/50 p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-ink-soft mb-3" />
              <p className="text-sm text-ink-soft mb-3">
                {locale === "es"
                  ? "Sube una imagen como inspiración (no copia exacta)"
                  : "Upload an image for inspiration (not exact copy)"}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReferenceFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              {referenceFile && (
                <p className="mt-2 text-xs text-canela-dark">
                  ✓ {referenceFile.name}
                </p>
              )}
            </div>
            <div className="mt-3">
              <Label>{locale === "es" ? "Descripción de referencia (notas)" : "Reference description (notes)"}</Label>
              <textarea
                value={form.referenceDescription}
                onChange={(e) => update("referenceDescription", e.target.value)}
                rows={3}
                placeholder={locale === "es" ? "Describe lo que te gusta de la referencia..." : "Describe what you like about the reference..."}
                className="input-field"
              />
            </div>
            <div className="mt-2 flex items-start gap-2 rounded-xl bg-canela-light/50 p-3">
              <Info className="h-4 w-4 text-canela-dark mt-0.5 shrink-0" />
              <p className="text-xs text-ink-soft">
                {locale === "es"
                  ? "Las imágenes son solo referencia. Cada pastel es una pieza artesanal única — variaciones de color, textura y proporción son parte del proceso."
                  : "Images are reference only. Every cake is a unique artisan piece — variations in color, texture, and proportion are part of the handmade process."}
              </p>
            </div>
          </FormSection>

          {/* Flavors */}
          <FormSection
            num={3}
            title={locale === "es" ? "Sabores y rellenos" : "Flavors & fillings"}
          >
            <div className="space-y-4">
              <div>
                <Label>{locale === "es" ? "Sabor del pan *" : "Cake flavor *"}</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {FLAVORS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => update("flavor", f)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        form.flavor === f
                          ? "border-canela-dark bg-canela-light text-canela-dark"
                          : "border-canela/30 bg-cream hover:border-canela"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                {form.flavor === "3 Leches" && (
                  <p className="mt-2 text-xs text-red-600">
                    ⚠ {locale === "es"
                      ? "Tres Leches no puede usarse en pasteles altos o de varios pisos"
                      : "Tres Leches cannot be used with tall or multi-tier cakes"}
                  </p>
                )}
              </div>

              <div>
                <Label>{locale === "es" ? "Relleno" : "Filling"}</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {FILLINGS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => update("filling", f)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        form.filling === f
                          ? "border-canela-dark bg-canela-light text-canela-dark"
                          : "border-canela/30 bg-cream hover:border-canela"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{locale === "es" ? "Betún / cobertura *" : "Frosting *"}</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {FROSTINGS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => update("frosting", f)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        form.frosting === f
                          ? "border-canela-dark bg-canela-light text-canela-dark"
                          : "border-canela/30 bg-cream hover:border-canela"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{locale === "es" ? "Extras" : "Extras"}</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {EXTRAS.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => toggleExtra(ex)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        form.extras.includes(ex)
                          ? "border-canela-dark bg-canela-light text-canela-dark"
                          : "border-canela/30 bg-cream hover:border-canela"
                      }`}
                    >
                      {form.extras.includes(ex) ? "✓ " : ""}{ex}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-ink-soft">
              {locale === "es"
                ? "¿Necesitas otro sabor? Escríbelo en las notas."
                : "Need a flavor not listed? Write it in the notes."}
            </p>
          </FormSection>

          {/* Notes */}
          <FormSection
            num={4}
            title={locale === "es" ? "Notas adicionales" : "Additional notes"}
          >
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder={locale === "es"
                ? "Mensaje en el pastel, alergias, detalles especiales..."
                : "Message on cake, allergies, special details..."}
              className="input-field"
            />
            <p className="mt-1 text-right text-[10px] text-ink-soft">
              {form.notes.length}/1000
            </p>
          </FormSection>

          {/* Contact info */}
          <FormSection
            num={5}
            title={locale === "es" ? "Información de contacto" : "Contact information"}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>{locale === "es" ? "Nombre completo *" : "Full name *"}</Label>
                <input
                  type="text"
                  required
                  value={form.contactName}
                  onChange={(e) => update("contactName", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <input
                  type="email"
                  required
                  value={form.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <Label>{locale === "es" ? "Teléfono *" : "Phone *"}</Label>
                <input
                  type="tel"
                  required
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </FormSection>

          {/* Terms */}
          <div className="space-y-3 rounded-2xl border border-canela/15 bg-cream p-5">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-ink-soft">
                {locale === "es" ? "Acepto los " : "I agree to the "}
                <Link href="/terms" className="text-canela-dark underline" target="_blank">
                  {locale === "es" ? "Términos y Condiciones" : "Terms & Conditions"}
                </Link>
                {locale === "es" ? " y la " : " and "}
                <Link href="/privacy" className="text-canela-dark underline" target="_blank">
                  {locale === "es" ? "Política de Privacidad" : "Privacy Policy"}
                </Link>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={agreeCakeTerms}
                onChange={(e) => setAgreeCakeTerms(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-ink-soft">
                {locale === "es" ? "Acepto los " : "I agree to the "}
                <Link href="/cake-terms" className="text-canela-dark underline" target="_blank">
                  {locale === "es" ? "Términos de Pasteles Personalizados" : "Custom Cake Order Terms"}
                </Link>
                {locale === "es"
                  ? " (pago por adelantado, imágenes como referencia no copia, etc.)"
                  : " (payment upfront, reference images not copies, etc.)"}
              </span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !agreeTerms || !agreeCakeTerms}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {locale === "es" ? "Enviando..." : "Sending..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {locale === "es" ? "Enviar solicitud" : "Submit request"}
              </>
            )}
          </button>
        </form>

        {/* Sidebar: Size calculator */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-6">
          <CakeSizeCalculator
            guests={form.guests ? parseInt(form.guests) : 0}
          />

          <div className="rounded-2xl border border-canela/15 bg-cream p-5">
            <h3 className="font-display text-lg mb-3">
              {locale === "es" ? "¿Cómo funciona?" : "How it works"}
            </h3>
            <ol className="space-y-3 text-sm text-ink-soft">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canela text-[10px] font-bold">1</span>
                {locale === "es" ? "Llenas esta forma con tus detalles" : "Fill out this form with your details"}
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canela text-[10px] font-bold">2</span>
                {locale === "es" ? "Te enviamos presupuesto en 24h" : "We send you a quote within 24h"}
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canela text-[10px] font-bold">3</span>
                {locale === "es" ? "Pagas 100% por adelantado" : "You pay 100% upfront"}
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-canela text-[10px] font-bold">4</span>
                {locale === "es" ? "¡Horneamos tu pastel!" : "We bake your cake!"}
              </li>
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FormSection({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-canela text-xs font-bold">
          {num}
        </span>
        <h2 className="font-display text-xl">{title}</h2>
      </header>
      <div className="ml-10">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1 block text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
      {children}
    </label>
  );
}
