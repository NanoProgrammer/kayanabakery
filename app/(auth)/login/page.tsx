import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="container-bakery py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-canela/15 bg-cream p-8 md:p-10">
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sign in to continue.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-ink-soft">
          New here?{" "}
          <Link href="/register" className="font-medium text-canela-dark underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
