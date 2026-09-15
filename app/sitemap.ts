import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { sanityFetch } from "@/sanity/lib/fetch";
import {
  sitemapProductsQuery,
  sitemapCategoriesQuery,
} from "@/sanity/lib/queries";

/**
 * Canonical domain for search engines. Hardcoded to .ca on purpose — the site
 * also answers on karyanabakery.com, and NEXT_PUBLIC_APP_URL points there, so
 * building the sitemap from that env var advertised the .com mirror as the
 * indexable version of every page.
 */
const BASE_URL = "https://www.karyanabakery.ca";

type SitemapDoc = { slug: string; _updatedAt?: string };

/** Public, indexable pages. Account, admin, checkout, cart, auth and the
 *  Studio are deliberately excluded — they're private or transactional. */
const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/memberships", priority: 0.9, changeFrequency: "weekly" },
  { path: "/custom-cake", priority: 0.9, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/events", priority: 0.7, changeFrequency: "weekly" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
  { path: "/how-to-order", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/refer-a-friend", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ambassador", priority: 0.5, changeFrequency: "monthly" },
  { path: "/track-order", priority: 0.4, changeFrequency: "yearly" },
  { path: "/cake-terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A Sanity outage shouldn't take the whole sitemap down with it — fall back
  // to the static pages rather than returning a 500 to a crawler.
  const [products, categories] = await Promise.all([
    sanityFetch<SitemapDoc[]>({
      query: sitemapProductsQuery,
      tags: ["product"],
    }).catch(() => [] as SitemapDoc[]),
    sanityFetch<SitemapDoc[]>({
      query: sitemapCategoriesQuery,
      tags: ["category"],
    }).catch(() => [] as SitemapDoc[]),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${BASE_URL}/category/${encodeSlug(c.slug)}`,
    lastModified: c._updatedAt ? new Date(c._updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/product/${encodeSlug(p.slug)}`,
    lastModified: p._updatedAt ? new Date(p._updatedAt) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...categoryEntries,
    ...productEntries,
    ...blogEntries,
  ];
}

/** Keeps "/" as a path separator (some slugs contain one) while escaping
 *  anything else that would be invalid in a URL. */
function encodeSlug(slug: string): string {
  return slug.split("/").map(encodeURIComponent).join("/");
}
