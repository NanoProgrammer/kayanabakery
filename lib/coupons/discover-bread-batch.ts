/**
 * Los primeros cupones DESCUBREPAN, los que Rubén pidió repartir a mano.
 *
 * El cupón automático solo nace cuando alguien compra un pastel. Eso
 * deja la lista de Coupons del Studio vacía hasta que pase la primera
 * venta — y la junta pidió otra cosa además: "Empezaría con 30 cupones,
 * dirigidos a clientes que ya nos compraron pasteles."
 *
 * Esos clientes ya compraron. Su pastel fue el mes pasado y nadie les va
 * a volver a cobrar uno para darles el cupón, así que hay que emitirlos
 * mirando hacia atrás. Eso es esto.
 *
 * LAS REGLAS SON DE RUBÉN, no mías:
 *
 *   · Solo para quien compró pastel y NUNCA ha comprado pan mexicano.
 *     Ese es el punto entero: el cupón es para descubrir el pan.
 *   · Uno por cliente, no uno por pastel.
 *   · Cuenta verificada — alguien con correo, no un invitado suelto.
 *   · Se empieza con 30 para medir antes de regalar inventario.
 *
 * El código se deriva del cliente y no del pedido, porque el cupón es
 * de la persona: emitir dos veces produce el mismo código y la segunda
 * escritura no hace nada, en vez de darle dos cupones a la misma
 * familia.
 */
import { isCake, isBread, type OrderLine } from "./discover-bread";
import { FREE_BREADS, VALID_FOR_DAYS, MIN_ORDER_DOLLARS, COUPON_NAME } from "./discover-bread";

/** Cuántos se emiten en la primera tanda. El número de Rubén. */
export const INITIAL_BATCH_SIZE = 30;

export type PastOrder = {
  /** La cuenta del cliente. Un invitado sin cuenta no entra. */
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  createdAt: Date;
  lines: readonly OrderLine[];
};

export type Candidate = {
  userId: string;
  email: string;
  name: string | null;
  /** Cuándo compró su último pastel. Los más recientes primero. */
  lastCakeAt: Date;
  cakeOrders: number;
};

/**
 * El código de un cliente. Derivado, nunca guardado.
 *
 * Mismas letras seguras que el código por pedido: se lee en voz alta por
 * teléfono y se imprime en impresora térmica, así que la O y el 0 no
 * tienen que distinguirse.
 */
export function couponCodeForCustomer(userId: string): string {
  const tail = (userId || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/[OIQ]/g, "0")
    .slice(-6);
  return `${COUPON_NAME}-${tail}`;
}

/**
 * Quién califica, en orden.
 *
 * Los que compraron pastel hace poco primero: son los que todavía se
 * acuerdan de Karyana y los que más probable es que usen el cupón, que
 * es justo lo que la prueba de 60 días quiere medir.
 */
export function eligibleCustomers(
  orders: readonly PastOrder[],
  limit: number = INITIAL_BATCH_SIZE
): Candidate[] {
  const byCustomer = new Map<
    string,
    { email: string; name: string | null; lastCakeAt: Date | null; cakeOrders: number; boughtBread: boolean }
  >();

  for (const order of orders) {
    const userId = (order.userId ?? "").trim();
    const email = (order.email ?? "").trim();
    // Cuenta verificada: sin cuenta y sin correo no hay a quién mandarle
    // nada, ni forma de que sea "uno por cliente".
    if (!userId || !email) continue;

    const at = order.createdAt instanceof Date ? order.createdAt : null;
    if (!at || Number.isNaN(at.getTime())) continue;

    const entry =
      byCustomer.get(userId) ??
      { email, name: order.name ?? null, lastCakeAt: null, cakeOrders: 0, boughtBread: false };

    const hasCake = order.lines.some(isCake);
    // Un solo pan en toda su historia lo descalifica. Ya descubrió el
    // pan; el cupón no es para él.
    const hasBread = order.lines.some(isBread);

    if (hasCake) {
      entry.cakeOrders += 1;
      if (!entry.lastCakeAt || at > entry.lastCakeAt) entry.lastCakeAt = at;
    }
    if (hasBread) entry.boughtBread = true;
    // El correo más reciente gana: la gente cambia de correo.
    if (email) entry.email = email;
    if (order.name) entry.name = order.name;

    byCustomer.set(userId, entry);
  }

  const candidates: Candidate[] = [];
  for (const [userId, e] of byCustomer) {
    if (e.boughtBread) continue;
    if (!e.lastCakeAt || e.cakeOrders === 0) continue;
    candidates.push({
      userId,
      email: e.email,
      name: e.name,
      lastCakeAt: e.lastCakeAt,
      cakeOrders: e.cakeOrders,
    });
  }

  candidates.sort(
    (a, b) =>
      b.lastCakeAt.getTime() - a.lastCakeAt.getTime() ||
      b.cakeOrders - a.cakeOrders ||
      a.userId.localeCompare(b.userId)
  );

  return candidates.slice(0, Math.max(0, Math.floor(limit)));
}

/**
 * El documento de Sanity para un cliente.
 *
 * Vale cero, igual que el automático: los dos panes van en la caja, no
 * se descuentan de la cuenta. Un cupón que no descuenta nada no puede
 * regalar nada por accidente.
 */
export function batchCouponDocument(candidate: Candidate, now = new Date()) {
  const code = couponCodeForCustomer(candidate.userId);
  return {
    _id: `coupon-${code.toLowerCase()}`,
    _type: "coupon" as const,
    code,
    labelEn: `Discover Bread — ${FREE_BREADS} free breads, our choice (first batch)`,
    labelEs: `Descubre Pan — ${FREE_BREADS} panes gratis, los escogemos nosotros (primera tanda)`,
    // El tipo propio: no descuenta dinero, vale dos panes.
    discountType: "FREE_BREAD" as const,
    discountValue: 0,
    appliesTo: "ALL",
    minOrderDollars: MIN_ORDER_DOLLARS,
    maxUses: 1,
    perUserLimit: 1,
    active: true,
    expiresAt: new Date(now.getTime() + VALID_FOR_DAYS * 86_400_000).toISOString(),
  };
}
