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
  "velez", "vieyra", "villar", "zubieta", "bruno", "issaqzai", "haugh",
]);

export function guessLanguageFromName(name?: string | null): "es" | "en" {
  if (!name) return "en";
  const normalized = name.toLowerCase().trim();
  if (/[áéíóúñ¿¡]/.test(normalized)) return "es";
  const words = normalized.split(/\s+/);
  return words.some((w) => SPANISH_NAME_WORDS.has(w)) ? "es" : "en";
}
