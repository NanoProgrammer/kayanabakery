"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Instagram, Phone, MapPin, Car } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type App = {
  id: string;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  instagram: string | null;
  followers: number | null;
  motivation: string;
  hasVehicle: boolean;
  willDeliver: boolean;
  createdAt: string;
  userId: string | null;
};

export function AmbassadorApplicationsTable({
  applications,
}: {
  applications: App[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("PENDING");

  const filtered = filter
    ? applications.filter((a) => a.status === filter)
    : applications;

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/ambassador-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Application ${status.toLowerCase()}`);
      router.refresh();
    } catch {
      toast.error("Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        {["PENDING", "APPROVED", "REJECTED", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium",
              filter === s
                ? "border-canela bg-canela"
                : "border-canela/30 bg-cream"
            )}
          >
            {s || "ALL"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-cream p-8 text-center text-sm text-ink-soft">
          No applications.
        </p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="rounded-3xl border border-canela/15 bg-cream p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display text-xl">{a.fullName}</p>
                  <p className="text-sm text-ink-soft">{a.email}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {a.phone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {a.city}
                    </span>
                    {a.instagram && (
                      <span className="inline-flex items-center gap-1">
                        <Instagram className="h-3 w-3" />@{a.instagram}{" "}
                        {a.followers && `(${a.followers.toLocaleString()})`}
                      </span>
                    )}
                    {a.hasVehicle && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-canela-light px-2 py-0.5">
                        <Car className="h-3 w-3" />
                        Vehicle
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                    a.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : a.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {a.status}
                </span>
              </div>

              <div className="mt-4 rounded-2xl bg-canela-light/40 p-4">
                <p className="text-xs uppercase tracking-widest text-ink-soft">
                  Why ambassador?
                </p>
                <p className="mt-1 whitespace-pre-line text-sm">
                  {a.motivation}
                </p>
              </div>

              {a.status === "PENDING" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => decide(a.id, "APPROVED")}
                    disabled={busy === a.id || !a.userId}
                    className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-4 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </button>
                  <button
                    onClick={() => decide(a.id, "REJECTED")}
                    disabled={busy === a.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </button>
                  {!a.userId && (
                    <p className="text-xs text-yellow-700">
                      ⚠ Applicant has no user account — they must register first
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
