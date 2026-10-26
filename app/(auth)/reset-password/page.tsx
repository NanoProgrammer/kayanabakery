import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import Link from "next/link";

export const metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <div className="container-bakery py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-canela/15 bg-cream p-8 md:p-10">
        {/* The token lives in the query string, which useSearchParams reads on
            the client — without a boundary the whole page opts out of static
            rendering and the build complains. */}
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/login" className="font-medium text-canela-dark underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
