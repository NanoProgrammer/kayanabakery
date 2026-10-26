"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n/locale-provider";
import { SquarePaymentForm } from "@/components/checkout/SquarePaymentForm";

/**
 * Replacing the card a membership renews on.
 *
 * A declined renewal used to be a dead end: the member was told their benefits
 * had stopped and there was nothing on the site that let them fix it. When the
 * membership is behind, saving a card charges it straight away, so they are a
 * member again before they close the tab.
 */
export function UpdateCard({
  behind,
  priceCents,
}: {
  /** The membership is past due, so saving a card also pays what is owed. */
  behind: boolean;
  priceCents: number;
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(behind);
  const [done, setDone] = useState(false);

  async function save(token: string) {
    try {
      const res = await fetch("/api/membership/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: token }),
      });

      // A failure here can arrive with no body at all; never call .json() blind.
      const body = await res.text();
      let data: any = null;
      try {
        data = body ? JSON.parse(body) : null;
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        toast.error(
          data?.error ??
            (locale === "es"
              ? "No pudimos guardar la tarjeta. Intenta con otra."
              : "We couldn't save that card. Try another one.")
        );
        return;
      }

      setDone(true);
      toast.success(
        data.charged
          ? locale === "es"
            ? "Listo — tu membresía está al día"
            : "Done — your membership is up to date"
          : locale === "es"
          ? "Tarjeta actualizada"
          : "Card updated"
      );
      // The banner, the plan and the renewal date all come from the server.
      window.location.reload();
    } catch {
      toast.error(
        locale === "es" ? "Algo salió mal. Intenta de nuevo." : "Something went wrong. Try again."
      );
    }
  }

  if (done) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full border border-canela/40 px-5 py-2 text-sm font-medium"
      >
        {locale === "es" ? "Cambiar tarjeta" : "Change card"}
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-canela/30 bg-cream p-4">
      <p className="text-sm font-bold">
        {behind
          ? locale === "es"
            ? "Actualiza tu tarjeta para seguir con tu membresía"
            : "Update your card to keep your membership"
          : locale === "es"
          ? "Cambiar la tarjeta de tu membresía"
          : "Change your membership card"}
      </p>
      {behind && (
        <p className="mt-1 text-sm text-ink-soft">
          {locale === "es"
            ? `Se cobrarán $${(priceCents / 100).toFixed(2)} al guardarla.`
            : `$${(priceCents / 100).toFixed(2)} will be charged when you save it.`}
        </p>
      )}
      <div className="mt-3">
        <SquarePaymentForm
          totalCents={priceCents}
          onTokenReady={save}
          label={
            behind
              ? locale === "es"
                ? `Pagar $${(priceCents / 100).toFixed(2)} y reactivar`
                : `Pay $${(priceCents / 100).toFixed(2)} and reactivate`
              : locale === "es"
              ? "Guardar tarjeta"
              : "Save card"
          }
        />
      </div>
      <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-ink-soft">
        {locale === "es"
          ? "Square · encriptado · no guardamos los datos de tu tarjeta"
          : "Square · encrypted · we never store your card details"}
      </p>
    </div>
  );
}
