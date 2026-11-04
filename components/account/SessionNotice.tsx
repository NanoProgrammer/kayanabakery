"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Info, X, LogOut } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { SIGNED_IN_NOTICE } from "@/lib/auth/signed-in-redirect";

/**
 * Says why someone who tried to open sign in or sign up ended up here.
 *
 * Those pages are now closed while a session exists, to stop one customer
 * becoming two accounts. A silent redirect, though, reads as the site being
 * broken — the person pressed "Sign up" and landed somewhere else with no
 * explanation. This is the explanation, and it carries the one button that
 * actually unblocks them: signing out.
 *
 * It is plain block content with no screen-size rules, so it shows the same
 * on a phone and on a computer. The sign-out button sends them back to the
 * page they were trying to reach.
 */
export function SessionNotice() {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const params = useSearchParams();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || params.get("notice") !== SIGNED_IN_NOTICE) return null;

  const es = locale === "es";
  const who = session?.user?.email || session?.user?.name;

  return (
    <div
      role="status"
      className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-start"
    >
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-amber-900">
          {es ? "Ya tienes la sesión abierta" : "You are already signed in"}
        </p>
        <p className="mt-1 text-sm text-amber-900">
          {who
            ? es
              ? `Esta cuenta es ${who}. Para entrar con otra cuenta o crear una nueva, primero cierra sesión.`
              : `You are signed in as ${who}. To use another account, or to create a new one, sign out first.`
            : es
            ? "Para entrar con otra cuenta o crear una nueva, primero cierra sesión."
            : "To use another account, or to create a new one, sign out first."}
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-sm font-medium text-amber-50 hover:bg-amber-800"
        >
          <LogOut className="h-3.5 w-3.5" />
          {es ? "Cerrar sesión" : "Sign out"}
        </button>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={es ? "Cerrar" : "Dismiss"}
        className="shrink-0 self-start rounded-full p-1 text-amber-900/60 hover:bg-amber-100 hover:text-amber-900"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
