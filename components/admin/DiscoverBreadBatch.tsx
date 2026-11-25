"use client";

import { useState } from "react";
import { Gift, Loader2, Check } from "lucide-react";

type Row = {
  name: string | null;
  email: string;
  code: string;
  lastCakeAt?: string;
  cakeOrders?: number;
};

/**
 * Ver quién califica, y después crear.
 *
 * Dos pasos a propósito. Esto reparte pan gratis, y la lista hay que
 * mirarla antes: si sale un cliente que no debería, es mejor verlo aquí
 * que enterarse cuando llegue al mostrador con un cupón.
 */
export function DiscoverBreadBatch() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function preview() {
    setLoading(true);
    setError(null);
    setCreated(null);
    try {
      const res = await fetch("/api/admin/discover-bread-batch");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "No se pudo consultar.");
      setRows(body.customers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo consultar.");
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/discover-bread-batch", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "No se pudieron crear.");
      setCreated(body.created ?? 0);
      setRows(body.customers ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron crear.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={preview}
          disabled={loading || creating}
          className="inline-flex items-center gap-2 rounded-full bg-canela px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canela-dark disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Ver quién califica
        </button>

        {rows !== null && rows.length > 0 && created === null && (
          <button
            onClick={create}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-full bg-canela-dark px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-ink disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
            Crear {rows.length} {rows.length === 1 ? "cupón" : "cupones"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </p>
      )}

      {created !== null && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-ink">
          <Check className="h-4 w-4 shrink-0 text-gold" />
          {created === 0
            ? "Nadie califica todavía."
            : `Listos. ${created} ${created === 1 ? "cupón creado" : "cupones creados"} — ya aparecen en Coupons, en el Studio.`}
        </p>
      )}

      {rows !== null && rows.length === 0 && created === null && (
        <div className="mt-6 rounded-2xl border border-canela/25 bg-cream p-5 text-sm text-ink-soft">
          <p className="font-medium text-ink">Nadie califica todavía.</p>
          {/* Dicho aquí, porque "0 clientes" sin explicación parece un
              error y no lo es. */}
          <p className="mt-2">
            El cupón es solo para quien ya compró pastel y nunca ha comprado pan.
            Si todos tus clientes de pastel ya compraron pan alguna vez, la lista
            sale vacía — y es correcto: ya descubrieron el pan.
          </p>
        </div>
      )}

      {rows !== null && rows.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-canela/25">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-widest text-ink-soft">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Pasteles</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-t border-canela/15">
                  <td className="px-4 py-3">{r.name || "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.cakeOrders ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
