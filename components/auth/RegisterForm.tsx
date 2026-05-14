"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const refCode = params.get("ref") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, refCode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Registration failed");
        return;
      }
      // auto sign-in
      const signRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (signRes?.error) {
        toast.error("Account created, but sign-in failed. Try logging in.");
        router.push("/login");
        return;
      }
      router.push("/account");
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
      />
      <Field
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        required
      />
      <Field
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        required
        minLength={6}
      />
      {refCode && (
        <p className="rounded-2xl bg-canela-light px-4 py-3 text-xs">
          Referral code: <span className="font-bold">{refCode}</span> · You'll get $10 credit on your first order.
        </p>
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
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm focus:border-canela-dark focus:outline-none"
      />
    </div>
  );
}
