import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { Gift, Copy, Mail, MessageCircle } from "lucide-react";
import { ReferralShare } from "@/components/account/ReferralShare";

export const metadata = { title: "Refer a Friend · Karyana Bakery" };

export default async function ReferPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  let user = null;
  let referralCount = 0;
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { referrals: true } } },
    });
    referralCount = user?._count?.referrals ?? 0;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://karyanabakery.ca";
  const referralLink = user
    ? `${appUrl}/register?ref=${user.referralCode}`
    : `${appUrl}/register`;

  return (
    <>
      <section className="relative overflow-hidden bg-canela text-cream">
        <div className="grain absolute inset-0" />
        <div className="container-bakery relative py-20 text-center md:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest">
            <Gift className="h-3.5 w-3.5" /> Refer a friend
          </div>
          <h1 className="font-display text-[length:var(--text-display-lg)] leading-[var(--text-display-lg--line-height)] tracking-[var(--text-display-lg--letter-spacing)]">
            <span className="font-script text-otomi-yellow">
              &ldquo;Las penas con pan
            </span>
            <br />
            <span className="italic">son menos.&rdquo;</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-cream/80">
            Share Karyana with a friend. When they place their first order,
            you both get{" "}
            <span className="font-semibold text-otomi-yellow">$10 off</span>.
            Because good pan dulce is meant to be shared.
          </p>
        </div>
      </section>

      <section className="container-bakery py-16 md:py-20">
        {user ? (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-14">
            <div className="lg:col-span-2">
              <h2 className="font-display text-3xl text-ink">
                Your sharing link
              </h2>
              <p className="mt-2 text-sm text-ink/60">
                Drop it in a text, an email, or anywhere you connect with
                friends.
              </p>

              <ReferralShare link={referralLink} code={user.referralCode} />

              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <ShareMethod
                  icon={Copy}
                  label="Copy link"
                  description="Paste anywhere"
                />
                <ShareMethod
                  icon={Mail}
                  label="Send via email"
                  description="One-click share"
                />
                <ShareMethod
                  icon={MessageCircle}
                  label="Share in chat"
                  description="WhatsApp, iMessage"
                />
              </div>
            </div>

            <aside className="rounded-3xl border border-canela/15 bg-masa/40 p-8 lg:sticky lg:top-28 lg:h-fit">
              <h3 className="font-display text-2xl text-ink">Your stats</h3>
              <div className="mt-6 space-y-5">
                <Stat label="Friends referred" value={referralCount} />
                <Stat
                  label="Credit available"
                  value={`$${((user.referralCredit ?? 0) / 100).toFixed(2)}`}
                />
              </div>
              <Link
                href="/shop"
                className="mt-8 block rounded-full bg-canela px-5 py-3 text-center text-sm text-cream"
              >
                Use credit in the shop
              </Link>
            </aside>
          </div>
        ) : (
          <div className="mx-auto max-w-xl rounded-3xl border border-canela/15 bg-masa/40 p-10 text-center">
            <h2 className="font-display text-3xl text-ink">
              Create an account to get your link
            </h2>
            <p className="mt-3 text-ink/70">
              Sign in and we&apos;ll generate a unique referral code just for
              you.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/register" className="btn-primary">
                Create account
              </Link>
              <Link href="/login" className="btn-ghost">
                Sign in
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="bg-masa/60 py-20">
        <div className="container-bakery">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {[
              { num: "01", title: "Share your link", text: "Send it to a friend." },
              { num: "02", title: "They order", text: "They get $10 off their first order." },
              { num: "03", title: "You earn", text: "You receive $10 credit. Everybody wins." },
            ].map((s) => (
              <div key={s.num} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-canela/30 font-display text-xl text-canela">
                  {s.num}
                </div>
                <h3 className="font-display text-xl text-ink">{s.title}</h3>
                <p className="mt-2 text-sm text-ink/70">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-ink/50">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl text-canela">{value}</div>
    </div>
  );
}

function ShareMethod({
  icon: Icon,
  label,
  description,
}: {
  icon: any;
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-canela/15 bg-cream p-5">
      <Icon className="h-5 w-5 text-canela" />
      <div className="mt-3 font-display text-base text-ink">{label}</div>
      <div className="mt-1 text-xs text-ink/60">{description}</div>
    </div>
  );
}
