import { prisma } from "@/lib/prisma";
import { AmbassadorApplicationsTable } from "@/components/admin/AmbassadorApplicationsTable";

export const dynamic = "force-dynamic";

export default async function AdminAmbassadorsPage() {
  const apps = await prisma.ambassadorApplication.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true, id: true } },
    },
  });

  return (
    <div>
      <header className="mb-6">
        <h2 className="font-display text-2xl">Ambassador applications</h2>
      </header>
      <AmbassadorApplicationsTable
        applications={apps.map((a) => ({
          id: a.id,
          status: a.status,
          fullName: a.fullName,
          email: a.email,
          phone: a.phone,
          city: a.city,
          instagram: a.instagram,
          followers: a.followers,
          motivation: a.motivation,
          hasVehicle: a.hasVehicle,
          willDeliver: a.willDeliver,
          createdAt: a.createdAt.toISOString(),
          userId: a.user?.id ?? null,
        }))}
      />
    </div>
  );
}
