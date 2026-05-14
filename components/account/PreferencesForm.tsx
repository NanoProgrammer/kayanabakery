"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/locale-provider";
import { toast } from "sonner";

type Initial = {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  preferredLang: "en" | "es";
};

export function PreferencesForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const { locale } = useLocale();
  const [data, setData] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      document.cookie = `karyana-lang=${data.preferredLang};path=/;max-age=31536000`;
      toast.success(locale === "es" ? "Guardado" : "Saved");
      router.refresh();
    } catch {
      toast.error(locale === "es" ? "Error" : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-5 rounded-3xl border border-canela/15 bg-cream p-6"
    >
      <Field
        label={locale === "es" ? "Nombre completo" : "Full name"}
        value={data.name}
        onChange={(v) => setData({ ...data, name: v })}
      />
      <Field
        label="Email"
        value={data.email}
        onChange={() => {}}
        readOnly
      />
      <Field
        label={locale === "es" ? "Teléfono" : "Phone"}
        type="tel"
        value={data.phone}
        onChange={(v) => setData({ ...data, phone: v })}
      />
      <Field
        label={locale === "es" ? "Cumpleaños" : "Birthday"}
        type="date"
        value={data.birthday}
        onChange={(v) => setData({ ...data, birthday: v })}
      />
      <p className="text-xs text-ink-soft">
        {locale === "es"
          ? "Te regalaremos puntos cada año en tu mes de cumpleaños 🎂"
          : "We'll gift you points each year on your birthday month 🎂"}
      </p>

      <div>
        <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
          {locale === "es" ? "Idioma" : "Language"}
        </label>
        <div className="mt-2 flex gap-2">
          {(["en", "es"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setData({ ...data, preferredLang: l })}
              className={`flex-1 rounded-full border px-4 py-2 text-sm transition-all ${
                data.preferredLang === l
                  ? "border-canela bg-canela text-ink"
                  : "border-canela/30 bg-cream"
              }`}
            >
              {l === "en" ? "English" : "Español"}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="btn-primary w-full disabled:opacity-50"
      >
        {saving ? "..." : locale === "es" ? "Guardar" : "Save changes"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={`mt-2 w-full rounded-full border border-canela/30 bg-cream px-4 py-3 text-sm focus:border-canela-dark focus:outline-none ${
          readOnly ? "cursor-not-allowed opacity-70" : ""
        }`}
      />
    </div>
  );
}
