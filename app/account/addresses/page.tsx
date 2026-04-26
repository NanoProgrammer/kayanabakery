import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { AddressManager } from "@/components/account/AddressManager";

export default async function AddressesPage() {
  const session = await auth();
  const userId = (session!.user as any).id;

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="mb-8 font-display text-3xl text-ink">Saved addresses</h2>
      <AddressManager initialAddresses={addresses as any} />
    </div>
  );
}
