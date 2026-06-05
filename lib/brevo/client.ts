/**
 * Brevo (formerly Sendinblue) API client
 *
 * ENV VARS REQUIRED:
 *   BREVO_API_KEY        — from Brevo dashboard → SMTP & API → API Keys
 *   BREVO_LIST_ID        — the numeric list ID for newsletter/contacts
 *   BREVO_MEMBERS_LIST_ID — (optional) separate list for paying members
 */

const BREVO_API = "https://api.brevo.com/v3";

function getHeaders() {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("Missing BREVO_API_KEY in env");
  return {
    "api-key": key,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// ─── Types ───────────────────────────────────────────────

export type BrevoContact = {
  email: string;
  attributes?: Record<string, string | number | boolean | null>;
  listIds?: number[];
  updateEnabled?: boolean;
};

type BrevoResponse = {
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
};

// ─── Core API calls ──────────────────────────────────────

/**
 * Create or update a contact in Brevo.
 * If the contact exists and updateEnabled is true, attributes are merged.
 */
export async function upsertContact(
  contact: BrevoContact
): Promise<BrevoResponse> {
  try {
    const res = await fetch(`${BREVO_API}/contacts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        email: contact.email.toLowerCase().trim(),
        attributes: contact.attributes ?? {},
        listIds: contact.listIds ?? [],
        updateEnabled: contact.updateEnabled ?? true,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok && res.status !== 204) {
      console.error("[brevo] upsertContact failed:", data);
      return { ok: false, status: res.status, error: data?.message };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    console.error("[brevo] upsertContact error:", err.message);
    return { ok: false, status: 0, error: err.message };
  }
}

/**
 * Update attributes on an existing contact.
 */
export async function updateContactAttributes(
  email: string,
  attributes: Record<string, string | number | boolean | null>
): Promise<BrevoResponse> {
  try {
    const encoded = encodeURIComponent(email.toLowerCase().trim());
    const res = await fetch(`${BREVO_API}/contacts/${encoded}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ attributes }),
    });

    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}));
      console.error("[brevo] updateAttributes failed:", data);
      return { ok: false, status: res.status, error: data?.message };
    }

    return { ok: true, status: res.status };
  } catch (err: any) {
    console.error("[brevo] updateAttributes error:", err.message);
    return { ok: false, status: 0, error: err.message };
  }
}

/**
 * Add a contact to a specific list.
 */
export async function addToList(
  email: string,
  listId: number
): Promise<BrevoResponse> {
  try {
    const res = await fetch(
      `${BREVO_API}/contacts/lists/${listId}/contacts/add`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          emails: [email.toLowerCase().trim()],
        }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[brevo] addToList failed:", data);
      return { ok: false, status: res.status, error: data?.message };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    console.error("[brevo] addToList error:", err.message);
    return { ok: false, status: 0, error: err.message };
  }
}

/**
 * Remove a contact from a specific list (unsubscribe from list, not delete).
 */
export async function removeFromList(
  email: string,
  listId: number
): Promise<BrevoResponse> {
  try {
    const res = await fetch(
      `${BREVO_API}/contacts/lists/${listId}/contacts/remove`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          emails: [email.toLowerCase().trim()],
        }),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.message };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message };
  }
}

/**
 * Get a contact's info from Brevo.
 */
export async function getContact(email: string): Promise<BrevoResponse> {
  try {
    const encoded = encodeURIComponent(email.toLowerCase().trim());
    const res = await fetch(`${BREVO_API}/contacts/${encoded}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!res.ok) {
      return { ok: false, status: res.status };
    }

    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message };
  }
}
