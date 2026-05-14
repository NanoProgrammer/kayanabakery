"use client";

import { useState } from "react";
import { Plus, MapPin, Check, Edit2, Trash2, Star } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-provider";
import { isSECalgary } from "@/lib/checkout/postal-codes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Address = {
  id: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  buzzer?: string | null;
  notes?: string | null;
  isDefault: boolean;
  isSE: boolean;
};

type Draft = Omit<Address, "id" | "isSE">;

const EMPTY: Draft = {
  street: "",
  city: "Calgary",
  province: "AB",
  postalCode: "",
  buzzer: "",
  notes: "",
  isDefault: false,
};

export function AddressManager({ initial }: { initial: Address[] }) {
  const { locale } = useLocale();
  const [addresses, setAddresses] = useState<Address[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);

  function startEdit(a: Address) {
    setEditingId(a.id);
    setAdding(false);
    setDraft({
      street: a.street,
      city: a.city,
      province: a.province,
      postalCode: a.postalCode,
      buzzer: a.buzzer ?? "",
      notes: a.notes ?? "",
      isDefault: a.isDefault,
    });
  }

  function startAdd() {
    setAdding(true);
    setEditingId(null);
    setDraft({ ...EMPTY, isDefault: addresses.length === 0 });
  }

  function cancel() {
    setAdding(false);
    setEditingId(null);
    setDraft(EMPTY);
  }

  async function save() {
    if (!draft.street || !draft.postalCode) {
      toast.error(locale === "es" ? "Faltan campos" : "Missing fields");
      return;
    }
    setSaving(true);
    try {
      const isUpdate = !!editingId;
      const url = isUpdate
        ? `/api/addresses/${editingId}`
        : "/api/addresses";
      const method = isUpdate ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (isUpdate) {
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingId ? data.address : a))
        );
      } else {
        setAddresses((prev) => [data.address, ...prev]);
      }

      // If default changed, refresh others
      if (draft.isDefault) {
        setAddresses((prev) =>
          prev.map((a) =>
            a.id === data.address.id
              ? { ...a, isDefault: true }
              : { ...a, isDefault: false }
          )
        );
      }

      toast.success(locale === "es" ? "Guardado" : "Saved");
      cancel();
    } catch {
      toast.error(locale === "es" ? "Error" : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        locale === "es"
          ? "¿Eliminar esta dirección?"
          : "Delete this address?"
      )
    )
      return;
    const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error(locale === "es" ? "Error" : "Failed");
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="space-y-3">
      {addresses.map((a) => (
        <div
          key={a.id}
          className="rounded-2xl border border-canela/15 bg-cream p-5"
        >
          {editingId === a.id ? (
            <Form
              draft={draft}
              setDraft={setDraft}
              saving={saving}
              onSave={save}
              onCancel={cancel}
            />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-canela-dark" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{a.street}</p>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-canela-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-canela-dark">
                        <Star className="h-2.5 w-2.5" />
                        {locale === "es" ? "Principal" : "Default"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-ink-soft">
                    {a.city}, {a.province} {a.postalCode}
                  </p>
                  {a.buzzer && (
                    <p className="text-xs text-ink-soft">
                      Buzzer: {a.buzzer}
                    </p>
                  )}
                  {a.isSE && (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-canela-dark">
                      ✨ SE Calgary
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEdit(a)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-canela-light"
                  aria-label="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => remove(a.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-red-50"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="rounded-2xl border border-canela/30 bg-cream p-5">
          <Form
            draft={draft}
            setDraft={setDraft}
            saving={saving}
            onSave={save}
            onCancel={cancel}
          />
        </div>
      ) : (
        <button
          onClick={startAdd}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-canela/30 bg-cream/40 p-5 text-sm font-medium text-ink-soft hover:border-canela hover:bg-canela-light"
        >
          <Plus className="h-4 w-4" />
          {locale === "es" ? "Agregar dirección" : "Add address"}
        </button>
      )}
    </div>
  );
}

function Form({
  draft,
  setDraft,
  saving,
  onSave,
  onCancel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { locale } = useLocale();
  const isSE = isSECalgary(draft.postalCode);

  return (
    <div className="space-y-3">
      <Field
        label={locale === "es" ? "Calle" : "Street"}
        value={draft.street}
        onChange={(v) => setDraft({ ...draft, street: v })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label={locale === "es" ? "Ciudad" : "City"}
          value={draft.city}
          onChange={(v) => setDraft({ ...draft, city: v })}
        />
        <Field
          label={locale === "es" ? "Provincia" : "Province"}
          value={draft.province}
          onChange={(v) => setDraft({ ...draft, province: v.toUpperCase() })}
          maxLength={3}
        />
      </div>
      <Field
        label={locale === "es" ? "Código postal" : "Postal code"}
        value={draft.postalCode}
        onChange={(v) => setDraft({ ...draft, postalCode: v.toUpperCase() })}
      />
      {draft.postalCode.length >= 6 && isSE && (
        <p className="rounded-lg bg-canela-light px-3 py-2 text-xs font-bold text-canela-dark">
          ✨ SE Calgary
        </p>
      )}
      <Field
        label={locale === "es" ? "Buzzer (opcional)" : "Buzzer (optional)"}
        value={draft.buzzer ?? ""}
        onChange={(v) => setDraft({ ...draft, buzzer: v })}
      />
      <Field
        label={locale === "es" ? "Notas (opcional)" : "Notes (optional)"}
        value={draft.notes ?? ""}
        onChange={(v) => setDraft({ ...draft, notes: v })}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(e) =>
            setDraft({ ...draft, isDefault: e.target.checked })
          }
          className="h-4 w-4"
        />
        {locale === "es"
          ? "Usar como dirección principal"
          : "Set as default"}
      </label>
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex-1 rounded-full bg-canela px-4 py-2 text-sm font-medium text-ink hover:bg-canela-dark disabled:opacity-50"
        >
          {saving
            ? "..."
            : locale === "es"
            ? "Guardar"
            : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-full border border-canela/30 px-4 py-2 text-sm"
        >
          {locale === "es" ? "Cancelar" : "Cancel"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="mt-1 w-full rounded-full border border-canela/30 bg-cream px-4 py-2 text-sm focus:border-canela-dark focus:outline-none"
      />
    </div>
  );
}
