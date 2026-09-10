import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog/posts";

const STATIC_ROUTES = [
  "",
  "/shop",
  "/memberships",
  "/events",
  "/about",
  "/contact",
  "/faq",
  "/how-to-order",
  "/custom-cake",
  "/ambassador",
  "/refer-a-friend",
  "/cake-terms",
  "/terms",
  "/privacy",
  "/track-order",
  "/blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...blogEntries];
}
