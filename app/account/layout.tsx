import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth/auth";
import {
  User,
  MapPin,
  Package,
  Settings,
  Gift,
  LogOut,
} from "lucide-react";

const links = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/preferences", label: "Preferences", icon: Settings },
  { href: "/account/referrals", label: "Referrals", icon: Gift },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  return (
    <div className="container-bakery py-12 md:py-16">
      <div className="mb-10">
        <span className="eyebrow">Your account</span>
        <h1 className="section-title mt-2">
          Hola,{" "}
          <span className="italic text-canela">
            {session.user.name?.split(" ")[0] || "friend"}
          </span>
          .
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-12">
        <aside className="lg:col-span-1">
          <nav className="space-y-1 rounded-2xl border border-canela/15 bg-masa/30 p-3">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-ink transition-colors hover:bg-cream"
                >
                  <Icon className="h-4 w-4 text-canela" />
                  {link.label}
                </Link>
              );
            })}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-otomi-red transition-colors hover:bg-cream"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </nav>
        </aside>

        <section className="lg:col-span-3">{children}</section>
      </div>
    </div>
  );
}
