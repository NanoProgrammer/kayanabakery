import { prisma } from "@/lib/prisma";
import NominationForm from "./NominationForm";

/**
 * The page is a server component purely so the counter arrives with the HTML —
 * a number that pops in a second late looks broken, and this one is the whole
 * point of the section. Revalidated instead of fully dynamic so the page stays
 * cached; a nomination made right now also updates the number in place through
 * the form's response, so nobody waits on the window to see their own.
 */
export const revalidate = 60;

export default async function ReferAFriendPage() {
  const count = await prisma.nomination.count().catch(() => 0);

  return <NominationForm initialCount={count} />;
}
