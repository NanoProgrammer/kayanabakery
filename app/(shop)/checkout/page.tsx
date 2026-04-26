import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout · Karyana Bakery" };

export default async function CheckoutPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  let addresses: any[] = [];
  let user: any = null;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
    addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefaultShipping: "desc" }, { createdAt: "desc" }],
    });
  }

  return (
    <div className="container-bakery py-12 md:py-16">
      <header className="mb-10">
        <span className="eyebrow">Almost there</span>
        <h1 className="section-title mt-2">Checkout</h1>
      </header>
      <CheckoutForm
        user={user ? { id: user.id, email: user.email, name: user.name } : null}
        addresses={addresses}
        squareAppId={process.env.NEXT_PUBLIC_SQUARE_APP_ID || ""}
        squareLocationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || ""}
      />
    </div>
  );
}
