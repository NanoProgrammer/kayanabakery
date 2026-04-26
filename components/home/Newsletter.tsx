"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setEmail("");
      toast.success("You're in. Welcome to the Karyana family 🥖");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      toast.error("Something went wrong. Try again?");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <section className="relative bg-cream py-20 md:py-24">
      <div className="container-bakery">
        <div className="relative overflow-hidden rounded-[40px] border border-canela/15 bg-masa/40 p-10 md:p-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-concha-rosa/30 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-otomi-yellow/15 blur-3xl" />
          </div>

          <div className="relative grid grid-cols-1 items-center gap-10 md:grid-cols-2">
            <div>
              <span className="eyebrow mb-3">Stay warm</span>
              <h2 className="font-display text-[length:var(--text-display-md)] leading-[var(--text-display-md--line-height)] tracking-[var(--text-display-md--letter-spacing)] text-ink">
                First pick on new batches,{" "}
                <span className="italic text-otomi-red">
                  exclusive offers.
                </span>
              </h2>
              <p className="mt-4 max-w-md text-ink/70">
                Join our newsletter for seasonal drops, early access to custom
                cake slots, and the occasional concha recipe.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-canela/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="h-16 w-full rounded-full border border-canela/20 bg-cream pl-14 pr-36 text-sm text-ink placeholder:text-ink/40 focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="absolute right-2 top-1/2 flex h-12 -translate-y-1/2 items-center gap-2 rounded-full bg-canela px-6 text-sm font-medium text-cream transition-all hover:bg-canela-dark disabled:opacity-60"
                >
                  {status === "success" ? (
                    <>
                      <Check className="h-4 w-4" />
                      Subscribed
                    </>
                  ) : status === "loading" ? (
                    "Subscribing…"
                  ) : (
                    "Subscribe"
                  )}
                </button>
              </div>
              <p className="mt-3 pl-2 text-xs text-ink/50">
                No spam. Unsubscribe anytime.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
