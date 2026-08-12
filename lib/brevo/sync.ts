/**
 * Brevo sync helpers — high-level functions for common sync events
 *
 * All functions are fire-and-forget (they log errors but don't throw).
 * This prevents Brevo failures from breaking your checkout/registration.
 */

import {
  upsertContact,
  updateContactAttributes,
  addToList,
  removeFromList,
} from "./client";

// ─── List IDs from env ───────────────────────────────────

function getNewsletterListId(): number {
  const id = process.env.BREVO_LIST_ID;
  if (!id) throw new Error("Missing BREVO_LIST_ID");
  return parseInt(id, 10);
}

function getMembersListId(): number | null {
  const id = process.env.BREVO_MEMBERS_LIST_ID;
  return id ? parseInt(id, 10) : null;
}

// Optional lists that back Brevo Automation workflows. Each is a
// "contact entered this list" trigger — the most reliable way to fire
// a Brevo Automation step without needing the newer Events API.
// Unset any of these and the corresponding sync becomes a no-op.
function optionalListId(envVar: string): number | null {
  const id = process.env[envVar];
  return id ? parseInt(id, 10) : null;
}

// ─── Newsletter ──────────────────────────────────────────

/**
 * Someone subscribed to the newsletter (no account needed).
 */
export async function syncNewsletterSubscribe(email: string, language = "en") {
  try {
    await upsertContact({
      email,
      attributes: {
        LANGUAGE: language,
        SOURCE: "NEWSLETTER",
        NEWSLETTER: true,
      },
      listIds: [getNewsletterListId()],
      updateEnabled: true,
    });
    console.log(`[brevo] newsletter subscribed: ${email}`);
  } catch (err: any) {
    console.error("[brevo] newsletter sync failed:", err.message);
  }
}

// ─── User Registration ───────────────────────────────────

/**
 * A new user created an account.
 */
export async function syncUserRegistered({
  email,
  name,
  language = "en",
}: {
  email: string;
  name?: string | null;
  language?: string;
}) {
  try {
    const [firstName, ...rest] = (name ?? "").split(" ");
    const lastName = rest.join(" ");

    const welcomeListId = optionalListId("BREVO_WELCOME_LIST_ID");

    await upsertContact({
      email,
      attributes: {
        FIRSTNAME: firstName || "",
        LASTNAME: lastName || "",
        LANGUAGE: language,
        SOURCE: "REGISTRATION",
        MEMBERSHIP_TIER: "BASICO",
        TOTAL_ORDERS: 0,
        REGISTERED: true,
      },
      listIds: [getNewsletterListId(), ...(welcomeListId ? [welcomeListId] : [])],
      updateEnabled: true,
    });
    console.log(`[brevo] user registered: ${email} (lang=${language})`);
  } catch (err: any) {
    console.error("[brevo] registration sync failed:", err.message);
  }
}

// ─── Membership ──────────────────────────────────────────

/**
 * User's membership tier changed.
 */
export async function syncMembershipChange({
  email,
  tier,
  status,
  language,
}: {
  email: string;
  tier: string;
  status: string;
  language?: string;
}) {
  try {
    await updateContactAttributes(email, {
      MEMBERSHIP_TIER: tier,
      MEMBERSHIP_STATUS: status,
      ...(language ? { LANGUAGE: language } : {}),
    });

    // Add to members list if active, remove if cancelled
    const membersListId = getMembersListId();
    if (membersListId) {
      if (status === "ACTIVE" && tier !== "BASICO") {
        await addToList(email, membersListId);
      } else if (status === "CANCELED" || status === "EXPIRED") {
        await removeFromList(email, membersListId);
      }
    }

    // Paid, active members are eligible for the "programs" promo campaign —
    // segment by LANGUAGE inside Brevo when building that campaign/workflow.
    const promoListId = optionalListId("BREVO_PROGRAMS_PROMO_LIST_ID");
    if (promoListId) {
      if (status === "ACTIVE" && tier !== "BASICO") {
        await addToList(email, promoListId);
      } else {
        await removeFromList(email, promoListId);
      }
    }

    console.log(`[brevo] membership updated: ${email} → ${tier} (${status})`);
  } catch (err: any) {
    console.error("[brevo] membership sync failed:", err.message);
  }
}

// ─── Order ───────────────────────────────────────────────

/**
 * A user completed an order. Updates their stats in Brevo.
 */
export async function syncOrderCompleted({
  email,
  name,
  totalOrders,
  totalSpentCents,
  lastOrderDate,
  language,
}: {
  email: string;
  name?: string | null;
  totalOrders: number;
  totalSpentCents: number;
  lastOrderDate: string; // ISO date
  language?: string;
}) {
  try {
    const attrs: Record<string, string | number> = {
      TOTAL_ORDERS: totalOrders,
      TOTAL_SPENT: Math.round(totalSpentCents / 100),
      LAST_ORDER_DATE: lastOrderDate.split("T")[0], // YYYY-MM-DD
      ...(language ? { LANGUAGE: language } : {}),
    };

    if (name) {
      const [firstName, ...rest] = name.split(" ");
      attrs.FIRSTNAME = firstName;
      if (rest.length) attrs.LASTNAME = rest.join(" ");
    }

    await updateContactAttributes(email, attrs);
    console.log(`[brevo] order synced: ${email} (${totalOrders} orders)`);
  } catch (err: any) {
    console.error("[brevo] order sync failed:", err.message);
  }
}

// ─── Guest checkout ──────────────────────────────────────

/**
 * A guest (no account) placed an order. Create them in Brevo.
 */
export async function syncGuestOrder({
  email,
  name,
  phone,
  totalCents,
  language,
}: {
  email: string;
  name?: string | null;
  phone?: string | null;
  totalCents: number;
  language?: string;
}) {
  try {
    const [firstName, ...rest] = (name ?? "").split(" ");

    await upsertContact({
      email,
      attributes: {
        FIRSTNAME: firstName || "",
        LASTNAME: rest.join(" ") || "",
        ...(phone ? { SMS: phone } : {}),
        ...(language ? { LANGUAGE: language } : {}),
        SOURCE: "GUEST_ORDER",
        TOTAL_ORDERS: 1,
        TOTAL_SPENT: Math.round(totalCents / 100),
        LAST_ORDER_DATE: new Date().toISOString().split("T")[0],
      },
      listIds: [getNewsletterListId()],
      updateEnabled: true,
    });
    console.log(`[brevo] guest order synced: ${email}`);
  } catch (err: any) {
    console.error("[brevo] guest sync failed:", err.message);
  }
}

// ─── Weekly Auto-Delivery toggle ──────────────────────────

/**
 * Fires whenever a Selecto/Legendario member flips their
 * "Auto Weekly Bread Delivery" toggle. Moves the contact into one of
 * two lists (ON / OFF) so a Brevo Automation "contact entered this
 * list" trigger fires the matching email every time — build one
 * workflow per list, with a LANGUAGE condition split inside it for
 * the ES/EN copy.
 */
export async function syncWeeklyAutoDeliveryToggle({
  email,
  name,
  enabled,
  language,
}: {
  email: string;
  name?: string | null;
  enabled: boolean;
  language?: string;
}) {
  try {
    const [firstName, ...rest] = (name ?? "").split(" ");

    await updateContactAttributes(email, {
      FIRSTNAME: firstName || "",
      LASTNAME: rest.join(" ") || "",
      ...(language ? { LANGUAGE: language } : {}),
      WEEKLY_AUTO_DELIVERY: enabled ? "ON" : "OFF",
      WEEKLY_TOGGLE_UPDATED_AT: new Date().toISOString().split("T")[0],
    });

    const onListId = optionalListId("BREVO_TOGGLE_ON_LIST_ID");
    const offListId = optionalListId("BREVO_TOGGLE_OFF_LIST_ID");

    if (enabled) {
      if (onListId) await addToList(email, onListId);
      if (offListId) await removeFromList(email, offListId);
    } else {
      if (offListId) await addToList(email, offListId);
      if (onListId) await removeFromList(email, onListId);
    }

    console.log(`[brevo] weekly auto-delivery toggle synced: ${email} → ${enabled ? "ON" : "OFF"}`);
  } catch (err: any) {
    console.error("[brevo] weekly toggle sync failed:", err.message);
  }
}
