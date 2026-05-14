"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { formatCents } from "@/lib/checkout/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  status: string;
  payoutCents: number;
  ambassadorName: string;
  orderNumber: string;
  orderTotal: number;
  deliveredAt: string | null;
  paidAt: string | null;
};

export function DeliveriesTable({ deliveries }: { deliveries: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function markPaid(id: string) {
    if (
      !confirm(
        "Mark this delivery as paid? Confirm you sent the Square payout."
      )
    )
      return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/deliveries/${id}/payout`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("Marked as paid");
      router.refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setBusy(null);
    }
  }

  // Group by status
  const pending = deliveries.filter((d) => d.status === "DELIVERED");
  const paid = deliveries.filter((d) => d.status === "PAID");

  const totalPending = pending.reduce((s, d) => s + d.payoutCents, 0);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-canela/15 bg-cream p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
          Pending payouts
        </p>
        <p className="mt-2 font-display text-3xl">
          {formatCents(totalPending, "en")}
        </p>
        <p className="text-xs text-ink-soft">
          {pending.length} {pending.length === 1 ? "delivery" : "deliveries"}
        </p>
      </div>

      <Section
        title="Pending payment"
        rows={pending}
        actionLabel="Mark paid"
        onAction={markPaid}
        busy={busy}
      />
      <Section title="Paid" rows={paid} />
    </div>
  );
}

function Section({
  title,
  rows,
  actionLabel,
  onAction,
  busy,
}: {
  title: string;
  rows: Row[];
  actionLabel?: string;
  onAction?: (id: string) => void;
  busy?: string | null;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <h3 className="mb-3 font-display text-lg">{title}</h3>
      <div className="overflow-x-auto rounded-2xl border border-canela/15 bg-cream">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-canela/15 text-left text-xs uppercase tracking-widest text-ink-soft">
              <th className="p-3">Order</th>
              <th className="p-3">Ambassador</th>
              <th className="p-3">Delivered</th>
              <th className="p-3">Payout</th>
              {actionLabel && <th className="p-3"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr
                key={d.id}
                className="border-b border-canela/10 last:border-0"
              >
                <td className="p-3 font-mono text-xs">{d.orderNumber}</td>
                <td className="p-3">{d.ambassadorName}</td>
                <td className="p-3 text-xs">
                  {d.deliveredAt
                    ? new Date(d.deliveredAt).toLocaleDateString("en-CA")
                    : "-"}
                </td>
                <td className="p-3 font-bold">
                  {formatCents(d.payoutCents, "en")}
                </td>
                {actionLabel && (
                  <td className="p-3">
                    <button
                      disabled={busy === d.id}
                      onClick={() => onAction?.(d.id)}
                      className="inline-flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {busy === d.id ? "..." : actionLabel}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
