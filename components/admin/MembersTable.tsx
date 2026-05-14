"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Coins, Search } from "lucide-react";
import { toast } from "sonner";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  tier: string;
  pointsBalance: number;
  orderCount: number;
  createdAt: string;
};

export function MembersTable({ users }: { users: User[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [grantingUser, setGrantingUser] = useState<User | null>(null);
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantNote, setGrantNote] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.phone.includes(term)
    );
  }, [q, users]);

  async function grantPoints() {
    if (!grantingUser) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/grant-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: grantingUser.id,
          amount: grantAmount,
          note: grantNote || "Manual adjustment",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Granted ${grantAmount} pts to ${grantingUser.name}`);
      setGrantingUser(null);
      setGrantNote("");
      setGrantAmount(100);
      router.refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone…"
          className="w-full rounded-full border border-canela/30 bg-cream pl-11 pr-4 py-2.5 text-sm focus:border-canela-dark focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-canela/15 bg-cream">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-canela/15 text-left text-xs uppercase tracking-widest text-ink-soft">
              <th className="p-3">Customer</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Role</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Points</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                className="border-b border-canela/10 last:border-0"
              >
                <td className="p-3">
                  <p className="font-medium">{u.name || "—"}</p>
                  <p className="text-[10px] text-ink-soft">{u.email}</p>
                </td>
                <td className="p-3 font-medium">{u.tier}</td>
                <td className="p-3 text-xs">{u.role}</td>
                <td className="p-3">{u.orderCount}</td>
                <td className="p-3 font-bold">
                  {u.pointsBalance.toLocaleString()}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => setGrantingUser(u)}
                    className="inline-flex items-center gap-1 rounded-full border border-canela/30 px-3 py-1 text-xs hover:bg-canela-light"
                  >
                    <Coins className="h-3 w-3" />
                    Grant pts
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grant modal */}
      {grantingUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setGrantingUser(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-cream p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl">
              Grant points to {grantingUser.name || grantingUser.email}
            </h3>
            <p className="text-xs text-ink-soft">
              Current: {grantingUser.pointsBalance} pts
            </p>

            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
              Amount (negative to deduct)
            </label>
            <input
              type="number"
              value={grantAmount}
              onChange={(e) => setGrantAmount(Number(e.target.value))}
              className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm"
            />

            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
              Note
            </label>
            <input
              value={grantNote}
              onChange={(e) => setGrantNote(e.target.value)}
              placeholder="e.g. Customer service compensation"
              className="mt-2 w-full rounded-full border border-canela/30 bg-cream px-5 py-3 text-sm"
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={grantPoints}
                disabled={busy || grantAmount === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {busy ? "..." : "Grant"}
              </button>
              <button
                onClick={() => setGrantingUser(null)}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
