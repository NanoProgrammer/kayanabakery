/**
 * The climb shown on the Karyana Club page — Situación 8.
 *
 *   npm run test:roadmap
 *
 * What these guard: that the page cannot promise something the tier data
 * does not actually give, and that every step up says something. A stop
 * with an empty list of rewards is a stop nobody climbs to.
 */
import { roadmap, fastestCakeHours, PILLARS, BONUS_CAP_NOTE, type Bilingual } from "../lib/loyalty/roadmap";

/** Lo que suma una ruta, con los valores reales, para comprobarla. */
function routeCredits(route: Bilingual): number {
  const buys = Number(route.es.match(/^(\d+) compras/)?.[1] ?? 0);
  const refs = Number(route.es.match(/(\d+) persona/)?.[1] ?? 0);
  const fams = Number(route.es.match(/probar (\d+) familias/)?.[1] ?? 0);
  return buys * 1 + refs * 2 + fams * 1;
}
import { TIER_THRESHOLDS, LEGENDARIO_MIN_PERSONAL_PURCHASES } from "../lib/loyalty/klc";
import { TIERS } from "../lib/membership/tiers";

let passed = 0;
let failed = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

console.log("\nKaryana Club roadmap\n");

const stops = roadmap();

console.log("  the path");
check("four stops", stops.length, 4);
check(
  "in order, Básico first",
  stops.map((s) => s.tier),
  ["BASICO", "ARTESANO", "SELECTO", "LEGENDARIO"]
);
check("named the way Karyana names them", stops.map((s) => s.name), [
  "Básico",
  "Artesano",
  "Selecto",
  "Legendario",
]);

console.log("\n  what each one costs");
check("the first is free", stops[0].credits, 0);
check("Artesano asks the real threshold", stops[1].credits, TIER_THRESHOLDS.ARTESANO);
check("Selecto too", stops[2].credits, TIER_THRESHOLDS.SELECTO);
check("Legendario too", stops[3].credits, TIER_THRESHOLDS.LEGENDARIO);
check(
  "the cost only ever goes up",
  stops.every((s, i) => i === 0 || s.credits > stops[i - 1].credits),
  true
);
// The one condition that is not a credit count, so it has to be said.
check("Legendario states the purchase condition", stops[3].requirement !== null, true);
check(
  "...with the real number",
  stops[3].requirement!.es.includes(String(LEGENDARIO_MIN_PERSONAL_PURCHASES)),
  true
);
check("the others have no extra condition", stops.slice(0, 3).every((s) => s.requirement === null), true);

console.log("\n  cómo se llega a cada uno");
// Esto es lo que el roadmap tiene que contestar. Antes listaba
// beneficios —qué recibes— que es otra pregunta y ya la contesta la
// tabla de niveles de abajo.
check("cada parada dice cómo llegar", stops.every((s) => s.routes.length > 0), true);
check("en los dos idiomas", stops.every((s) => s.routes.every((r) => r.es && r.en)), true);
check("la primera es entrar, no juntar nada", stops[0].routes[0].es.includes("Crea tu cuenta"), true);
// Las rutas tienen que estar en acciones, no en premios.
const ACCIONES = ["compras", "invitas", "familias", "Crea tu cuenta"];
check(
  "todo lo que dice es una acción",
  stops.every((s) => s.routes.every((r) => ACCIONES.some((a) => r.es.includes(a)))),
  true
);
// Y nada de beneficios: ni horas de espera, ni envío, ni puntos.
const PREMIOS = ["espera", "Envío", "puntos", "cumpleaños", "agotado", "temporada"];
check(
  "ninguna ruta promete un beneficio",
  stops.every((s) => s.routes.every((r) => !PREMIOS.some((b) => r.es.includes(b)))),
  true
);

console.log("\n  las rutas cuadran con los números reales");
// 4 KLC a 1 por compra = 4 compras.
check("Artesano: comprando", stops[1].routes[0].es, "4 compras");
// Un referido que compra vale 2, así que quedan 2 compras.
check("Artesano: con una invitación", stops[1].routes[1].es, "2 compras + 1 persona que invitas y compra");
// Dos familias nuevas valen 1 cada una.
check("Artesano: descubriendo", stops[1].routes[2].es, "2 compras + probar 2 familias nuevas");
check("Selecto: comprando", stops[2].routes[0].es, "10 compras");
check("Legendario: comprando", stops[3].routes[0].es, "18 compras");
check(
  "todas las rutas de un nivel suman lo mismo",
  routeCredits(stops[2].routes[0]) === 10 && routeCredits(stops[2].routes[1]) === 10,
  true
);

console.log("\n  el tope, dicho donde muerde");
// Invitar y descubrir topan en 6 al año: a partir de ahí una parte del
// camino tiene que venir de comprar, y hay que decirlo antes de que
// alguien invite a diez personas esperando llegar así.
check("Básico no necesita advertencia", stops[0].caution, null);
check("Artesano tampoco, 4 cabe en el tope", stops[1].caution, null);
check("Selecto sí", stops[2].caution !== null, true);
check("...y dice cuánto tiene que venir de comprar", stops[2].caution!.es.includes("4"), true);
check("Legendario también", stops[3].caution!.es.includes("12"), true);

console.log("\n  los cinco pilares dicen cuánto valen");
// "Cada compra cuenta" sin decir cuánto no sirve para planear nada.
check("cada uno trae su valor", PILLARS.every((p) => /\+\d+ KLC/.test(p.value)), true);
check("comprar vale 1", PILLARS.find((p) => p.en === "Buy")!.value, "+1 KLC");
check("invitar vale 2", PILLARS.find((p) => p.en === "Invite")!.value, "+2 KLC");
check("quedarse vale 2 al año", PILLARS.find((p) => p.en === "Stay")!.value, "+2 KLC");
check("...hasta 4", PILLARS.find((p) => p.en === "Stay")!.detail.es.includes("4"), true);
check("gastar es por cada $50", PILLARS.find((p) => p.en === "Spend")!.detail.es.includes("$50"), true);
check("el tope se dice una vez", BONUS_CAP_NOTE.es.includes("6 KLC"), true);

console.log("\n  the cake wait is the headline");
// Straight from her table: the thing a customer feels immediately.
check("a Básico's quickest cake", fastestCakeHours("BASICO"), 12);
check("an Artesano's", fastestCakeHours("ARTESANO"), 4);
check("a Selecto's", fastestCakeHours("SELECTO"), 2);
check(
  "it never gets slower as you climb",
  stops.every((s, i) => i === 0 || s.fastestCakeHours <= stops[i - 1].fastestCakeHours),
  true
);
// La espera del pastel sigue siendo un dato real de la tabla de
// Karyana y la tabla de niveles la muestra; el roadmap ya no, porque
// es un beneficio y el roadmap es sobre cómo llegar.
check(
  "el roadmap no habla de la espera del pastel",
  stops.some((s) => s.routes.some((r) => /h de espera|h of waiting/.test(r.es + r.en))),
  false
);

console.log("\n  the five ways up");
check("five of them", PILLARS.length, 5);
check(
  "each has a name and an explanation in both languages",
  PILLARS.every((p) => p.es && p.en && p.detail.es && p.detail.en),
  true
);
// Referral credit is for a purchase, not a signup — the addendum is firm
// about this and the page must not suggest otherwise.
const refer = PILLARS.find((p) => p.en === "Invite")!;
check("referring pays on the first purchase", refer.detail.en.includes("first purchase"), true);
check("...and says so in Spanish too", refer.detail.es.includes("primera compra"), true);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
