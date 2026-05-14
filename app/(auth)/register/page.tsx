import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="container-bakery py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-canela/15 bg-cream p-8 md:p-10">
        <h1 className="font-display text-3xl">Create your account</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Save addresses, track orders, earn points.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-canela-dark underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
