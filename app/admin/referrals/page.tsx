import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { ReferralRenewalButton } from "@/components/admin/ReferralRenewalButton";

export const dynamic = "force-dynamic";

export default async function AdminReferralsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return <p>Only an administrator can approve referral renewals.</p>;
  }

  const members = await prisma.user.findMany({
    where: { referralRewardCount: { gte: 10 } },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      referralRewardCount: true,
      referralRewardLimit: true,
      referralRenewals: { select: { approvedAt: true }, orderBy: { approvedAt: "desc" }, take: 1 },
    },
  });
  const paused = members.filter((member) => member.referralRewardCount >= member.referralRewardLimit);
  return (
    <section>
      <h2 className="font-display text-2xl">Referral renewals · Citas</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Only grant another 10 rewarded referrals after you have met the member
        personally and approved their request. Each approval is recorded.
      </p>
      <div className="mt-6 space-y-3">
        {paused.length === 0 && <p>No members are waiting for renewal.</p>}
        {paused.map((member) => (
          <div key={member.id} className="rounded-2xl border border-canela/15 bg-cream p-5">
            <p className="font-semibold">{member.name || "Member"}</p>
            <p className="text-sm">{member.email}</p>
            <p className="mt-2 text-sm">
              {member.referralRewardCount} / {member.referralRewardLimit} rewarded referrals
            </p>
            <div className="mt-4"><ReferralRenewalButton userId={member.id} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}
