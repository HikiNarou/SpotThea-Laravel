import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/me", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/search"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}