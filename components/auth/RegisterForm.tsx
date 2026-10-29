"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const refCode = params.get("ref") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; taken: boolean } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, refCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // In the form, not a toast at the bottom of the page. The commonest
        // failure by far is an address that already has an account, and that
        // one needs a way forward rather than a message that fades.
        setError({
          message: data.error || "We couldn't create the account.",
          taken: res.status === 409,
        });
        return;
      }
      // auto sign-in
      const signRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (signRes?.error) {
        toast.error("Account created, but sign-in failed. Try logging in.");
        router.push("/login");
        return;
      }
      // Says so on the page they land on. Registering used to sign them in and
      // drop them on the account page with nothing confirmed at all.
      router.push("/account/overview?welcome=1");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Full name"
        value={name}
        onChange={setName}
        required
        autoComplete="name"
      />
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        required
        autoComplete="email"
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        required
        minLength={8}
        autoComplete="new-password"
      />
      {refCode && (
        <p className="rounded-2xl bg-canela-light px-4 py-3 text-xs">
          Referral code: <span className="font-bold">{refCode}</span> · You'll get $10 credit on your first order.
        </p>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p>{error.message}</p>
          {/* The commonest failure by far is an address that already has an
              account. That needs a way forward, not a message that fades. */}
          {error.taken && (
            <p className="mt-2">
              <Link href="/login" className="font-bold underline">
                Sign in instead
              </Link>{" "}
              or{" "}
              <Link href="/forgot-password" className="font-bold underline">
                choose a new password
              </Link>
              .
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
  minLength,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  /** Without it a password manager cannot offer to save or fill the field. */
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
      />
    </div>
  );
}
