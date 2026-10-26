import { cancelScheduledMessage } from "@/lib/sms/twilio";

/**
 * What is left of the scheduled order messages: cancelling them.
 *
 * Checkout used to hand Twilio a "ready" text for an hour before the pickup
 * window and a "completed" text for 11 PM, and a cron moved the order's status
 * on the same guesses. The guesses were wrong often enough to matter —
 * customers were told their bread was waiting before the kitchen had started
 * it, and orders closed themselves out at 11 PM, so people got "your order is
 * complete" for bread still sitting on the shelf. One drove over for nothing.
 *
 * Nothing schedules these any more. Status changes come from the bakery in
 * Studio, and the Sanity webhook sends the message when a person makes the
 * change. This stays because orders placed before that change may still have
 * messages queued at Twilio, and those have to be callable off.
 */
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
