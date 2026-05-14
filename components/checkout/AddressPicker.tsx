"use client";

import { useState } from "react";
import { Plus, MapPin, Check } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { isSECalgary } from "@/lib/checkout/postal-codes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type AddressData = {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  buzzer?: string;
  notes?: string;
};

export type SavedAddress = AddressData & {
  id: string;
  isSE: boolean;
};

export function AddressPicker({
  addresses,
  selectedId,
  onSelect,
  guestAddress,
  onGuestAddressChange,
  isLoggedIn,
}: {
  addresses: SavedAddress[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  guestAddress: AddressData | null;
  onGuestAddressChange: (addr: AddressData | null) => void;
  isLoggedIn: boolean;
}) {
  const { locale } = useLocale();
  const [adding, setAdding] = useState(addresses.length === 0 && isLoggedIn);
  const [draft, setDraft] = useState<AddressData>({
    street: "",
    city: "Calgary",
    province: "AB",
    postalCode: "",
  });
  const [saving, setSaving] = useState(false);

  // Guest mode (no addresses, not logged in)
  if (!isLoggedIn) {
    return (
      <GuestAddressForm
        value={guestAddress}
        onChange={onGuestAddressChange}
      />
    );
  }

  async function saveAddress() {
    if (!draft.street || !draft.postalCode) {
      toast.error(locale === "es" ? "Faltan campos" : "Missing fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          isDefault: addresses.length === 0,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSelect(data.address.id);
      setAdding(false);
      // Trigger a soft refresh — caller can re-fetch addresses if needed
      window.location.reload();
    } catch {
      toast.error(locale === "es" ? "Error al guardar" : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {addresses.map((a) => {
        const isSelected = selectedId === a.id;
        return (
          <button
            type="button"
            key={a.id}
            onClick={() => onSelect(a.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all",
              isSelected
                ? "border-canela-dark bg-canela-light"
                : "border-canela/30 bg-cream hover:border-canela"
            )}
          >
            <MapPin
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                isSelected ? "text-canela-dark" : "text-ink-soft"
              )}
            />
            <div className="flex-1">
              <p className="font-medium">{a.street}</p>
              <p className="text-sm text-ink-soft">
                {a.city}, {a.province} {a.postalCode}
              </p>
              {a.isSE && (
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-canela-dark">
                  {locale === "es" ? "Calgary SE" : "SE Calgary"}
                </p>
              )}
            </div>
            {isSelected && <Check className="h-4 w-4 text-canela-dark" />}
          </button>
        );
      })}

      {!adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-canela/30 bg-cream/40 p-4 text-sm font-medium text-ink-soft hover:border-canela hover:bg-canela-light"
        >
          <Plus className="h-4 w-4" />
          {locale === "es" ? "Agregar dirección" : "Add address"}
        </button>
      )}

      {adding && (
        <div className="rounded-2xl border border-canela/30 bg-cream p-4">
          <AddressFormFields value={draft} onChange={setDraft} />
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={saveAddress}
              disabled={saving}
              className="flex-1 rounded-full bg-canela px-4 py-2 text-sm font-medium text-ink disabled:opacity-50"
            >
              {saving
                ? "..."
                : locale === "es"
                ? "Guardar"
                : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-full border border-canela/30 px-4 py-2 text-sm"
            >
              {locale === "es" ? "Cancelar" : "Cancel"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GuestAddressForm({
  value,
  onChange,
}: {
  value: AddressData | null;
  onChange: (a: AddressData) => void;
}) {
  const { locale } = useLocale();
  const v = value || {
    street: "",
    city: "Calgary",
    province: "AB",
    postalCode: "",
  };
  return (
    <div className="rounded-2xl border border-canela/30 bg-cream p-4">
      <p className="mb-3 text-sm text-ink-soft">
        {locale === "es"
          ? "Dirección de entrega"
          : "Delivery address"}
      </p>
      <AddressFormFields value={v} onChange={onChange} />
    </div>
  );
}

function AddressFormFields({
  value,
  onChange,
}: {
  value: AddressData;
  onChange: (a: AddressData) => void;
}) {
  const { locale } = useLocale();
  const isSE = isSECalgary(value.postalCode);

  return (
    <div className="space-y-3">
      <Field
        label={locale === "es" ? "Calle" : "Street address"}
        value={value.street}
        onChange={(v) => onChange({ ...value, street: v })}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={locale === "es" ? "Ciudad" : "City"}
          value={value.city}
          onChange={(v) => onChange({ ...value, city: v })}
          required
        />
        <Field
          label={locale === "es" ? "Provincia" : "Province"}
          value={value.province}
          onChange={(v) => onChange({ ...value, province: v.toUpperCase() })}
          required
          maxLength={3}
        />
      </div>
      <Field
        label={locale === "es" ? "Código postal" : "Postal code"}
        value={value.postalCode}
        onChange={(v) => onChange({ ...value, postalCode: v.toUpperCase() })}
        required
        placeholder="T2A 1B2"
      />
      {value.postalCode.length >= 6 && isSE && (
        <p className="rounded-lg bg-canela-light px-3 py-2 text-xs font-bold text-canela-dark">
          ✨ {locale === "es" ? "¡Calgary SE — primer envío gratis!" : "SE Calgary — first delivery free!"}
        </p>
      )}
      <Field
        label={locale === "es" ? "Buzzer / unidad (opcional)" : "Buzzer / unit (optional)"}
        value={value.buzzer || ""}
        onChange={(v) => onChange({ ...value, buzzer: v })}
      />
      <Field
        label={locale === "es" ? "Notas para el repartidor (opcional)" : "Notes for delivery (optional)"}
        value={value.notes || ""}
        onChange={(v) => onChange({ ...value, notes: v })}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {label} {required && "*"}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="mt-1 w-full rounded-full border border-canela/30 bg-cream px-4 py-2 text-sm focus:border-canela-dark focus:outline-none"
      />
    </div>
  );
}
