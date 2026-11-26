import { sanityFetch } from "@/sanity/lib/fetch";
import { allProductsQuery } from "@/sanity/lib/queries";
import { readSales } from "@/lib/products/sales";
import { stockReport, stockSummary } from "@/lib/products/stock-report";
import { SALES_WINDOW_DAYS } from "@/lib/products/bestsellers";
import { AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Comprobar la Situación 13 sin tener que creerle a nadie.
 *
 * El pickup inmediato depende de un número, y de que ese número baje
 * cuando algo se vende. Esta pantalla enseña los dos datos juntos para
 * que la prueba la haga Santiago: anotar el número, hacer un pedido,
 * recargar.
 */
export default async function InventarioPage() {
  const [products, sales] = await Promise.all([
    sanityFetch<any[]>({ query: allProductsQuery, tags: ["product"] }),
    readSales(),
  ]);

  const rows = stockReport(products ?? [], sales);
  const summary = stockSummary(rows);

  return (
    <div>
      <h2 className="font-display text-2xl">Inventario y pickup inmediato</h2>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Los productos que tienen un número en <strong>Stock Quantity</strong>. Con
        número mayor que cero se recogen el mismo día, sin tiempo de
        anticipación. En cero vuelven a su lead time normal y se siguen
        pudiendo comprar.
      </p>

      {/* La prueba, escrita, para que no dependa de mi palabra. */}
      <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-5 text-sm">
        <p className="font-bold text-ink">Cómo comprobarlo en dos minutos</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-ink-soft">
          <li>Elige un producto de la tabla y anota su número de stock.</li>
          <li>Haz un pedido de ese producto. En el checkout debe ofrecerse para hoy, sin espera.</li>
          <li>Vuelve aquí y recarga. El número tiene que haber bajado por la cantidad que compraste.</li>
          <li>Déjalo en cero y vuelve al checkout: ya no debe ofrecerse para hoy, pero sí se debe poder comprar con su espera normal.</li>
        </ol>
        <p className="mt-3 text-ink-soft">
          Si el número no baja en el paso 3, está roto — y lo ves aquí antes
          que un cliente en la puerta.
        </p>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-4">
        {[
          ["Con inventario", summary.managed],
          ["Listos hoy", summary.readyNow],
          ["Agotados", summary.soldOut],
          ["Por revisar", summary.suspicious],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-canela/25 bg-cream p-4">
            <dt className="text-xs uppercase tracking-widest text-ink-soft">{label}</dt>
            <dd className="mt-1 font-display text-2xl">{value as number}</dd>
          </div>
        ))}
      </dl>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-canela/25 bg-cream p-5 text-sm text-ink-soft">
          <p className="font-medium text-ink">Ningún producto tiene inventario puesto.</p>
          <p className="mt-2">
            Pon un número en <strong>Stock Quantity</strong> de una caja en el
            Studio y vuelve aquí. Sin número, el producto es por encargo y usa
            su tiempo de anticipación normal — que también es correcto.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-canela/25">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-widest text-ink-soft">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Vendidos ({SALES_WINDOW_DAYS}d)</th>
                <th className="px-4 py-3">Espera sin stock</th>
                <th className="px-4 py-3">¿Hoy mismo?</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.slug ?? r.name}
                  className={cn("border-t border-canela/15", r.suspicious && "bg-amber-50")}
                >
                  <td className="px-4 py-3">
                    {r.name}
                    {r.suspicious && (
                      <span className="mt-1 flex items-center gap-1 text-xs text-amber-800">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        Vendió {r.sold} y todavía marca {r.stock}. Revísalo.
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">{r.stock}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.sold}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {r.leadTime > 0 ? `${r.leadTime} h` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.readyNow ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-gold">
                        <Zap className="h-3 w-3" />
                        Sí
                      </span>
                    ) : (
                      <span className="text-xs text-ink-soft">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
