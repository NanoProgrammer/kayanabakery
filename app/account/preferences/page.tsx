import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { PreferencesForm } from "@/components/account/PreferencesForm";

export default async function PreferencesPage() {
  const session = await auth();
  const userId = (session!.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return (
    <div>
      <h2 className="mb-8 font-display text-3xl text-ink">Preferences</h2>
      <PreferencesForm
        initial={{
          phone: user?.phone || "",
          preferences: (user?.preferences as any) || {},
        }}
      />
    </div>
  );
}
