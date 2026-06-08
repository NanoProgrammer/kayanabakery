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
  situation: string;
  personalMessage: string;
};

const INITIAL: FormState = {
  yourName: "",
  yourEmail: "",
  friendName: "",
  friendEmail: "",
  situation: "",
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
      !form.friendEmail ||
      !form.situation
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
      ? "Programa comunitario"
      : "Community Program",

  titleStart: locale === "es" ? "Las " : "A little bread ",
  titleScript: locale === "es" ? "penas con pan" : "for heavy days",
  titleEnd: locale === "es" ? " son menos." : "",

  subtitle:
    locale === "es"
      ? "Todos pasamos por momentos difíciles. A veces, una caja de pan puede recordarle a alguien que no está solo. Nomina a una persona que esté atravesando una situación complicada y Karyana Bakery revisará las historias para enviar un gesto de cariño y comunidad."
      : "We all go through difficult moments. Sometimes, a box of bread can remind someone they are not alone. Nominate someone going through a hard time and Karyana Bakery will review the stories to send a gesture of kindness and community.",

  formIntro:
    locale === "es"
      ? "Cuéntanos a quién quieres nominar y por qué. Revisaremos cada historia con respeto y cariño."
      : "TEST RUBEN 123456.",

  yourName: locale === "es" ? "Tu nombre" : "Your name",
  yourEmail: locale === "es" ? "Tu correo" : "Your email",
  friendName:
    locale === "es"
      ? "Nombre de la persona nominada"
      : "Nominee's name",
  friendEmail:
    locale === "es"
      ? "Correo de la persona nominada"
      : "Nominee's email",
  situation:
  locale === "es"
    ? "¿Qué situación está atravesando?"
    : "What situation are they going through?",

situationPlaceholder:
  locale === "es"
    ? "Selecciona una opción"
    : "Select an option",
  illness: locale === "es" ? "Enfermedad" : "Illness",
grief: locale === "es" ? "Duelo" : "Grief",
unemployment: locale === "es" ? "Desempleo" : "Unemployment",
loneliness: locale === "es" ? "Soledad" : "Loneliness",
divorce: locale === "es" ? "Divorcio" : "Divorce",
depression: locale === "es" ? "Depresión" : "Depression",
moving: locale === "es" ? "Mudanza" : "Moving",
immigration:
  locale === "es"
    ? "Inmigración reciente"
    : "Recent Immigration",
financialHardship:
  locale === "es"
    ? "Dificultades económicas"
    : "Financial hardship",
other: locale === "es" ? "Otra situación" : "Other",
  message:
    locale === "es"
      ? "¿Por qué quieres nominar a esta persona?"
      : "Why would you like to nominate this person?",
  messagePlaceholder:
    locale === "es"
      ? "Cuéntanos brevemente qué está viviendo esta persona y por qué crees que una caja de pan podría alegrarle el día…"
      : "Briefly tell us what this person is going through and why a box of bread could brighten their day…",

  send: locale === "es" ? "Enviar nominación" : "Submit nomination",
  sending: locale === "es" ? "Enviando…" : "Sending…",
  requiredHint:
    locale === "es" ? "* campos requeridos" : "* required fields",

  successTitleA: locale === "es" ? "Nominación " : "Nomination ",
  successTitleB: locale === "es" ? "recibida" : "received",
  successDesc:
    locale === "es"
      ? "Gracias por compartir esta historia con nosotros. Revisaremos la nominación con mucho respeto y cariño."
      : "Thank you for sharing this story with us. We will review the nomination with care and respect.",
  sendAnother:
    locale === "es" ? "Nominar a otra persona" : "Nominate someone else",
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
<div>
  <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
    {t.situation + " *"}
  </label>

  <select
    value={form.situation}
    onChange={(e) => update("situation", e.target.value)}
    required
    className="mt-1.5 w-full rounded-2xl border border-canela/30 bg-white px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
  >
    <option value="">
      {t.situationPlaceholder}
    </option>

    <option value="Illness">
      {t.illness}
    </option>

    <option value="Grief">
      {t.grief}
    </option>

    <option value="Unemployment">
      {t.unemployment}
    </option>

    <option value="Loneliness">
      {t.loneliness}
    </option>

    <option value="Divorce">
      {t.divorce}
    </option>

    <option value="Depression">
      {t.depression}
    </option>

    <option value="Moving">
      {t.moving}
    </option>

    <option value="Recent Immigration">
     {t.immigration}
    </option>

    <option value="Financial Hardship">
      {t.financialHardship}
    </option>

    <option value="Other">
      {t.other}
    </option>
  </select>
</div>
          <div className="md:col-span-2">
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
              {t.message}
            </label>
            <textarea
              value={form.personalMessage}
              onChange={(e) => update("personalMessage", e.target.value)}
              rows={4}
              maxLength={800}
              placeholder={t.messagePlaceholder}
              className="mt-1.5 w-full rounded-2xl border border-canela/30 bg-white px-5 py-3 text-sm leading-relaxed focus:border-canela-dark focus:outline-none"
            />
            <p className="mt-1 text-right text-[10px] text-ink-soft">
              {form.personalMessage.length}/800
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
