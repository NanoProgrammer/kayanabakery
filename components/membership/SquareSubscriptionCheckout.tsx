"use client";

import {
  CreditCard,
  PaymentForm,
} from "react-square-web-payments-sdk";

import { useState } from "react";

type Props = {
  tier: "ARTESANO" | "SELECTO" | "LEGENDARIO";
};

export function SquareSubscriptionCheckout({
  tier,
}: Props) {
  const [loading, setLoading] =
    useState(false);

  return (
    <div className="mt-6 rounded-3xl border border-canela/15 bg-cream p-6">
      <h3 className="font-display text-2xl">
        Payment
      </h3>

      <div className="mt-6">
        <PaymentForm
          applicationId={
            process.env
              .NEXT_PUBLIC_SQUARE_APP_ID!
          }
          locationId={
            process.env
              .NEXT_PUBLIC_SQUARE_LOCATION_ID!
          }
          cardTokenizeResponseReceived={async (
            tokenResult
          ) => {
            try {
              console.log(
                "TOKEN RESULT:",
                tokenResult
              );

              if (
                tokenResult.status !==
                "OK"
              ) {
                console.error(
                  tokenResult.errors
                );

                alert(
                  "Card tokenization failed"
                );

                return;
              }

              const sourceId =
                tokenResult.token;

              if (!sourceId) {
                alert(
                  "No sourceId returned"
                );

                return;
              }

              setLoading(true);

              const res = await fetch(
                "/api/membership/subscribe",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    sourceId,
                    tier,
                  }),
                }
              );

              const data =
                await res.json();

              console.log(
                "SUB RESPONSE:",
                data
              );

              if (!res.ok) {
                throw new Error(
                  data.error ||
                    "Subscription failed"
                );
              }

              window.location.href =
                "/account/membership";
            } catch (err: any) {
              console.error(err);

              alert(
                err.message ||
                  "Something went wrong"
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          <CreditCard />

          <button
            disabled={loading}
            className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : "Subscribe"}
          </button>
        </PaymentForm>
      </div>
    </div>
  );
}