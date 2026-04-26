import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { ReferralShare } from "@/components/account/ReferralShare";
import { formatPriceFromCents } from "@/lib/utils";

export default async function ReferralsPage() {
  const session = await auth();
  const userId = (session!.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      referrals: { select: { name: true, email: true, createdAt: true } },
    },
  });
  if (!user) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://karyanabakery.ca";
  const link = `${appUrl}/register?ref=${user.referralCode}`;

  return (
    <div>
      <h2 className="mb-2 font-display text-3xl text-ink">Referrals</h2>
      <p className="mb-8 text-sm text-ink/60">
        Share your link — you both get $10 off when they place their first
        order.
      </p>

      <ReferralShare link={link} code={user.referralCode} />

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
          <p className="text-xs uppercase tracking-widest text-ink/50">
            Friends referred
          </p>
          <p className="mt-2 font-display text-3xl text-canela">
            {user.referrals.length}
          </p>
        </div>
        <div className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
          <p className="text-xs uppercase tracking-widest text-ink/50">
            Credit available
          </p>
          <p className="mt-2 font-display text-3xl text-canela">
            {formatPriceFromCents(user.referralCredit)}
          </p>
        </div>
      </div>

      {user.referrals.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 font-display text-xl text-ink">
            People you&apos;ve referred
          </h3>
          <ul className="divide-y divide-canela/10 rounded-2xl border border-canela/15 bg-masa/30">
            {user.referrals.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {r.name || r.email}
                  </p>
                  <p className="text-xs text-ink/50">
                    Joined {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
