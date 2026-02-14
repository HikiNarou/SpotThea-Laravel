"use client";

import type { BrowseFilters, Manga, MangaCardData, MangaComment, MangaDetail, PagedResult, SuggestionItem } from "@/types/domain";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api").replace(/\/+$/, "");

export interface HomeContinueReadingEntry {
  mangaId: string;
  chapterId: string;
  pageIndex: number;
  progressPct: number;
  updatedAt: string;
  manga?: Manga;
  chapter?: MangaCardData["latestChapter"];
}

export interface HomeData {
  featured: Manga[];
  latestUpdates: Array<{ manga: Manga; chapter: MangaCardData["latestChapter"] }>;
  tabs: {
    popular: Manga[];
    latest: Manga[];
    ongoing: Manga[];
    completed: Manga[];
  };
  genres: Array<{ slug: string; count: number; label: string }>;
  continueReading?: HomeContinueReadingEntry[];
}

export interface MangaRatingSummary {
  rating: number;
  count: number;
  userRating: number | null;
}

export type UpdatesFeedCountryFilter = "ALL" | "KR" | "JP" | "CN" | "ID";
export type UpdatesFeedOrder = "latest" | "oldest";

export interface UpdatesFeedFilters {
  q?: string;
  order?: UpdatesFeedOrder;
  genre?: string;
  country?: UpdatesFeedCountryFilter;
  page?: number;
  pageSize?: number;
}

export type UpdatesFeedItem = { manga: Manga; chapter: MangaCardData["latestChapter"] };

function toSearchParams(input: Record<string, unknown>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      params.set(key, value.join(","));
      continue;
    }

    params.set(key, String(value));
  }

  return params;
}

async function apiGet<T>(path: string, query?: Record<string, unknown>, token?: string): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (query) {
    const params = toSearchParams(query);
    params.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: token ? "no-store" : "default",
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function getHomeData(token?: string): Promise<HomeData> {
  const payload = await apiGet<HomeData>("/home", undefined, token);
  return {
    ...payload,
    genres: payload.genres.map((genre) => ({
      slug: genre.slug,
      count: genre.count,
      label: genre.label,
    })),
  };
}

export async function browseManga(filters: BrowseFilters = {}): Promise<PagedResult<MangaCardData>> {
  return await apiGet<PagedResult<MangaCardData>>("/browse", {
    query: filters.query,
    genres: filters.genres,
    status: filters.status,
    types: filters.types,
    contentRating: filters.contentRating,
    country: filters.country,
    yearFrom: filters.yearFrom,
    yearTo: filters.yearTo,
    sort: filters.sort,
    page: filters.page,
    pageSize: filters.pageSize,
  });
}

export async function getGenres() {
  const genres = await apiGet<Array<{ slug: string; count: number; label: string }>>("/genres");
  return genres.map((genre) => ({
    slug: genre.slug,
    count: genre.count,
    label: genre.label,
  }));
}

export async function getMangaDetail(slug: string): Promise<MangaDetail | null> {
  try {
    return await apiGet<MangaDetail>(`/manga/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function getReaderChapter(slug: string, chapterId: string) {
  try {
    return await apiGet<{
      manga: Manga;
      chapter: MangaCardData["latestChapter"];
      prevChapter: MangaCardData["latestChapter"] | null;
      nextChapter: MangaCardData["latestChapter"] | null;
      chapterOptions: MangaCardData["latestChapter"][];
    }>(`/read/${encodeURIComponent(slug)}/${encodeURIComponent(chapterId)}`);
  } catch {
    return null;
  }
}

export async function getMangaComments(mangaId: string): Promise<MangaComment[]> {
  return await apiGet<MangaComment[]>(`/manga/${encodeURIComponent(mangaId)}/comments`);
}

export async function getMangaRatingSummary(mangaId: string, token?: string): Promise<MangaRatingSummary> {
  return await apiGet<MangaRatingSummary>(`/manga/${encodeURIComponent(mangaId)}/rating-summary`, undefined, token);
}

export async function getPopularManga() {
  return await apiGet<Manga[]>("/popular");
}

export async function getStatusManga(status: Manga["status"]) {
  return await apiGet<Manga[]>(`/status/${encodeURIComponent(status)}`);
}

export async function getUpdatesFeed(filters: UpdatesFeedFilters = {}) {
  return await apiGet<PagedResult<UpdatesFeedItem>>("/updates", {
    q: filters.q,
    order: filters.order,
    genre: filters.genre,
    country: filters.country,
    page: filters.page,
    pageSize: filters.pageSize,
  });
}

export async function searchSuggestions(query: string): Promise<SuggestionItem[]> {
  if (!query.trim()) {
    return [];
  }

  return await apiGet<SuggestionItem[]>("/search/suggest", { q: query, limit: 8 });
}
