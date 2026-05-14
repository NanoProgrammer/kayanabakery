"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";
import { Heart, ArrowRight, Loader2 } from "lucide-react";

type FormState = {
  yourName: string;
  yourEmail: string;
  friendName: string;
  friendEmail: string;
  personalMessage: string;
};

const INITIAL: FormState = {
  yourName: "",
  yourEmail: "",
  friendName: "",
  friendEmail: "",
  personalMessage: "",
};

export default function ReferAFriendPage() {
  const { locale } = useLocale();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.yourName ||
      !form.yourEmail ||
      !form.friendName ||
      !form.friendEmail
    ) {
      toast.error(
        locale === "es"
          ? "Completa los campos requeridos"
          : "Please fill in the required fields"
      );
      return;
    }

    if (form.yourEmail.toLowerCase() === form.friendEmail.toLowerCase()) {
      toast.error(
        locale === "es"
          ? "No puedes invitarte a ti mismo 😉"
          : "You can't invite yourself 😉"
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/refer-a-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setSubmitted(true);
      toast.success(
        locale === "es" ? "¡Mensaje enviado! 🥖" : "Message sent! 🥖"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSubmitting(false);
    }
  }

  // ============ TRANSLATIONS ============
  const t = {
    eyebrow:
      locale === "es"
        ? "Comparte Karyana"
        : "Share Karyana",

    titleStart: locale === "es" ? "Las " : "Sorrows ",
    titleScript: locale === "es" ? "penas con pan" : "with bread",
    titleEnd: locale === "es" ? " son menos." : " are less.",

    subtitle:
      locale === "es"
        ? "Un dicho viejo que entendemos bien: el pan se hace para compartir. Si Karyana te trajo un pedacito de casa, mándale el sabor a alguien que quieras."
        : "An old saying we know well: bread is meant to be shared. If Karyana brought you a piece of home, send that taste to someone you love.",

    formIntro:
      locale === "es"
        ? "Llena los datos y le mandamos a tu amigo un mensaje contándole de Karyana — con tus palabras, no las nuestras."
        : "Fill in the details and we'll send your friend a note about Karyana — in your words, not ours.",

    yourName: locale === "es" ? "Tu nombre" : "Your name",
    yourEmail: locale === "es" ? "Tu correo" : "Your email",
    friendName: locale === "es" ? "Nombre de tu amigo" : "Friend's name",
    friendEmail: locale === "es" ? "Correo de tu amigo" : "Friend's email",
    message:
      locale === "es"
        ? "Tu mensaje (opcional)"
        : "Your message (optional)",
    messagePlaceholder:
      locale === "es"
        ? "Cuéntale por qué te encanta Karyana…"
        : "Tell them why you love Karyana…",

    send: locale === "es" ? "Mandar mensaje" : "Send message",
    sending: locale === "es" ? "Enviando…" : "Sending…",
    requiredHint:
      locale === "es" ? "* campos requeridos" : "* required fields",

    successTitleA: locale === "es" ? "Pan " : "Bread ",
    successTitleB: locale === "es" ? "compartido" : "shared",
    successDesc:
      locale === "es"
        ? "Le mandamos a tu amigo el mensaje. Gracias por hacer crecer la familia Karyana 🫶"
        : "We sent your friend the message. Thank you for growing the Karyana family 🫶",
    sendAnother:
      locale === "es" ? "Mandar otro mensaje" : "Send another",
    backHome: locale === "es" ? "Volver al inicio" : "Back home",
  };

  // ============ SUCCESS STATE ============
  if (submitted) {
    return (
      <div className="container-bakery py-20 md:py-28">
        <div className="mx-auto max-w-xl text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-canela-light">
            <Heart
              className="h-10 w-10 text-canela-dark"
              fill="currentColor"
            />
          </div>
          <h1 className="section-title">
            {t.successTitleA}
            <span className="font-script text-canela-dark">
              {t.successTitleB}
            </span>
            .
          </h1>
          <p className="mt-4 text-ink-soft">{t.successDesc}</p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setForm(INITIAL);
                setSubmitted(false);
              }}
              className="btn-primary"
            >
              {t.sendAnother}
            </button>
            <Link href="/" className="btn-secondary">
              {t.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============ MAIN FORM ============
  return (
    <div className="container-bakery py-16 md:py-20">
      {/* Hero */}
      <header className="mb-12 max-w-3xl">
        <span className="eyebrow">{t.eyebrow}</span>
        <h1 className="section-title mt-2">
          {t.titleStart}
          <span className="font-script text-canela-dark">
            {t.titleScript}
          </span>
          {t.titleEnd}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          {t.subtitle}
        </p>
      </header>

      {/* Form */}
      <section className="rounded-3xl border border-canela/15 bg-cream p-6 md:p-10">
        <div className="mb-8 flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canela-dark">
            <Heart className="h-4 w-4 text-cream" fill="currentColor" />
          </div>
          <p className="text-sm leading-relaxed text-ink-soft md:text-base">
            {t.formIntro}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
          noValidate
        >
          <Field
            label={t.yourName + " *"}
            value={form.yourName}
            onChange={(v) => update("yourName", v)}
            required
          />
          <Field
            label={t.yourEmail + " *"}
            type="email"
            value={form.yourEmail}
            onChange={(v) => update("yourEmail", v)}
            required
          />
          <Field
            label={t.friendName + " *"}
            value={form.friendName}
            onChange={(v) => update("friendName", v)}
            required
          />
          <Field
            label={t.friendEmail + " *"}
            type="email"
            value={form.friendEmail}
            onChange={(v) => update("friendEmail", v)}
            required
          />

          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
              {t.message}
            </label>
            <textarea
              value={form.personalMessage}
              onChange={(e) => update("personalMessage", e.target.value)}
              rows={4}
              maxLength={300}
              placeholder={t.messagePlaceholder}
              className="mt-1.5 w-full rounded-2xl border border-canela/30 bg-white px-5 py-3 text-sm leading-relaxed focus:border-canela-dark focus:outline-none"
            />
            <p className="mt-1 text-right text-[10px] text-ink-soft">
              {form.personalMessage.length}/300
            </p>
          </div>

          <div className="md:col-span-2 flex flex-col gap-4 border-t border-canela/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] uppercase tracking-widest text-ink-soft">
              {t.requiredHint}
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.sending}
                </>
              ) : (
                <>
                  {t.send}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// ============ HELPERS ============

function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1.5 w-full rounded-full border border-canela/30 bg-white px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
      />
    </div>
  );
}