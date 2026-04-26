"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RegisterForm({ referralCode }: { referralCode?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          referralCode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Registration failed");
      }

      // Auto sign-in
      await signIn("credentials", {
        email: fd.get("email"),
        password: fd.get("password"),
        redirect: false,
      });

      toast.success("Welcome to Karyana!");
      router.push("/account");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => signIn("google", { callbackUrl: "/account" })}
        type="button"
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-canela/20 bg-cream text-sm font-medium text-ink transition-all hover:border-canela hover:bg-masa/60"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-ink/40">
        <div className="h-px flex-1 bg-canela/15" />
        OR
        <div className="h-px flex-1 bg-canela/15" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          name="name"
          required
          placeholder="Full name"
          className="h-12 w-full rounded-full border border-canela/20 bg-cream px-5 text-sm text-ink focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="h-12 w-full rounded-full border border-canela/20 bg-cream px-5 text-sm text-ink focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Password (min 6 characters)"
          className="h-12 w-full rounded-full border border-canela/20 bg-cream px-5 text-sm text-ink focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-xs text-ink/50">
        By creating an account you agree to our Terms & Privacy Policy.
      </p>
    </div>
  );
}
