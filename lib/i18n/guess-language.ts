// Best-effort language guess for contacts with no reliable stored language
// (accounts created before we tracked it, or stuck on the DB default).
// Checks every word in the name — first name AND surname — against common
// Spanish/Latino given names and surnames. Falls back to "en" when unsure.

const SPANISH_NAME_WORDS = new Set([
  // Given names
  "jose", "juan", "carlos", "luis", "miguel", "pedro", "jesus", "javier",
  "francisco", "manuel", "alejandro", "fernando", "ricardo", "roberto",
  "eduardo", "raul", "victor", "sergio", "arturo", "rodrigo", "gustavo",
  "hector", "oscar", "ruben", "cesar", "ivan", "diego", "gerardo",
  "salvador", "santiago", "mario", "rafael", "armando", "alberto",
  "enrique", "antonio", "guillermo", "jorge", "adrian", "angel", "bruno",
  "felipe", "leonardo", "marcos", "martin", "nicolas", "pablo", "renato",
  "edgar", "erick", "emilio", "ismael", "junior", "kevin", "walter",
  "maria", "guadalupe", "juana", "rosa", "carmen", "teresa", "patricia",
  "veronica", "sandra", "monica", "claudia", "silvia", "gabriela",
  "adriana", "leticia", "yolanda", "alejandra", "elena", "diana", "laura",
  "andrea", "karina", "karla", "paola", "paloma", "marisol", "lorena",
  "irma", "norma", "esperanza", "socorro", "araceli", "beatriz",
  "cristina", "daniela", "elizabeth", "esmeralda", "fatima", "graciela",
  "ines", "jimena", "josefina", "liliana", "lucia", "magdalena",
  "marcela", "margarita", "martha", "nadia", "nena", "perla", "rocio",
  "ximena", "yesenia", "zaira", "renata", "estefania", "valeria", "vania",
  "vanessa", "viviana", "abril", "amairani", "citlali", "itzel", "jazmin",
  "montserrat", "nayeli", "yaretzi", "erika", "ivania", "jenny", "jennifer",
  "monika", "aldair", "asenet", "denis", "frida", "helen", "jisela",
  "lizbeth", "mela", "mery", "mitzi", "myriam", "naomi", "nena", "olarte",
  // Common Latino surnames
  "gonzalez", "rodriguez", "martinez", "garcia", "lopez", "hernandez",
  "sanchez", "ramirez", "torres", "flores", "rivera", "gomez", "diaz",
  "reyes", "cruz", "morales", "ortiz", "gutierrez", "chavez", "ramos",
  "vasquez", "vazquez", "castillo", "jimenez", "vargas", "castro",
  "mendoza", "aguilar", "medina", "guzman", "herrera", "nunez", "suarez",
  "contreras", "fernandez", "rojas", "munoz", "alvarez", "romero",
  "silva", "delgado", "salazar", "pena", "sandoval", "sotelo", "soto",
  "zarate", "zavala", "navarrete", "esquivel", "fragoso", "moreno",
  "puga", "ornelas", "olarte", "escamilla", "alcalde", "sandoval",
  "correa", "corleto", "felix", "figueroa", "gallegos", "guerrero",
  "ibarra", "lara", "lemus", "macias", "maganga", "malacara", "marquez",
  "meza", "olagaray", "osuna", "sotoromo", "tejano", "torresflores",
  "velez", "vieyra", "villar", "zubieta",
  // Added after real customers were guessed wrong: Pérez and Cuéllar are
  // among the most common Spanish surnames and were missing entirely.
  "perez", "cuellar", "ruiz", "ortega", "vega", "campos", "duran", "mendez",
  "cabrera", "acosta", "rios", "cordova", "carrillo", "valdez", "cervantes",
  "espinoza", "estrada", "fuentes", "leon", "luna", "maldonado", "marin",
  "miranda", "montoya", "nava", "padilla", "palacios", "parra", "pineda",
  "ponce", "quintero", "rangel", "rosales", "salinas", "serrano", "solis",
  "tapia", "trejo", "trujillo", "uribe", "valencia", "velasco", "villanueva",
  "zamora", "zuniga", "arias", "avila", "barrera", "bautista", "benitez",
  "bernal", "bonilla", "calderon", "camacho", "cardenas", "carrasco",
  "cantu", "cisneros", "cuevas", "davila", "dominguez", "duarte", "escobar",
  "esparza", "franco", "galindo", "gallardo", "garza", "guevara", "juarez",
  "lozano", "lugo", "mata", "mejia", "molina", "montes", "mora", "murillo",
  "ochoa", "orozco", "pacheco", "paredes", "portillo", "prieto", "robles",
  "rosas", "rubio", "salas", "saldana", "salgado", "santana", "santos",
  "sierra", "solano", "sosa", "tellez", "toledo", "tovar", "valle",
  "vallejo", "varela", "vera", "villa", "villalobos", "villarreal",
  "villegas", "yanez", "zapata", "zepeda",
]);

/**
 * Given names that are just as ordinary in English. Matching on these alone
 * sent "Andrea Martens" and "Kevin Walsh" Spanish mail — a first name is weak
 * evidence, and on its own it was being treated as proof.
 */
const AMBIGUOUS_GIVEN_NAMES = new Set([
  "andrea", "bruno", "kevin", "jennifer", "jenny", "denis", "helen", "naomi",
  "junior", "walter", "elizabeth", "diana", "laura", "monika", "erika",
  "vanessa", "nadia", "frida", "mery", "myriam", "nena", "mario", "angel",
  "daniela", "cristina", "emilio", "leonardo", "martin", "nicolas", "pablo",
  "renata", "silva", "felix", "santiago", "marcos", "adrian", "ivan",
]);

/**
 * A surname carries the family, a first name only a fashion — so a Spanish
 * surname decides it, while a Spanish first name only counts when it isn't
 * one of the names both languages use.
 */
export function guessLanguageFromName(name?: string | null): "es" | "en" {
  if (!name) return "en";

  const normalized = name.toLowerCase().trim();

  // Someone typed an accent: nobody does that by accident.
  if (/[áéíóúüñ¿¡]/.test(normalized)) return "es";

  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "en";

  // Spanish names often carry two surnames and particles ("de la", "del").
  // Any word matching a known surname is enough.
  const surnameCandidates = words.slice(1);
  if (surnameCandidates.some((w) => SPANISH_NAME_WORDS.has(w))) return "es";

  const given = words[0];
  if (SPANISH_NAME_WORDS.has(given) && !AMBIGUOUS_GIVEN_NAMES.has(given)) {
    return "es";
  }

  return "en";
}
