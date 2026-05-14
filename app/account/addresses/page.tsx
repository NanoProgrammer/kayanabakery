import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { AddressManager } from "@/components/account/AddressManager";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  const session = await auth();
  const userId = (session?.user as any).id;

  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <h1 className="font-display text-3xl">My addresses</h1>
      <p className="mt-1 text-ink-soft">
        Saved addresses for faster checkout.
      </p>
      <div className="mt-8">
        <AddressManager initial={addresses as any} />
      </div>
    </div>
  );
}
