import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function POST(req: Request) {
  try {
    const { code, subtotalCents } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 404 });
    }

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      return NextResponse.json({ error: "Coupon is not active yet" }, { status: 404 });
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 404 });
    }
    if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
      return NextResponse.json({ error: "Coupon has reached its usage limit" }, { status: 404 });
    }
    if (coupon.minOrderCents && subtotalCents < coupon.minOrderCents) {
      return NextResponse.json(
        { error: `Minimum order of $${(coupon.minOrderCents / 100).toFixed(2)} required` },
        { status: 422 }
      );
    }

    // Per-user limit check (only for logged-in users)
    const session = await auth();
    if (session?.user?.id && coupon.maxPerUser > 0) {
      const used = await prisma.couponRedemption.count({
        where: { couponId: coupon.id, userId: session.user.id },
      });
      if (used >= coupon.maxPerUser) {
        return NextResponse.json({ error: "You have already used this coupon" }, { status: 422 });
      }
    }

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderCents: coupon.minOrderCents,
        description: coupon.description,
      },
    });
  } catch (err: any) {
    console.error("[coupon/validate]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
