import { AmbassadorHero } from "@/components/ambassador/AmbassadorHero";
import { AmbassadorPerks } from "@/components/ambassador/AmbassadorPerks";
import { AmbassadorApplyForm } from "@/components/ambassador/AmbassadorApplyForm";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Become an Ambassador",
  description:
    "Join the Karyana ambassador program. Earn rewards, get paid for deliveries, and share what you love.",
};

export default async function AmbassadorPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  const existing = userId
    ? await prisma.ambassadorApplication
        .findUnique({ where: { userId } })
        .catch(() => null)
    : null;

  return (
    <>
      <AmbassadorHero />
      <AmbassadorPerks />
      <AmbassadorApplyForm
        existingStatus={existing?.status}
        defaultEmail={session?.user?.email ?? ""}
        defaultName={session?.user?.name ?? ""}
      />
    </>
  );
}
