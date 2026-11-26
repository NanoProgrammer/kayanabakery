import { prisma } from "@/lib/prisma";
import { tallySales, SALES_WINDOW_DAYS, COUNTED_STATUSES, type SalesBySlug } from "./bestsellers";

/**
 * Lo que de verdad se vendió en los últimos tres meses.
 *
 * Vivía dentro de la página del shop. Ahora la portada ordena sus
 * pasteles y sus cajas igual que el shop, así que las dos lo leen de
 * aquí: dos copias del mismo cálculo acaban discrepando, y la portada
 * diciendo que el más vendido es uno mientras el shop dice otro es peor
 * que no ordenarlos.
 *
 * Falla en silencio a propósito. Si la base no responde —en build, o en
 * una caída— la página se dibuja igual y ordena como antes. Un orden no
 * vale una página rota.
 */
export async function readSales(): Promise<SalesBySlug | null> {
  try {
    const since = new Date(Date.now() - SALES_WINDOW_DAYS * 86_400_000);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { in: [...COUNTED_STATUSES] } },
      select: { createdAt: true, items: true },
    });
    return tallySales(orders, new Date());
  } catch (err) {
    console.error("[sales] no se pudieron leer las ventas; se ordena como antes:", err);
    return null;
  }
}
