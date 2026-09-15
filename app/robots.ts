import type { MetadataRoute } from "next";

const BASE_URL = "https://www.karyanabakery.ca";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or transactional areas — no reason to crawl or index them.
      disallow: [
        "/api/",
        "/studio/",
        "/admin/",
        "/account/",
        "/checkout",
        "/cart",
        "/login",
        "/register",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
