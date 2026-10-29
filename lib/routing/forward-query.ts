/**
 * Carries a page's query string through a server-side redirect.
 *
 * `redirect("/account/overview")` drops it, so `/account?welcome=1` arrived at
 * the overview with no `welcome` and the banner saying the account had been
 * created never appeared. Anything on the way in goes through.
 */
export function withQuery(
  path: string,
  params: Record<string, string | string[] | undefined>
): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((v) => query.append(key, v));
    else if (value !== undefined) query.set(key, value);
  }

  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}
