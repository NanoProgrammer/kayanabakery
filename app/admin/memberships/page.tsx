import { prisma } from "@/lib/prisma";
import { TIERS } from "@/lib/membership/tiers";

export const dynamic = "force-dynamic";

export default async function AdminMembershipsPage() {
  const memberships = await prisma.membership.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { startedAt: "desc" },
  });

  const byTier = memberships.reduce<Record<string, number>>((acc, m) => {
    if (m.status === "ACTIVE") {
      acc[m.tier] = (acc[m.tier] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-display text-2xl">Memberships</h2>
        <p className="text-sm text-ink-soft">
          {memberships.filter((m) => m.status === "ACTIVE").length} active
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO", "EMBAJADOR"] as const).map(
          (t) => (
            <div
              key={t}
              className="rounded-2xl border border-canela/15 bg-cream p-5"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
                {TIERS[t].name}
              </p>
              <p className="mt-2 font-display text-3xl">{byTier[t] || 0}</p>
            </div>
          )
        )}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-canela/15 bg-cream">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-canela/15 text-left text-xs uppercase tracking-widest text-ink-soft">
              <th className="p-3">Customer</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Status</th>
              <th className="p-3">Started</th>
              <th className="p-3">Renews / Ends</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr
                key={m.id}
                className="border-b border-canela/10 last:border-0"
              >
                <td className="p-3">
                  <p className="font-medium">{m.user.name ?? "—"}</p>
                  <p className="text-[10px] text-ink-soft">{m.user.email}</p>
                </td>
                <td className="p-3 font-medium">{m.tier}</td>
                <td className="p-3 text-xs">{m.status}</td>
                <td className="p-3 text-xs">
                  {m.startedAt?.toLocaleDateString("en-CA") ?? "-"}
                </td>
                <td className="p-3 text-xs">
                  {m.endsAt
                    ? `Ends ${m.endsAt.toLocaleDateString("en-CA")}`
                    : m.renewsAt
                    ? m.renewsAt.toLocaleDateString("en-CA")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
