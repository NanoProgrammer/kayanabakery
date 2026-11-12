"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function VerifyReferral() {
  const params = useSearchParams();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/referrals/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.get("token") || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not verify");
      setStatus(data.status === "awarded" ? "verified" : data.status);
    } catch (err: any) {
      setStatus(err?.message || "Could not verify");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-bakery max-w-lg py-20 text-center">
      <h1 className="font-display text-3xl">Verify your Karyana Club email</h1>
      <p className="mt-4 text-ink-soft">
        Confirm your email to finish your referral registration. No purchase is required.
      </p>
      {!status ? (
        <button className="btn-primary mt-8" onClick={confirm} disabled={loading || !params.get("token")}>
          {loading ? "Verifying..." : "Confirm my email / Confirmar mi correo"}
        </button>
      ) : (
        <p className="mt-8 rounded-2xl border border-canela/20 p-5">
          {status === "verified" || status === "already"
            ? "Your email is verified. Your Karyana Club membership is ready. / Tu correo está verificado."
            : status === "limit"
            ? "Your email is verified. The inviting member has reached their current rewards limit."
            : status === "not_eligible"
            ? "Your email is verified. Welcome to Karyana Club!"
            : status}
        </p>
      )}
      <p className="mt-8"><a className="underline" href="/login">Go to your account / Ir a mi cuenta</a></p>
    </div>
  );
}

export default function ReferralVerifyPage() {
  return <Suspense fallback={<div className="container-bakery py-20">Loading...</div>}><VerifyReferral /></Suspense>;
}
