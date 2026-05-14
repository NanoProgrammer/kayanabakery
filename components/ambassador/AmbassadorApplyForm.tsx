"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function AmbassadorApplyForm({
  existingStatus,
  defaultEmail,
  defaultName,
}: {
  existingStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  defaultEmail?: string;
  defaultName?: string;
}) {
  const { t, locale } = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (existingStatus) {
    return (
      <section className="container-bakery py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-canela/20 bg-cream p-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-canela-dark" />
          <h2 className="font-display text-3xl">
            {existingStatus === "APPROVED"
              ? locale === "es"
                ? "¡Bienvenido, Embajador!"
                : "Welcome, Ambassador!"
              : existingStatus === "REJECTED"
              ? locale === "es"
                ? "Aplicación cerrada"
                : "Application closed"
              : locale === "es"
              ? "Aplicación recibida"
              : "Application received"}
          </h2>
          <p className="mt-3 text-ink-soft">
            {existingStatus === "APPROVED"
              ? locale === "es"
                ? "Tu membresía Embajador está activa. Ve a tu cuenta para más detalles."
                : "Your Ambassador membership is active. See your account for details."
              : existingStatus === "REJECTED"
              ? locale === "es"
                ? "Gracias por tu interés. Por ahora no podemos avanzar con tu aplicación."
                : "Thanks for your interest. We can't move forward with your application at this time."
              : locale === "es"
              ? "Estamos revisando tu aplicación. Te respondemos pronto."
              : "We're reviewing your application. We'll get back soon."}
          </p>
        </div>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="container-bakery py-20">
        <div className="mx-auto max-w-2xl rounded-3xl border border-canela/20 bg-cream p-10 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-canela-dark" />
          <h2 className="font-display text-3xl">
            {t("ambassador.submitted")}
          </h2>
          <p className="mt-3 text-ink-soft">
            {t("ambassador.submittedMessage")}
          </p>
        </div>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      instagram: fd.get("instagram") || undefined,
      followers: fd.get("followers") || undefined,
      city: fd.get("city"),
      motivation: fd.get("motivation"),
      hasVehicle: fd.get("hasVehicle") === "on",
      willDeliver: fd.get("willDeliver") === "on",
    };

    try {
      const res = await fetch("/api/ambassador/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container-bakery py-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display text-3xl md:text-4xl">
          {t("ambassador.applyTitle")}
        </h2>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field
            name="fullName"
            label={t("ambassador.fullName")}
            required
            defaultValue={defaultName}
          />
          <Field
            name="email"
            type="email"
            label="Email"
            required
            defaultValue={defaultEmail}
          />
          <Field name="phone" type="tel" label={t("checkout.phone")} required />
          <Field name="city" label={t("ambassador.city")} required />
          <div className="grid gap-5 md:grid-cols-2">
            <Field name="instagram" label={t("ambassador.instagram")} />
            <Field
              name="followers"
              type="number"
              label={t("ambassador.followers")}
              min={0}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
              {t("ambassador.motivation")} *
            </label>
            <textarea
              name="motivation"
              required
              rows={5}
              minLength={20}
              maxLength={2000}
              className="mt-2 w-full rounded-2xl border border-canela/30 bg-cream px-4 py-3 text-sm focus:border-canela-dark focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" name="hasVehicle" className="h-4 w-4" />
            {t("ambassador.hasVehicle")}
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-60"
          >
            {submitting ? t("common.loading") : t("ambassador.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  min,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  defaultValue?: string;
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
        min={min}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
      />
    </div>
  );
}
