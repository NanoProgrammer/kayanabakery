"use client";

import { useState } from "react";

export function ReferralVerificationReminder() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function resend() {
    setState("sending");
    try {
      const response = await fetch("/api/referrals/resend", { method: "POST" });
      if (!response.ok) throw new Error("Unable to send");
      setState("sent");
    } catch {
      setState("error");
    }
  }
  return (
    <div className="rounded-2xl border border-canela/30 bg-cream p-5">
      <p className="font-semibold">Verifica tu email / Verify your email</p>
      <p className="mt-2 text-sm">
        Check your inbox for the Karyana Club referral confirmation link. You do
        not need to place an order. Revisa tu correo para confirmar tu registro.
      </p>
      <button className="btn-ghost mt-3" type="button" onClick={resend} disabled={state === "sending" || state === "sent"}>
        {state === "sending" ? "Sending..." : state === "sent" ? "Email sent / Correo enviado" : "Resend verification / Reenviar correo"}
      </button>
      {state === "error" && <p className="mt-2 text-sm text-red-600">Could not send. Try again later.</p>}
    </div>
  );
}
