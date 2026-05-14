// app/api/membership/subscribe/route.ts

import "dotenv/config";

import { NextResponse } from "next/server";

import {
  SquareClient,
  SquareEnvironment,
} from "square";

import { randomUUID } from "crypto";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,

  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

const PLAN_IDS = {
  ARTESANO:
    process.env
      .SQUARE_PLAN_ARTESANO_VARIATION_ID!,

  SELECTO:
    process.env
      .SQUARE_PLAN_SELECTO_VARIATION_ID!,

  LEGENDARIO:
    process.env
      .SQUARE_PLAN_LEGENDARIO_VARIATION_ID!,
};

const RENEWAL_DAYS = {
  ARTESANO: 365,
  SELECTO: 30,
  LEGENDARIO: 30,
};


export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    const body = await req.json();

    const {
      sourceId,
      tier,
    } = body;

    const planVariationId =
      PLAN_IDS[
        tier as keyof typeof PLAN_IDS
      ];

    if (!planVariationId) {
      return NextResponse.json(
        { error: "Invalid tier" },
        { status: 400 }
      );
    }

    // customer

    const customer =
      await client.customers.create({
        emailAddress:
          session.user.email,

        givenName:
          session.user.name ?? undefined,
      });

    const customerId =
      customer.customer?.id;

    if (!customerId) {
      throw new Error(
        "Failed to create customer"
      );
    }

    // save card

    const card =
      await client.cards.create({
        sourceId,

        idempotencyKey:
          randomUUID(),

        card: {
          customerId,
        },
      });

    const cardId =
      card.card?.id;

    if (!cardId) {
      throw new Error(
        "Failed to save card"
      );
    }

    // create subscription

    const subscription =
      await client.subscriptions.create({
        idempotencyKey:
          randomUUID(),

        locationId:
          process.env
            .SQUARE_LOCATION_ID!,

        customerId,

        cardId,

        planVariationId,
      });

    const subscriptionId =
      subscription.subscription?.id;

    // dates

    const startedAt = new Date();

    const renewsAt = new Date();

    renewsAt.setDate(
      renewsAt.getDate() +
        RENEWAL_DAYS[
          tier as keyof typeof RENEWAL_DAYS
        ]
    );

    // update membership

    await prisma.membership.upsert({
      where: {
        userId,
      },

      update: {
        tier,

        status: "ACTIVE",

        provider: "SQUARE",

        providerSubscriptionId:
          subscriptionId,

        startedAt,

        renewsAt,

        endsAt: null,
      },

      create: {
        userId,

        tier,

        status: "ACTIVE",

        provider: "SQUARE",

        providerSubscriptionId:
          subscriptionId,

        startedAt,

        renewsAt,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err?.body ||
          err?.message ||
          "Subscription failed",
      },
      { status: 500 }
    );
  }
}
