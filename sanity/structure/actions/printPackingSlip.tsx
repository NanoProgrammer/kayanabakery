import type { DocumentActionComponent, DocumentActionProps } from "sanity";
import { Printer } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://karyanabakery.ca";

// Kitchen packing slip (items + qty + customer note, no prices) — separate
// from just viewing the order fields in Studio. Reads straight from the
// Sanity document, so this works for orders synced from the online
// checkout AND orders created by hand in Studio (which have no Prisma
// record at all).
export const printPackingSlipAction: DocumentActionComponent = (
  props: DocumentActionProps
) => {
  const docId = (props.draft ?? props.published)?._id as string | undefined;

  return {
    label: "Print packing slip",
    icon: Printer,
    onHandle: () => {
      if (!docId) {
        alert("Save this order before printing a packing slip for it.");
        props.onComplete();
        return;
      }
      const cleanId = docId.replace(/^drafts\./, "");
      window.open(`${APP_URL}/api/orders/${cleanId}/packing-slip`, "_blank");
      props.onComplete();
    },
  };
};
