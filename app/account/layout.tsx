import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AccountSidebar } from "@/components/account/AccountSidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  return (
    <div className="container-bakery py-12">
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <AccountSidebar />
        <main>{children}</main>
      </div>
    </div>
  );
}
