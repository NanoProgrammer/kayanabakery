"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ReferralRenewalButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function approve() {
    if (!window.confirm("Only approve AFTER meeting this member in person. Grant 10 more rewarded referrals?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referrals/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not approve");
      toast.success("Another 10 rewarded referrals approved");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Renewal failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="btn-primary" onClick={approve} disabled={loading}>
      {loading ? "Approving..." : "Approve +10 after meeting"}
    </button>
  );
}
