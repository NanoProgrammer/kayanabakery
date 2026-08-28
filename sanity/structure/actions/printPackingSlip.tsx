import type { DocumentActionComponent, DocumentActionProps } from "sanity";
import { Printer } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://karyanabakery.ca";

// Kitchen packing slip (items + qty + customer note, no prices) — separate
// from just viewing the order fields in Studio. Only orders synced from the
// online checkout (they carry a prismaId) have a matching Prisma order to
// render the slip from.
export const printPackingSlipAction: DocumentActionComponent = (
  props: DocumentActionProps
) => {
  const prismaId = (props.draft ?? props.published)?.prismaId as
    | string
    | undefined;

  return {
    label: "Print packing slip",
    icon: Printer,
    onHandle: () => {
      if (!prismaId) {
        alert("This order has no linked order data yet — can't print a packing slip for it.");
        props.onComplete();
        return;
      }
      window.open(`${APP_URL}/api/orders/${prismaId}/packing-slip`, "_blank");
      props.onComplete();
    },
  };
};
