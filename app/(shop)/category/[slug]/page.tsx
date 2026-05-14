import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/fetch";
import { categoryBySlugQuery } from "@/sanity/lib/queries";
import { CategoryView } from "@/components/product/CategoryView";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await sanityFetch<any>({
    query: categoryBySlugQuery,
    params: { slug },
    tags: ["category", "product"],
  });
  if (!data) notFound();
  return <CategoryView category={data} />;
}
