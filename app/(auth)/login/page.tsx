import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata = { title: "Sign in · Karyana Bakery" };

export default function LoginPage() {
  return (
    <div className="container-bakery flex min-h-[70vh] items-center py-12">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-10 inline-flex flex-col items-center">
          <span className="font-display text-3xl text-canela">Karyana</span>
          <span className="font-script text-base text-otomi-red">bakery</span>
        </Link>

        <div className="rounded-3xl border border-canela/15 bg-masa/40 p-8 md:p-10">
          <h1 className="font-display text-3xl text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink/60">
            Sign in to see your orders and preferences.
          </p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-ink/60">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-canela hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
