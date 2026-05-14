"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/checkout/pricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-canela-light text-canela-dark",
  READY: "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-canela text-ink",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-700",
};

type Row = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  fulfillmentType: string;
  customerName: string;
  customerEmail: string;
  addressLine: string | null;
  slotLabel: string;
  createdAt: string;
  itemCount: number;
};

export function OrdersTable({
  orders,
  activeStatus,
}: {
  orders: Row[];
  activeStatus: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status updated");
      router.refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium",
            !activeStatus
              ? "border-canela bg-canela"
              : "border-canela/30 bg-cream"
          )}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              activeStatus === s
                ? "border-canela bg-canela"
                : "border-canela/30 bg-cream"
            )}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl bg-cream p-8 text-center text-sm text-ink-soft">
          No orders found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-canela/15 bg-cream">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-canela/15 text-left text-xs uppercase tracking-widest text-ink-soft">
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Type</th>
                <th className="p-3">When</th>
                <th className="p-3">Items</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-canela/10 last:border-0 hover:bg-canela-light/30"
                >
                  <td className="p-3 font-mono text-xs">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-bold hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="text-[10px] text-ink-soft">
                      {new Date(o.createdAt).toLocaleString("en-CA", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-[10px] text-ink-soft">
                      {o.customerEmail}
                    </p>
                  </td>
                  <td className="p-3 text-xs">
                    {o.fulfillmentType}
                    {o.addressLine && (
                      <p className="text-[10px] text-ink-soft">{o.addressLine}</p>
                    )}
                  </td>
                  <td className="p-3 text-xs">
                    {o.slotLabel
                      ? new Date(o.slotLabel).toLocaleString("en-CA", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="p-3">{o.itemCount}</td>
                  <td className="p-3 font-bold">
                    {formatCents(o.total, "en")}
                  </td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                        STATUS_COLORS[o.status]
                      )}
                    >
                      {o.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-3">
                    <select
                      disabled={busy === o.id}
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="rounded-full border border-canela/30 bg-cream px-2 py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
