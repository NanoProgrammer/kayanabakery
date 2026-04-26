"use client";

import { useState } from "react";
import { toast } from "sonner";

type Prefs = {
  newsletter?: boolean;
  smsUpdates?: boolean;
  dietary?: string[];
  preferredPickupDay?: string;
  language?: string;
};

export function PreferencesForm({
  initial,
}: {
  initial: { phone: string; preferences: Prefs };
}) {
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const dietary: string[] = [];
    ["gluten-free", "vegan", "dairy-free", "nut-free"].forEach((k) => {
      if (fd.get(`diet_${k}`)) dietary.push(k);
    });
    const payload = {
      phone: fd.get("phone"),
      preferences: {
        newsletter: !!fd.get("newsletter"),
        smsUpdates: !!fd.get("smsUpdates"),
        dietary,
        preferredPickupDay: fd.get("preferredPickupDay") || undefined,
        language: fd.get("language") || "en",
      },
    };
    try {
      const res = await fetch("/api/account/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success("Preferences saved");
    } catch {
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50">
          Contact
        </h3>
        <div className="mt-4">
          <label className="mb-2 block text-sm text-ink">Phone number</label>
          <input
            name="phone"
            defaultValue={initial.phone}
            placeholder="(403) 555-0199"
            className="h-11 w-full rounded-full border border-canela/20 bg-cream px-4 text-sm text-ink focus:border-canela focus:outline-none focus:ring-2 focus:ring-canela/20"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50">
          Notifications
        </h3>
        <div className="mt-4 space-y-3">
          <Checkbox
            name="newsletter"
            label="Email newsletter (new products, seasonal drops)"
            defaultChecked={initial.preferences.newsletter}
          />
          <Checkbox
            name="smsUpdates"
            label="SMS order updates"
            defaultChecked={initial.preferences.smsUpdates}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50">
          Dietary preferences
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {["gluten-free", "vegan", "dairy-free", "nut-free"].map((d) => (
            <Checkbox
              key={d}
              name={`diet_${d}`}
              label={d}
              defaultChecked={initial.preferences.dietary?.includes(d)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-canela/15 bg-masa/30 p-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-ink/50">
          Other
        </h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-ink">
              Preferred pickup day
            </label>
            <select
              name="preferredPickupDay"
              defaultValue={initial.preferences.preferredPickupDay || ""}
              className="h-11 w-full rounded-full border border-canela/20 bg-cream px-4 text-sm text-ink"
            >
              <option value="">No preference</option>
              {[
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
              ].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-ink">Language</label>
            <select
              name="language"
              defaultValue={initial.preferences.language || "en"}
              className="h-11 w-full rounded-full border border-canela/20 bg-cream px-4 text-sm text-ink"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </section>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm text-ink">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-canela/30 accent-canela"
      />
      <span className="capitalize">{label}</span>
    </label>
  );
}
