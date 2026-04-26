"use client";

import { useState } from "react";
import { Plus, Trash2, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Address = {
  id: string;
  label?: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
};

export function AddressManager({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd.entries())),
      });
      if (!res.ok) throw new Error();
      toast.success("Address saved");
      setAdding(false);
      router.refresh();
    } catch {
      toast.error("Could not save address");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this address?")) return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Removed");
      router.refresh();
    }
  }

  async function setDefault(id: string, type: "billing" | "shipping") {
    const res = await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default: type }),
    });
    if (res.ok) {
      toast.success("Default updated");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {initialAddresses.length === 0 && !adding && (
        <div className="rounded-2xl border border-canela/15 bg-masa/30 p-8 text-center">
          <p className="text-ink/60">No addresses saved yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {initialAddresses.map((a) => (
          <div
            key={a.id}
            className="rounded-2xl border border-canela/15 bg-masa/30 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {a.label && (
                  <p className="text-xs font-bold uppercase tracking-widest text-canela">
                    {a.label}
                  </p>
                )}
                <p className="mt-1 font-display text-lg text-ink">
                  {a.fullName}
                </p>
                <p className="text-sm text-ink/70">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                </p>
                <p className="text-sm text-ink/70">
                  {a.city}, {a.province} {a.postalCode}
                </p>
                <p className="mt-1 text-xs text-ink/50">{a.phone}</p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {a.isDefaultBilling && (
                    <span className="rounded-full bg-canela/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-canela">
                      Default billing
                    </span>
                  )}
                  {a.isDefaultShipping && (
                    <span className="rounded-full bg-otomi-teal/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-otomi-teal">
                      Default shipping
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => remove(a.id)}
                className="text-ink/40 hover:text-otomi-red"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setDefault(a.id, "billing")}
                className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-canela"
              >
                {a.isDefaultBilling ? (
                  <StarOff className="h-3.5 w-3.5" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}
                Set as billing default
              </button>
              <button
                onClick={() => setDefault(a.id, "shipping")}
                className="inline-flex items-center gap-1.5 text-xs text-ink/60 hover:text-canela"
              >
                {a.isDefaultShipping ? (
                  <StarOff className="h-3.5 w-3.5" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}
                Set as shipping default
              </button>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-canela/20 bg-cream p-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input name="label" placeholder="Label (Home, Work)" />
            <Input name="fullName" placeholder="Full name" required />
            <Input name="phone" placeholder="Phone" required />
            <Input name="line1" placeholder="Address line 1" required />
            <Input name="line2" placeholder="Apt, suite, etc. (optional)" />
            <Input name="city" placeholder="City" required />
            <Input name="province" placeholder="Province" defaultValue="AB" />
            <Input name="postalCode" placeholder="Postal code" required />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="btn-ghost"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-canela/20 py-6 text-sm font-medium text-canela hover:border-canela hover:bg-masa/30"
        >
          <Plus className="h-4 w-4" />
          Add new address
        </button>
      )}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-11 rounded-full border border-canela/20 bg-cream px-4 text-sm text-ink focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
    />
  );
}
