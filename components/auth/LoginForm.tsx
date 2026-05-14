"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";

export function LoginForm() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);

    if (res?.error) {
      toast.error(
        locale === "es" ? "Email o contraseña incorrectos" : "Invalid credentials"
      );
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => signIn("google", { callbackUrl })}
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-full border border-canela/30 bg-cream px-6 py-3 text-sm font-medium hover:bg-canela-light"
      >
        <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.4-.1-2.4-.4-3.5z"
          />
          <path
            fill="#FF3D00"
            d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16 4 9.1 8.4 6.3 14.7z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6C29.5 34.5 26.9 35.5 24 35.5c-5.2 0-9.7-3.3-11.3-8l-6.5 5C9 39.5 16 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C42.5 35 44 30 44 24c0-1.4-.1-2.4-.4-3.5z"
          />
        </svg>
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-canela/20" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-cream px-3 text-xs uppercase tracking-widest text-ink-soft">
            or
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? t("common.loading") : t("common.signIn")}
        </button>
      </form>
    </div>
  );
}
