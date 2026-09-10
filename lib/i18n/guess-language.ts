// Best-effort language guess for contacts with no stored preferredLang
// (accounts created before we started tracking it). Falls back to "en".

const SPANISH_FIRST_NAMES = new Set([
  "jose", "juan", "carlos", "luis", "miguel", "pedro", "jesus", "javier",
  "francisco", "manuel", "alejandro", "fernando", "ricardo", "roberto",
  "eduardo", "raul", "victor", "sergio", "arturo", "rodrigo", "gustavo",
  "hector", "oscar", "ruben", "cesar", "ivan", "diego", "gerardo",
  "salvador", "santiago", "mario", "rafael", "armando", "alberto",
  "enrique", "antonio", "guillermo", "jorge", "adrian", "angel", "bruno",
  "felipe", "leonardo", "marcos", "martin", "nicolas", "pablo", "renato",
  "edgar", "erick",
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
  "montserrat", "nayeli", "yaretzi", "erika", "ivania",
]);

export function guessLanguageFromName(name?: string | null): "es" | "en" {
  if (!name) return "en";
  const normalized = name.toLowerCase().trim();
  if (/[áéíóúñ¿¡]/.test(normalized)) return "es";
  const firstName = normalized.split(/\s+/)[0];
  return SPANISH_FIRST_NAMES.has(firstName) ? "es" : "en";
}
