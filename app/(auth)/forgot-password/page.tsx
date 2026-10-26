import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import Link from "next/link";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="container-bakery py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-canela/15 bg-cream p-8 md:p-10">
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/login" className="font-medium text-canela-dark underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
