import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata = { title: "Create account · Karyana Bakery" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;

  return (
    <div className="container-bakery flex min-h-[70vh] items-center py-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-10 inline-flex flex-col items-center">
          <span className="font-display text-3xl text-canela">Karyana</span>
          <span className="font-script text-base text-otomi-red">bakery</span>
        </Link>

        <div className="rounded-3xl border border-canela/15 bg-masa/40 p-8 md:p-10">
          <h1 className="font-display text-3xl text-ink">Create your account</h1>
          <p className="mt-2 text-sm text-ink/60">
            Track orders, save addresses, and earn referral credit.
          </p>
          {ref && (
            <p className="mt-3 rounded-full bg-otomi-yellow/30 px-4 py-1.5 text-xs font-medium text-ink">
              ✨ $10 welcome credit applied
            </p>
          )}

          <div className="mt-8">
            <RegisterForm referralCode={ref} />
          </div>

          <p className="mt-6 text-center text-sm text-ink/60">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-canela hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
