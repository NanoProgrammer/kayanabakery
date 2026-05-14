import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await auth();
  const userId = (session?.user as any)?.id;

  let user: any = null;
  let addresses: any[] = [];

  if (userId) {
    [user, addresses] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          pointsBalance: true,
          orders: {
            where: {
              fulfillmentType: "DELIVERY",
              status: { not: "CANCELLED" },
            },
            select: { id: true },
            take: 1,
          },
          membership: { select: { tier: true, status: true } },
        },
      }),
      prisma.address.findMany({
        where: { userId },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      }),
    ]);
  }

  return (
    <CheckoutForm
      user={
        user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              pointsBalance: user.pointsBalance ?? 0,
              tier:
                user.membership?.status === "ACTIVE"
                  ? (user.membership.tier as any)
                  : "BASICO",
              hasUsedFirstFreeDelivery: (user.orders?.length ?? 0) > 0,
            }
          : null
      }
      addresses={addresses ?? []}
    />
  );
}