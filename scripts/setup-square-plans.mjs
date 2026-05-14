// scripts/setup-square-plans.mjs
import "dotenv/config";
import { SquareClient, SquareEnvironment } from "square";
import { randomUUID } from "crypto";

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

const PLANS = [
  {
    tier: "ARTESANO",
    name: "Karyana Artesano",
    envKey: "SQUARE_PLAN_ARTESANO_VARIATION_ID",
    cadence: "ANNUAL",
    amountCents: 3900,
  },
  {
    tier: "SELECTO",
    name: "Karyana Selecto",
    envKey: "SQUARE_PLAN_SELECTO_VARIATION_ID",
    cadence: "MONTHLY",
    amountCents: 3000,
  },
  {
    tier: "LEGENDARIO",
    name: "Karyana Legendario",
    envKey: "SQUARE_PLAN_LEGENDARIO_VARIATION_ID",
    cadence: "MONTHLY",
    amountCents: 5000,
  },
];

async function createPlan(plan) {
  const response = await client.catalog.object.upsert({
    idempotencyKey: randomUUID(),

    object: {
      id: `#${plan.tier}`,
      type: "SUBSCRIPTION_PLAN",

      subscriptionPlanData: {
        name: plan.name,

        phases: [
          {
            cadence: plan.cadence,

            recurringPriceMoney: {
              amount: BigInt(plan.amountCents),
              currency: "CAD",
            },
          },
        ],
      },
    },
  });

  return response;
}

async function main() {
  console.log("🔧 Creando planes de membresía en Square...\n");

  console.log("Environment:", process.env.SQUARE_ENVIRONMENT);
  console.log(
    "Token:",
    process.env.SQUARE_ACCESS_TOKEN?.slice(0, 12) + "..."
  );

  const results = [];

  for (const plan of PLANS) {
    try {
      const response = await createPlan(plan);

      console.dir(response, { depth: null });

      const obj =
        response?.catalogObject ||
        response?.result?.catalogObject;

      const phase =
        obj?.subscriptionPlanData?.phases?.[0];

      const finalVariationId =
        phase?.uid || obj?.id;

      console.log(
        `✅ ${plan.name} creado — ID: ${finalVariationId}`
      );

      results.push({
        envKey: plan.envKey,
        id: finalVariationId,
      });
    } catch (err) {
      console.error(`\n❌ Error creando ${plan.name}\n`);

      console.dir(err, { depth: null });

      if (err?.body) {
        console.log("\nBODY:");
        console.dir(err.body, { depth: null });
      }

      if (err?.response) {
        console.log("\nRESPONSE:");
        console.dir(err.response, { depth: null });
      }

      if (err?.errors) {
        console.log("\nERRORS:");
        console.dir(err.errors, { depth: null });
      }
    }
  }

  console.log("\n📋 Agrega esto a tu .env:\n");

  for (const r of results) {
    console.log(`${r.envKey}=${r.id}`);
  }
}

main().catch((err) => {
  console.error("\n🔥 Fatal Error:\n");
  console.dir(err, { depth: null });
});