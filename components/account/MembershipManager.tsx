"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";
import type { MembershipTier } from "@/lib/membership/tiers";

export function MembershipManager({
  currentTier,
  isActive,
}: {
  currentTier: MembershipTier;
  isActive: boolean;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const [busy, setBusy] = useState(false);

  function startSubscription(tier: MembershipTier) {
    // Don't call the API directly — that endpoint needs a sourceId from a card.
    // Instead, redirect to the checkout page where the user enters their card.
    router.push(`/membership/checkout?tier=${tier}`);
  }

  async function cancel() {
    if (
      !confirm(
        locale === "es"
          ? "¿Cancelar tu membresía? Mantienes los beneficios hasta el final del periodo."
          : "Cancel your membership? You'll keep benefits until the period ends."
      )
    ) {
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/membership/cancel", {
  method: "DELETE",
});

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      toast.success(
        locale === "es"
          ? "Membresía cancelada"
          : "Membership cancelled"
      );

      window.location.reload();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (currentTier === "EMBAJADOR") {
    return (
      <p className="mt-6 text-xs text-ink-soft">
        {locale === "es"
          ? "El programa de Embajador es por aplicación."
          : "Ambassador program is by application."}
      </p>
    );
  }

  const ALL_PAID_TIERS: MembershipTier[] = ["ARTESANO", "SELECTO", "LEGENDARIO"];
  const otherTiers = ALL_PAID_TIERS.filter((t) => t !== currentTier);
  const tierLabel: Record<MembershipTier, string> = {
    BASICO: "Básico",
    ARTESANO: "Artesano",
    SELECTO: "Selecto",
    LEGENDARIO: "Legendario",
    EMBAJADOR: "Embajador",
  };

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-3">
        {otherTiers.map((t) => (
          <button
            key={t}
            onClick={() => startSubscription(t)}
            disabled={busy}
            className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white"
          >
            {isActive
              ? locale === "es"
                ? `Cambiar a ${tierLabel[t]}`
                : `Switch to ${tierLabel[t]}`
              : tierLabel[t]}
          </button>
        ))}
      </div>

      {isActive && currentTier !== "BASICO" && (
        <p className="text-xs text-ink-soft">
          {locale === "es"
            ? "Cambiar de plan se cobra de inmediato al nuevo precio — no necesitas cancelar primero."
            : "Switching plans charges the new price right away — no need to cancel first."}
        </p>
      )}

      {isActive && (
        <button
          onClick={cancel}
          disabled={busy}
          className="rounded-full border border-red-300 bg-red-50 px-5 py-2 text-sm font-medium text-red-700"
        >
          {busy
            ? "..."
            : locale === "es"
            ? "Cancelar membresía"
            : "Cancel membership"}
        </button>
      )}
    </div>
  );
}