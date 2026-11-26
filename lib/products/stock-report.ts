/**
 * El reporte de inventario, para poder COMPROBAR la Situación 13.
 *
 * Santiago no quiere decirle a su cliente que el pickup inmediato
 * funciona sin haberlo visto funcionar, y tiene razón: yo no puedo
 * abrir el sitio real desde donde trabajo, así que mi palabra no es
 * prueba de nada.
 *
 * Esto le enseña, para cada producto con inventario, el número que hay
 * ahora y cuántos se vendieron. Con eso la prueba es suya y dura dos
 * minutos: anota el número, haz un pedido, recarga. Si bajó, funciona.
 * Si no bajó, está roto y se ve aquí antes de que lo vea un cliente.
 *
 * La columna que de verdad delata el error es la última: un producto
 * con ventas y con el inventario intacto es exactamente el bug que
 * había — se vendieron seis cajas y el número seguía en seis.
 */
import { unitsSold, type SalesBySlug } from "./bestsellers";
import { isReadyNow } from "./ready-now";

export type StockProduct = {
  _id: string;
  name: string;
  slug?: string | null;
  stockQuantity?: number | null;
  leadTime?: number | null;
};

export type StockRow = {
  name: string;
  slug: string | null;
  /** El número que hay en el Studio ahora mismo. */
  stock: number;
  /** Unidades vendidas en la ventana que se esté mirando. */
  sold: number;
  /** Horas de anticipación cuando NO hay inventario. */
  leadTime: number;
  /** Si el checkout lo ofrecería hoy mismo, con este número. */
  readyNow: boolean;
  /**
   * Vendió y el inventario sigue intacto. No es prueba absoluta
   * —Karyana pudo haber repuesto el número a mano— pero es justo la
   * forma que tenía el bug, así que vale la pena mirarlo.
   */
  suspicious: boolean;
};

/** Los productos con inventario, los que más urge revisar primero. */
export function stockReport(
  products: readonly StockProduct[],
  sales: SalesBySlug | null | undefined
): StockRow[] {
  const rows: StockRow[] = [];

  for (const p of products) {
    const raw = p.stockQuantity;
    // Sin número no se maneja inventario: es hecho por encargo y no
    // pertenece a este reporte.
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;

    const stock = Math.floor(raw);
    const sold = unitsSold(sales, p.slug);
    const leadTime = typeof p.leadTime === "number" && p.leadTime > 0 ? p.leadTime : 0;

    rows.push({
      name: p.name,
      slug: p.slug ?? null,
      stock,
      sold,
      leadTime,
      readyNow: isReadyNow({ stockQuantity: stock, quantity: 1 }),
      // Vendió algo y el número sigue exactamente donde empezó.
      suspicious: sold > 0 && stock > 0 && sold >= stock,
    });
  }

  // Lo sospechoso primero, luego lo que se está agotando, luego el
  // resto por nombre — para que lo que hay que mirar esté arriba.
  return rows.sort(
    (a, b) =>
      Number(b.suspicious) - Number(a.suspicious) ||
      a.stock - b.stock ||
      a.name.localeCompare(b.name)
  );
}

/** Un resumen de una línea, para encabezar la pantalla. */
export function stockSummary(rows: readonly StockRow[]) {
  return {
    managed: rows.length,
    readyNow: rows.filter((r) => r.readyNow).length,
    soldOut: rows.filter((r) => r.stock <= 0).length,
    suspicious: rows.filter((r) => r.suspicious).length,
  };
}
