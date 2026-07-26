"use client";

import { useState } from "react";
import { toast } from "sonner";

type Policy = {
  year: number;
  mode: "FORFEIT" | "DONATE";
  decidedAt: string;
  executedAt: string | null;
  totalCreditsProcessedCents: number;
  usersAffected: number;
};

export function CreditPolicyManager({ policies }: { policies: Policy[] }) {
  const nextFebYear = new Date().getMonth() >= 11 // Dec (0-indexed 11)
    ? new Date().getFullYear() + 2
    : new Date().getFullYear() + 1;

  const existing = policies.find((p) => p.year === nextFebYear);
  const [mode, setMode] = useState<"FORFEIT" | "DONATE">(existing?.mode ?? "FORFEIT");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/credit-policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: nextFebYear, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Policy for Feb 1, ${nextFebYear} saved`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-canela/15 bg-cream p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
          Policy for February 1, {nextFebYear}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("FORFEIT")}
            className={`rounded-full px-5 py-2 text-sm font-medium ${
              mode === "FORFEIT" ? "bg-canela-dark text-cream" : "border border-canela/30"
            }`}
          >
            Forfeit (financial priority)
          </button>
          <button
            type="button"
            onClick={() => setMode("DONATE")}
            className={`rounded-full px-5 py-2 text-sm font-medium ${
              mode === "DONATE" ? "bg-canela-dark text-cream" : "border border-canela/30"
            }`}
          >
            Donate gift cards (PR priority)
          </button>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save policy"}
        </button>
        <p className="mt-3 text-xs text-ink-soft">
          Unused points as of Feb 1, {nextFebYear} will be{" "}
          {mode === "FORFEIT" ? "permanently removed" : "converted to donated gift cards"}.
          This runs automatically once saved — make sure this is final before Feb 1.
        </p>
      </div>

      <div className="rounded-3xl border border-canela/15 bg-cream p-6">
        <h2 className="font-display text-lg">History</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="pb-2">Year</th>
              <th className="pb-2">Mode</th>
              <th className="pb-2">Executed</th>
              <th className="pb-2">Processed</th>
              <th className="pb-2">Users</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.year} className="border-t border-canela/10">
                <td className="py-2">{p.year}</td>
                <td className="py-2">{p.mode}</td>
                <td className="py-2">
                  {p.executedAt ? new Date(p.executedAt).toLocaleDateString() : "Pending"}
                </td>
                <td className="py-2">${(p.totalCreditsProcessedCents / 100).toFixed(2)}</td>
                <td className="py-2">{p.usersAffected}</td>
              </tr>
            ))}
            {policies.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-ink-soft">
                  No policies set yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
