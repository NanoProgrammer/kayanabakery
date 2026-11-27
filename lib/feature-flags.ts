/**
 * Lo que ya está en vivo y lo que todavía no.
 *
 * La junta del 24 de noviembre dejó ocho situaciones abiertas. Cinco están
 * terminadas y listas para probar; dos tocan cosas que el cliente VE o
 * RECIBE y no deben aparecer hasta que Karyana y Rubén las hayan visto.
 *
 * Un solo archivo para prenderlas. Nada de buscar código comentado por
 * todo el proyecto: se cambia `false` por `true` aquí y queda.
 *
 * ── Ya en vivo, nada que prender ──────────────────────────────────
 *
 *   6  DESCUBREPAN              el cupón al comprar pastel
 *   7  Pedidos personalizados   buscar cliente + factura por correo
 *   9  Experiencia de compra    pasteles y cajas al inicio
 *  12  Buscador y orden         incluye "más rápidos" y ventas reales
 *  13  Pickup inmediato         incluye el descuento de inventario
 *
 * ── Prendidas el 27 de noviembre, a petición de Santiago ─────────
 *
 *   8  Roadmap del Club        el camino y los niveles, visibles
 *  10  Avisos de pedido        "confirmado" y "en preparación"
 */

/**
 * SITUACIÓN 8 — el roadmap del Club y la tabla de niveles.
 *
 * Cambia por completo lo que un cliente entiende del Karyana Club: que
 * el nivel se gana y no se compra. Es una decisión de negocio ya
 * tomada en la junta, pero anunciarla es de Karyana, no del código.
 *
 * Apagado, /memberships mostraba solo el encabezado, los beneficios y
 * las preguntas frecuentes.
 *
 * Lo que NO vuelve es la tabla de precios con "$30/mes" y botones de
 * Subscribe. Esa decía lo contrario de lo que el Club es hoy y por eso
 * se quitó; apagar el roadmap no es razón para volver a venderlo.
 */
export const KLC_PUBLIC_ROADMAP = true;

/**
 * SITUACIÓN 10 — los dos avisos nuevos: "confirmado" y "en preparación".
 *
 * Son mensajes que llegan al teléfono de la gente: con esto prendido,
 * un cliente recibe dos avisos más por pedido.
 *
 * OJO: esto apaga SOLO los dos avisos nuevos. El consentimiento
 * (responder STOP o BAJA) y el freno de duplicados siguen activos a
 * propósito, porque los dos únicamente QUITAN mensajes no deseados.
 * Apagarlos volvería a mandarle mensajes a quien pidió que paráramos, y
 * a mandar el mismo aviso dos veces — eso no es "esperar a anunciarlo",
 * es romperlo otra vez.
 */
export const NEW_ORDER_STATUS_MESSAGES = true;
