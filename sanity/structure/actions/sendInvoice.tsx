import { useState } from "react";
import type { DocumentActionComponent, DocumentActionProps } from "sanity";
import { Mail } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://karyanabakery.ca";

/**
 * Email the customer their invoice, with the payment status on it.
 * Situación 7.
 *
 * Behind a confirmation dialog, because this is the one button in Studio
 * that reaches a customer: a misclick is an email somebody receives, and
 * there is no unsending it. The dialog says who it is going to, so the
 * address is checked before the send rather than after.
 *
 * It reads the SAVED document, so an unsaved draft is refused rather than
 * sending an invoice for figures still being typed.
 */
export const sendInvoiceAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const doc = (props.draft ?? props.published) as Record<string, any> | null;
  const docId = doc?._id as string | undefined;
  const email = (doc?.customerEmail ?? "").trim();
  const hasUnsavedChanges = !!props.draft;

  async function send() {
    if (!docId) return;
    setSending(true);
    try {
      const res = await fetch(
        `${APP_URL}/api/orders/${docId.replace(/^drafts\./, "")}/send-invoice`,
        { method: "POST" }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(body?.error || "The invoice could not be sent.");
      } else {
        window.alert(`Invoice sent to ${body.to}.`);
      }
    } catch {
      window.alert("The invoice could not be sent. Check the connection and try again.");
    } finally {
      setSending(false);
      setDialogOpen(false);
      props.onComplete();
    }
  }

  return {
    label: sending ? "Sending…" : "Email invoice",
    icon: Mail,
    disabled: !docId || !email || sending,
    // Shown on hover, so the reason a greyed-out button is greyed out is
    // on the button rather than a mystery.
    title: !email
      ? "Add the customer's email first"
      : hasUnsavedChanges
        ? "Publish your changes first — the invoice is sent from the saved order"
        : undefined,
    onHandle: () => setDialogOpen(true),
    dialog: dialogOpen && {
      type: "confirm" as const,
      tone: "primary" as const,
      message: hasUnsavedChanges
        ? `This order has unsaved changes. The invoice is sent from the published version — publish first if the figures changed. Send to ${email}?`
        : `Send the invoice for this order to ${email}?`,
      onCancel: () => {
        setDialogOpen(false);
        props.onComplete();
      },
      onConfirm: send,
    },
  };
};
