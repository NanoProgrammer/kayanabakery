/**
 * Where a delivery order is actually sent.
 *
 *   npm run test:address
 *
 * Carlos Corona ordered twice on Nov 3 and both orders were delivered to an
 * address he had moved away from. He said the page filled in his old address
 * by itself and would not update. These tests are that complaint, written
 * down: each one is a way the old checkout could send an order somewhere the
 * customer had not chosen.
 */
import {
  chooseInitialAddress,
  resolveOrderAddress,
  addressPayload,
  describeOrderAddress,
  isUsableDraft,
  withSavedAddress,
  type StoredAddress,
  type AddressDraft,
} from "../lib/checkout/address-choice";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

const old: StoredAddress = {
  id: "old",
  street: "438 24 Ave NE",
  city: "Calgary",
  province: "AB",
  postalCode: "T2E 1X1",
  isDefault: true,
};
const other: StoredAddress = {
  id: "other",
  street: "1200 9 Ave SE",
  city: "Calgary",
  province: "AB",
  postalCode: "T2G 0T8",
};
const moved: AddressDraft = {
  street: "77 Panatella Blvd NW",
  city: "Calgary",
  province: "AB",
  postalCode: "T3K 0J5",
};

console.log("\nChoosing the delivery address\n");

console.log("  what the form starts with");
check("the default address wins", chooseInitialAddress([other, old]), "old");
check("with no default, the first listed is used", chooseInitialAddress([other]), "other");
check("nothing saved means nothing selected", chooseInitialAddress([]), null);

console.log("\n  Carlos's case: typing a new address while an old one is selected");
const typing = resolveOrderAddress({
  addresses: [old],
  selectedId: "old",
  draft: moved,
  isAddingNew: true,
});
check("the typed address wins over the pre-selected one", typing.kind, "new");
check("...and it is the one he typed", addressPayload(typing), { guestAddress: moved });
check(
  "...and the order does NOT carry the old address id",
  JSON.stringify(addressPayload(typing)).includes("old"),
  false
);

console.log("\n  but a half-typed address must not win");
check(
  "a street with no postal code loses to the saved address",
  resolveOrderAddress({
    addresses: [old],
    selectedId: "old",
    draft: { ...moved, postalCode: "" },
    isAddingNew: true,
  }),
  { kind: "saved", addressId: "old", address: old }
);
check(
  "a postal code with no street loses too",
  resolveOrderAddress({
    addresses: [old],
    selectedId: "old",
    draft: { ...moved, street: "" },
    isAddingNew: true,
  }).kind,
  "saved"
);
check("an empty draft is not usable", isUsableDraft({ street: "", city: "Calgary", province: "AB", postalCode: "" }), false);
check("a draft with only whitespace is not usable", isUsableDraft({ street: "   ", city: "C", province: "AB", postalCode: "T2E1X1" }), false);
check("a postal code without its space still counts", isUsableDraft({ ...moved, postalCode: "T3K0J5" }), true);
check("a null draft is not usable", isUsableDraft(null), false);

console.log("\n  closing the add form goes back to the saved choice");
check(
  "a draft left behind with the form closed is ignored",
  resolveOrderAddress({ addresses: [old], selectedId: "old", draft: moved, isAddingNew: false }),
  { kind: "saved", addressId: "old", address: old }
);

console.log("\n  picking a different saved address");
check(
  "the one he picked is the one sent",
  addressPayload(
    resolveOrderAddress({ addresses: [old, other], selectedId: "other", draft: null, isAddingNew: false })
  ),
  { addressId: "other" }
);

console.log("\n  nothing to deliver to");
check(
  "no addresses and no draft resolves to none",
  resolveOrderAddress({ addresses: [], selectedId: null, draft: null, isAddingNew: false }),
  { kind: "none" }
);
check(
  "no payload fields are sent for none",
  addressPayload({ kind: "none" }),
  null
);
check(
  "a guest typing their address resolves to it",
  resolveOrderAddress({ addresses: [], selectedId: null, draft: moved, isAddingNew: false }),
  { kind: "new", address: moved }
);
check(
  "a selection pointing at an address that is gone is none, not a guess",
  resolveOrderAddress({ addresses: [other], selectedId: "deleted", draft: null, isAddingNew: false }),
  { kind: "none" }
);

console.log("\n  telling the customer where it is going");
check(
  "the saved address reads in full",
  describeOrderAddress(resolveOrderAddress({ addresses: [old], selectedId: "old", draft: null, isAddingNew: false })),
  "438 24 Ave NE, Calgary, AB T2E 1X1"
);
check(
  "the typed address is what he sees, not the old one",
  describeOrderAddress(typing),
  "77 Panatella Blvd NW, Calgary, AB T3K 0J5"
);
check(
  "a buzzer shows, so a missed delivery is visible before paying",
  describeOrderAddress({ kind: "new", address: { ...moved, buzzer: "Unit 304" } }),
  "77 Panatella Blvd NW (Unit 304), Calgary, AB T3K 0J5"
);
check("nothing chosen shows nothing", describeOrderAddress({ kind: "none" }), null);
check(
  "what is shown and what is sent come from the same resolution",
  describeOrderAddress(typing)!.includes(moved.street),
  true
);

console.log("\n  saving a new address without reloading the page");
const saved: StoredAddress = { id: "new", ...moved };
check("the new address joins the list", withSavedAddress([old], saved).map((a) => a.id), ["old", "new"]);
check(
  "and selecting it now resolves to it",
  resolveOrderAddress({
    addresses: withSavedAddress([old], saved),
    selectedId: "new",
    draft: null,
    isAddingNew: false,
  }),
  { kind: "saved", addressId: "new", address: saved }
);
check(
  "saving it as the default puts it first",
  withSavedAddress([old], { ...saved, isDefault: true }).map((a) => a.id),
  ["new", "old"]
);
check(
  "...and demotes the one that was the default",
  withSavedAddress([old], { ...saved, isDefault: true }).find((a) => a.id === "old")?.isDefault,
  false
);
check(
  "re-saving an address does not duplicate it",
  withSavedAddress([old, saved], { ...saved, street: "77 Panatella Blvd NW Unit 2" }).length,
  2
);
check(
  "...and keeps the edit",
  withSavedAddress([old, saved], { ...saved, street: "edited" }).find((a) => a.id === "new")?.street,
  "edited"
);
check(
  "the first address saved by a new customer is selectable right away",
  chooseInitialAddress(withSavedAddress([], { ...saved, isDefault: true })),
  "new"
);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
