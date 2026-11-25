import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { set, unset, useClient, useFormValue } from "sanity";
import type { StringInputProps } from "sanity";
import { useDocumentOperation } from "sanity";
import { Box, Card, Spinner, Stack, Text, TextInput } from "@sanity/ui";
import {
  CUSTOMER_SEARCH_QUERY,
  describeCustomer,
  fillFromCustomer,
  rankCustomers,
  type CustomerRecord,
} from "../../../lib/customers/lookup";

/**
 * Find an existing customer while typing their name. Situación 7.
 *
 * The dropdown staff were using was Chrome's autofill — it knows the
 * person at the keyboard, not the bakery's customers, and it links
 * nothing to a Karyana account. This one searches the real customer
 * records by name, email or phone, and choosing one fills the whole
 * block: name, email, phone, membership, and the account id that ties
 * the order to their Club standing.
 *
 * The list is fetched once and filtered in memory. There are a few
 * hundred customers, the ranking in lib/customers/lookup.ts is better
 * than GROQ's `match`, and this way typing does not fire a request per
 * keystroke on a till in the middle of a phone call.
 */
export function CustomerLookupInput(props: StringInputProps) {
  const { onChange, value, readOnly, renderDefault, elementProps } = props;
  const client = useClient({ apiVersion: "2024-10-01" });

  const documentId = (useFormValue(["_id"]) as string | undefined) ?? "";
  const documentType = (useFormValue(["_type"]) as string | undefined) ?? "order";
  const publishedId = documentId.replace(/^drafts\./, "");
  const { patch } = useDocumentOperation(publishedId, documentType);

  const [customers, setCustomers] = useState<CustomerRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // Loaded the first time the field is focused, not on page load: most
  // visits to an order are not a search.
  const load = useCallback(() => {
    if (customers || loading || failed) return;
    setLoading(true);
    client
      .fetch<CustomerRecord[]>(CUSTOMER_SEARCH_QUERY)
      .then((rows) => setCustomers(rows ?? []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [client, customers, loading, failed]);

  const matches = useMemo(
    () => (customers ? rankCustomers(customers, value ?? "") : []),
    [customers, value]
  );

  // Clicking anywhere else closes it. Without this the list sits over the
  // fields underneath and staff cannot reach them.
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  const choose = useCallback(
    (c: CustomerRecord) => {
      const filled = fillFromCustomer(c);
      onChange(filled.customerName ? set(filled.customerName) : unset());
      // Siblings are patched at the document level: an input can only set
      // its own path. Nulls are unset rather than written, so picking a
      // customer with no email clears the last one's instead of leaving
      // it to be invoiced to the wrong person.
      patch.execute([
        {
          set: Object.fromEntries(
            Object.entries(filled).filter(([, v]) => v !== null && v !== "")
          ),
        },
        {
          unset: Object.entries(filled)
            .filter(([k, v]) => k !== "customerName" && (v === null || v === ""))
            .map(([k]) => k),
        },
      ]);
      setOpen(false);
    },
    [onChange, patch]
  );

  if (readOnly) return renderDefault(props);

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <TextInput
        {...elementProps}
        value={value ?? ""}
        placeholder="Name, phone or email…"
        onFocus={() => {
          load();
          setOpen(true);
        }}
        onChange={(e) => {
          const next = e.currentTarget.value;
          onChange(next ? set(next) : unset());
          setOpen(true);
        }}
      />

      {open && (loading || failed || matches.length > 0) && (
        <Card
          radius={2}
          shadow={3}
          style={{
            position: "absolute",
            zIndex: 100,
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 280,
            overflowY: "auto",
          }}
        >
          {loading && (
            <Box padding={3}>
              <Spinner muted />
            </Box>
          )}

          {/* Said plainly rather than looking like "no such customer". */}
          {failed && (
            <Box padding={3}>
              <Text size={1} muted>
                Couldn&rsquo;t load customers. Type the details by hand.
              </Text>
            </Box>
          )}

          {!loading &&
            !failed &&
            matches.map((c) => (
              <Card
                key={c._id}
                as="button"
                type="button"
                padding={3}
                radius={0}
                tone="default"
                onClick={() => choose(c)}
                style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer" }}
              >
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    {c.name || "(no name)"}
                    {c.tier && c.tier !== "BASICO" ? ` · ${c.tier}` : ""}
                  </Text>
                  <Text size={1} muted>
                    {describeCustomer(c)}
                  </Text>
                </Stack>
              </Card>
            ))}
        </Card>
      )}
    </div>
  );
}
