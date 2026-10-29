import { redirect } from "next/navigation";
import { withQuery } from "@/lib/routing/forward-query";

/**
 * /account is a doorway to the overview.
 *
 * It used to redirect with a bare path, which drops the query string — so
 * `/account?welcome=1` arrived with no `welcome`, and the banner that says the
 * account was created never appeared.
 */
export default async function AccountIndex({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(withQuery("/account/overview", await searchParams));
}
