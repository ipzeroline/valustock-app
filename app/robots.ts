import type { MetadataRoute } from "next";

const SITE_URL = "https://valustock.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/AdminConsole",
          "/api",
          "/account",
          "/dashboard",
          "/login",
          "/portfolio",
          "/watchlist",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
