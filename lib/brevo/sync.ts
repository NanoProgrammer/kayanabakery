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
      listIds: [getNewsletterListId()],
      updateEnabled: true,
    });
    console.log(`[brevo] user registered: ${email}`);
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
}: {
  email: string;
  tier: string;
  status: string;
}) {
  try {
    await updateContactAttributes(email, {
      MEMBERSHIP_TIER: tier,
      MEMBERSHIP_STATUS: status,
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
}: {
  email: string;
  name?: string | null;
  totalOrders: number;
  totalSpentCents: number;
  lastOrderDate: string; // ISO date
}) {
  try {
    const attrs: Record<string, string | number> = {
      TOTAL_ORDERS: totalOrders,
      TOTAL_SPENT: Math.round(totalSpentCents / 100),
      LAST_ORDER_DATE: lastOrderDate.split("T")[0], // YYYY-MM-DD
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
}: {
  email: string;
  name?: string | null;
  phone?: string | null;
  totalCents: number;
}) {
  try {
    const [firstName, ...rest] = (name ?? "").split(" ");

    await upsertContact({
      email,
      attributes: {
        FIRSTNAME: firstName || "",
        LASTNAME: rest.join(" ") || "",
        ...(phone ? { SMS: phone } : {}),
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
