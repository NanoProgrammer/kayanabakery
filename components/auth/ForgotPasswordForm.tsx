"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/locale-provider";

export function ForgotPasswordForm() {
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.text();
      const data = body ? JSON.parse(body) : null;

      if (!res.ok) {
        setError(
          data?.error ??
            (locale === "es" ? "Revisa tu correo e intenta otra vez." : "Check your email and try again.")
        );
        return;
      }
      setSent(true);
    } catch {
      setError(
        locale === "es"
          ? "No pudimos conectarnos. Intenta otra vez."
          : "We couldn't connect. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Shown whether or not the address has an account: saying which would turn
  // this page into a way of finding out who shops here.
  if (sent) {
    return (
      <div>
        <h1 className="font-display text-3xl">
          {locale === "es" ? "Revisa tu correo" : "Check your email"}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          {locale === "es"
            ? `Si existe una cuenta con ${email}, le mandamos un enlace para elegir una contraseña nueva. Sirve por una hora.`
            : `If an account exists for ${email}, we've sent it a link to choose a new password. It works for one hour.`}
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          {locale === "es"
            ? "¿No llega? Mira en spam, o escríbenos y te ayudamos."
            : "Nothing arrived? Check your spam folder, or contact us and we'll help."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <h1 className="font-display text-3xl">
        {locale === "es" ? "¿Olvidaste tu contraseña?" : "Forgot your password?"}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {locale === "es"
          ? "Escribe tu correo y te mandamos un enlace para elegir una nueva."
          : "Enter your email and we'll send you a link to choose a new one."}
      </p>

      <label className="mt-6 block text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {locale === "es" ? "Correo" : "Email"}
      </label>
      <input
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-canela/30 bg-white px-4 py-3 text-base"
        placeholder="tu@correo.com"
      />

      {error && (
        <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-5 w-full disabled:opacity-60">
        {loading
          ? locale === "es"
            ? "Enviando…"
            : "Sending…"
          : locale === "es"
          ? "Enviar enlace"
          : "Send the link"}
      </button>
    </form>
  );
}
