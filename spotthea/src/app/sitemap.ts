import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants/site";
import { catalogData } from "@/lib/data/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseRoutes = ["", "/browse", "/genre", "/updates", "/popular", "/ongoing", "/completed", "/about", "/dmca", "/privacy", "/terms", "/contact", "/report"];

  const staticEntries = baseRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "hourly" : "daily",
    priority: route === "" ? 1 : 0.7,
  })) satisfies MetadataRoute.Sitemap;

  const mangaEntries = catalogData.mangas.map((manga) => ({
    url: `${SITE_URL}/manga/${manga.slug}`,
    lastModified: new Date(manga.updatedAt),
    changeFrequency: "daily",
    priority: 0.9,
  })) satisfies MetadataRoute.Sitemap;

  const genreEntries = catalogData.getGenres().map((genre) => ({
    url: `${SITE_URL}/genre/${genre.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.65,
  })) satisfies MetadataRoute.Sitemap;

  return [...staticEntries, ...mangaEntries, ...genreEntries];
}