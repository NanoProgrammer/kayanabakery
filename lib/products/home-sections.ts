/**
 * Qué es un pastel y qué es una caja de pan, para la portada.
 *
 * La primera versión de esto preguntaba en GROQ por el slug exacto
 * `cakes`. Si la categoría en Sanity se llama de otra forma —y yo no
 * puedo abrir Sanity para comprobarlo— la consulta devuelve cero y la
 * sección entera no se pinta. El cliente ve la portada igual que antes
 * y parece que nadie hizo nada.
 *
 * Adivinar un dato que no puedo verificar fue el error. Esto deja de
 * adivinar: un producto es pastel si CUALQUIERA de estas tres cosas es
 * cierta, no si el slug coincide.
 *
 *   1. Está en una categoría cuyo slug dice pastel.
 *   2. Está en una categoría cuyo NOMBRE dice pastel, en los dos idiomas.
 *   3. Su nombre es uno de los 16 pasteles reales del catálogo, leídos
 *      del sitio de Karyana (lib/products/cake-families.ts).
 *
 * La tercera es la red de seguridad que no depende de cómo esté
 * configurado Sanity. Mientras Karyana no cambie el NOMBRE de sus
 * pasteles, la portada los encuentra.
 */
import { familyForProduct } from "./cake-families";
import { unitsSold, hasSalesData, type SalesBySlug } from "./bestsellers";

export type HomeProduct = {
  _id: string;
  name: string;
  nameEs?: string | null;
  slug?: string | null;
  image?: unknown;
  stockQuantity?: number | null;
  displayOrder?: number | null;
  categories?: { slug?: string | null; name?: string | null }[] | null;
};

function norm(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function categoryText(p: HomeProduct): string[] {
  return (p.categories ?? [])
    .flatMap((c) => [c?.slug, c?.name])
    .map(norm)
    .filter(Boolean);
}

/**
 * Un topper no es un pastel por más que se llame "Topper Cake".
 *
 * Es plástico. Ya apareció una vez en Featured Categories y Karyana lo
 * reportó; no va a volver a colarse por la puerta de enfrente.
 */
function isTopper(p: HomeProduct): boolean {
  const name = norm(p.name) + " " + norm(p.nameEs) + " " + norm(p.slug);
  if (name.includes("topper")) return true;
  return categoryText(p).some((t) => t.includes("topper"));
}

const CAKE_WORDS = ["cake", "pastel", "confection", "tres leches", "3 leches"];
const BOX_WORDS = ["box", "caja", "assortment", "surtid", "pack"];

/** Pastel: por categoría, por nombre de categoría, o por ser uno de los suyos. */
export function isCakeProduct(p: HomeProduct): boolean {
  if (isTopper(p)) return false;
  const cats = categoryText(p);
  if (cats.some((t) => CAKE_WORDS.some((w) => t.includes(w)))) return true;
  // La red de seguridad: los 16 pasteles reales, por nombre.
  return !!familyForProduct({ slug: p.slug ?? null, name: p.name });
}

/** Caja de pan surtido: por categoría, por nombre de categoría, o por su nombre. */
export function isBreadBoxProduct(p: HomeProduct): boolean {
  if (isTopper(p)) return false;
  // Un pastel en una caja sigue siendo un pastel: va en la otra sección.
  if (familyForProduct({ slug: p.slug ?? null, name: p.name })) return false;
  const cats = categoryText(p);
  if (cats.some((t) => BOX_WORDS.some((w) => t.includes(w)))) return true;
  const name = norm(p.name) + " " + norm(p.nameEs) + " " + norm(p.slug);
  return BOX_WORDS.some((w) => name.includes(w));
}

/**
 * Lo más vendido primero, igual que el shop.
 *
 * La portada ordenaba por el orden de Karyana y el shop por ventas
 * reales, así que el "más vendido" de una no era el de la otra. Si no
 * hay ventas que leer —base caída, o build— se vuelve a su orden, que
 * es exactamente lo que hacía antes.
 *
 * El id desempata siempre, para que la fila no baile entre recargas.
 */
function ranked<T extends HomeProduct>(items: T[], sales?: SalesBySlug | null): T[] {
  const byHer = (a: T, b: T) =>
    (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999) || a._id.localeCompare(b._id);
  if (!hasSalesData(sales)) return [...items].sort(byHer);
  return [...items].sort(
    (a, b) => unitsSold(sales, b.slug) - unitsSold(sales, a.slug) || byHer(a, b)
  );
}

/** Los pasteles de la portada. Solo los que tienen foto: un hueco gris no vende. */
export function selectCakes<T extends HomeProduct>(
  products: readonly T[],
  sales?: SalesBySlug | null
): T[] {
  return ranked(products.filter((p) => isCakeProduct(p) && !!p.image), sales);
}

/** Las cajas de la portada, máximo cuatro para que la fila quede pareja. */
export function selectBreadBoxes<T extends HomeProduct>(
  products: readonly T[],
  sales?: SalesBySlug | null,
  limit = 4
): T[] {
  return ranked(products.filter((p) => isBreadBoxProduct(p) && !!p.image), sales).slice(
    0,
    Math.max(0, limit)
  );
}
