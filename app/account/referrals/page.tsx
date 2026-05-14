import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { ReferralShare } from "@/components/home/ReferralShare";

export const dynamic = "force-dynamic";

export default async function ReferralsAccountPage() {
  const session = await auth();
  const userId = (session?.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralCode: true,
      referralCredit: true,
      referrals: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          firstOrderCompleted: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return null;

  return (
    <div>
      <h1 className="font-display text-3xl">Refer & earn</h1>
      <p className="mt-1 text-ink-soft">
        Share Karyana, both get $10 when they order.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Friends referred" value={user.referrals.length} />
        <Stat
          label="Completed first order"
          value={user.referrals.filter((r) => r.firstOrderCompleted).length}
        />
        <Stat label="Credit earned" value={`$${user.referralCredit ?? 0}`} />
      </div>

      {user.referralCode && (
        <div className="mt-8">
          <ReferralShare code={user.referralCode} />
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl">Your referrals</h2>
        {user.referrals.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">
            No referrals yet. Share your code to start earning.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {user.referrals.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between rounded-2xl border border-canela/15 bg-cream p-4 text-sm"
              >
                <div>
                  <p className="font-medium">{r.name ?? "Friend"}</p>
                  <p className="text-xs text-ink-soft">
                    Joined {r.createdAt.toLocaleDateString("en-CA")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                    r.firstOrderCompleted
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {r.firstOrderCompleted ? "+ $10 earned" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-canela/15 bg-cream p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}
