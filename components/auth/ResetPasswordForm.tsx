"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";

export function ResetPasswordForm() {
  const { locale } = useLocale();
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(locale === "es" ? "Las contraseñas no coinciden." : "The passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.text();
      const data = body ? JSON.parse(body) : null;

      if (!res.ok || !data?.ok) {
        setError(
          data?.error ??
            (locale === "es"
              ? "No pudimos cambiar tu contraseña. Pide un enlace nuevo."
              : "We couldn't change your password. Ask for a new link.")
        );
        return;
      }

      toast.success(locale === "es" ? "Listo — ya puedes entrar" : "Done — you can sign in now");
      router.push("/login");
    } catch {
      setError(
        locale === "es" ? "No pudimos conectarnos. Intenta otra vez." : "We couldn't connect. Try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div>
        <h1 className="font-display text-3xl">
          {locale === "es" ? "Enlace incompleto" : "Incomplete link"}
        </h1>
        <p className="mt-3 text-sm text-ink-soft">
          {locale === "es"
            ? "Abre el enlace del correo tal cual te llegó, o pide uno nuevo."
            : "Open the link from your email exactly as it arrived, or ask for a new one."}
        </p>
        <a href="/forgot-password" className="btn-primary mt-5 inline-flex">
          {locale === "es" ? "Pedir un enlace nuevo" : "Ask for a new link"}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <h1 className="font-display text-3xl">
        {locale === "es" ? "Elige tu contraseña" : "Choose your password"}
      </h1>

      <label className="mt-6 block text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {locale === "es" ? "Contraseña nueva" : "New password"}
      </label>
      <input
        type="password"
        required
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-canela/30 bg-white px-4 py-3 text-base"
      />
      <p className={`mt-1 text-xs ${tooShort ? "text-red-700" : "text-ink-soft"}`}>
        {locale === "es" ? "Al menos 8 caracteres." : "At least 8 characters."}
      </p>

      <label className="mt-4 block text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {locale === "es" ? "Repítela" : "Repeat it"}
      </label>
      <input
        type="password"
        required
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-canela/30 bg-white px-4 py-3 text-base"
      />
      {mismatch && (
        <p className="mt-1 text-xs text-red-700">
          {locale === "es" ? "No coinciden todavía." : "These don't match yet."}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || tooShort || mismatch || !password}
        className="btn-primary mt-5 w-full disabled:opacity-60"
      >
        {loading
          ? locale === "es"
            ? "Guardando…"
            : "Saving…"
          : locale === "es"
          ? "Guardar contraseña"
          : "Save password"}
      </button>
    </form>
  );
}
