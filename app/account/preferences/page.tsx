import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { PreferencesForm } from "@/components/account/PreferencesForm";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
  const session = await auth();
  const userId = (session?.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      birthday: true,
      preferredLang: true,
    },
  });

  if (!user) return null;

  return (
    <div>
      <h1 className="font-display text-3xl">Preferences</h1>
      <p className="mt-1 text-ink-soft">
        Update your contact info and language.
      </p>
      <div className="mt-8">
        <PreferencesForm
          initial={{
            name: user.name ?? "",
            email: user.email,
            phone: user.phone ?? "",
            birthday: user.birthday
              ? user.birthday.toISOString().slice(0, 10)
              : "",
            preferredLang: (user.preferredLang ?? "en") as "en" | "es",
          }}
        />
      </div>
    </div>
  );
}
