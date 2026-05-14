import { prisma } from "@/lib/prisma";
import { MembersTable } from "@/components/admin/MembersTable";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      membership: { select: { tier: true, status: true } },
      _count: { select: { orders: true } },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-display text-2xl">Customers</h2>
        <p className="text-sm text-ink-soft">{users.length} total</p>
      </header>
      <MembersTable
        users={users.map((u) => ({
          id: u.id,
          name: u.name ?? "",
          email: u.email,
          phone: u.phone ?? "",
          role: u.role,
          tier:
            u.membership?.status === "ACTIVE"
              ? u.membership.tier
              : "BASICO",
          pointsBalance: u.pointsBalance,
          orderCount: u._count.orders,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
