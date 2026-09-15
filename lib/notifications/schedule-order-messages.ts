import { scheduleMessage, cancelScheduledMessage } from "@/lib/sms/twilio";
import {
  orderStatusMessage,
  resolveCustomerLocale,
  type Locale,
} from "@/lib/notifications/order-messages";
import {
  fulfillmentStart,
  READY_LEAD_MS,
  CLOSING_HOUR,
  type AutomatableOrder,
} from "@/lib/orders/auto-status";
import { bakeryHourOnSameDay } from "@/lib/time/edmonton";

/**
 * Hands both customer notifications to Twilio at checkout, to be delivered at
 * their own times — so nothing has to poll for the moment to send them.
 *
 * Anything this can't schedule (no phone, no schedule on the order, a window
 * less than 15 minutes away, or a date past Twilio's scheduling horizon)
 * returns a null SID, which is the signal for the status cron to send that
 * message itself instead. That way the two paths cover each other rather than
 * both firing and double-texting the customer.
 */

/** Conservative default; Twilio's own limit is longer, but pickup dates can
 *  be up to two weeks out and a rejected schedule is worse than a cron send. */
const MAX_SCHEDULE_DAYS = Number(process.env.TWILIO_MAX_SCHEDULE_DAYS ?? "7");

export type ScheduledSids = {
  readyMsgSid: string | null;
  completedMsgSid: string | null;
};

export type SchedulableOrder = AutomatableOrder & {
  orderNumber: string;
  phone: string | null;
  customerName: string | null;
  preferredLang: string | null;
};

function withinHorizon(sendAt: Date): boolean {
  const days = (sendAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
  return days <= MAX_SCHEDULE_DAYS;
}

async function trySchedule(
  to: string,
  body: string,
  sendAt: Date,
  contentSid: string | null,
  locale: Locale,
  orderNumber: string
): Promise<string | null> {
  if (sendAt.getTime() <= Date.now() || !withinHorizon(sendAt)) return null;

  try {
    return await scheduleMessage({
      to,
      body,
      sendAt,
      contentSid,
      contentVariables: contentSid ? { "1": orderNumber } : undefined,
    });
  } catch (err) {
    console.error(
      `[schedule] could not schedule message for ${orderNumber} (${locale}):`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export async function scheduleOrderNotifications(
  order: SchedulableOrder
): Promise<ScheduledSids> {
  const none: ScheduledSids = { readyMsgSid: null, completedMsgSid: null };

  if (!order.phone) return none;

  const start = fulfillmentStart(order);
  if (!start) return none;

  const locale = resolveCustomerLocale({
    preferredLang: order.preferredLang,
    name: order.customerName,
  });
  const isPickup = order.fulfillmentType !== "DELIVERY";

  const readyAt = new Date(start.getTime() - READY_LEAD_MS);
  const completedAt = bakeryHourOnSameDay(start, CLOSING_HOUR);

  const readyMsgSid = await trySchedule(
    order.phone,
    orderStatusMessage("READY", locale, {
      orderNumber: order.orderNumber,
      isPickup,
    }),
    readyAt,
    process.env.TWILIO_CONTENT_SID_READY ?? null,
    locale,
    order.orderNumber
  );

  const completedMsgSid = await trySchedule(
    order.phone,
    orderStatusMessage("COMPLETED", locale, {
      orderNumber: order.orderNumber,
      isPickup,
    }),
    completedAt,
    process.env.TWILIO_CONTENT_SID_COMPLETED ?? null,
    locale,
    order.orderNumber
  );

  return { readyMsgSid, completedMsgSid };
}

/** Called when an order is cancelled, so its pending messages never go out. */
export async function cancelOrderNotifications(sids: {
  readyMsgSid?: string | null;
  completedMsgSid?: string | null;
}): Promise<void> {
  for (const sid of [sids.readyMsgSid, sids.completedMsgSid]) {
    if (!sid) continue;
    try {
      await cancelScheduledMessage(sid);
    } catch (err) {
      console.warn(
        `[schedule] cancel failed for ${sid}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}
