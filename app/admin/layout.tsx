import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session) redirect("/login?callbackUrl=/admin/orders");
  if (role !== "ADMIN" && role !== "STAFF") redirect("/");

  return (
    <div className="container-bakery py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-canela-dark">
          Admin Dashboard
        </p>
        <h1 className="mt-1 font-display text-3xl">Karyana Operations</h1>
      </header>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AdminNav />
        <div>{children}</div>
      </div>
    </div>
  );
}
