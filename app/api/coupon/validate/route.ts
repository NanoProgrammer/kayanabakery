import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const COUPON_QUERY = `*[_type == "coupon" && code == $code][0]{
  code, discountType, discountValue,
  minOrderDollars, maxUses, perUserLimit,
  startsAt, expiresAt, active, appliesTo, membershipOnly,
  labelEn, labelEs
}`;

export async function POST(req: Request) {
  try {
    const { code, subtotalCents } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
    }

    const coupon = await client.fetch(COUPON_QUERY, {
      code: code.trim().toUpperCase(),
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Invalid or expired coupon" }, { status: 404 });
    }

    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      return NextResponse.json({ error: "Coupon is not active yet" }, { status: 404 });
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return NextResponse.json({ error: "Coupon has expired" }, { status: 404 });
    }

    const minOrderCents = coupon.minOrderDollars
      ? Math.round(coupon.minOrderDollars * 100)
      : null;

    if (minOrderCents && subtotalCents < minOrderCents) {
      return NextResponse.json(
        { error: `Minimum order of $${coupon.minOrderDollars.toFixed(2)} required` },
        { status: 422 }
      );
    }

    // Per-user limit check (logged-in users only, uses Prisma redemption log)
    const session = await auth();
    if (session?.user?.id && coupon.perUserLimit > 0) {
      // Find coupon in DB by code to count redemptions
      const dbCoupon = await prisma.coupon.findUnique({ where: { code: coupon.code } });
      if (dbCoupon) {
        const used = await prisma.couponRedemption.count({
          where: { couponId: dbCoupon.id, userId: session.user.id },
        });
        if (used >= coupon.perUserLimit) {
          return NextResponse.json(
            { error: "You have already used this coupon" },
            { status: 422 }
          );
        }
      }
    }

    // Normalize discountValue: FREE_SHIPPING has no meaningful value, FIXED is in dollars → cents
    const discountValue =
      coupon.discountType === "FIXED"
        ? Math.round((coupon.discountValue ?? 0) * 100)
        : coupon.discountValue ?? 0;

    return NextResponse.json({
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue,
        minOrderCents,
        description: coupon.labelEn ?? null,
      },
    });
  } catch (err: any) {
    console.error("[coupon/validate]", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
