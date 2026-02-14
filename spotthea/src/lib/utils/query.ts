import type { BrowseFilters, ContentRating, MangaStatus, MangaType } from "@/types/domain";

interface SearchParamLike {
  get(name: string): string | null;
}

function splitList(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNumber(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toCountry(value: string | null): BrowseFilters["country"] {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "KR" || normalized === "JP" || normalized === "CN" || normalized === "ID") {
    return normalized;
  }

  return undefined;
}

function toSort(value: string | null): BrowseFilters["sort"] {
  if (value === "latest" || value === "oldest" || value === "rating" || value === "az" || value === "popular") {
    return value;
  }

  return "popular";
}

export function parseBrowseFilters(searchParams: SearchParamLike): BrowseFilters {
  const genres = splitList(searchParams.get("genres"));
  const status = splitList(searchParams.get("status")) as MangaStatus[];
  const types = splitList(searchParams.get("types")) as MangaType[];
  const contentRating = splitList(searchParams.get("content_rating")) as ContentRating[];

  return {
    query: searchParams.get("q") ?? undefined,
    genres: genres.length ? genres : undefined,
    status: status.length ? status : undefined,
    types: types.length ? types : undefined,
    contentRating: contentRating.length ? contentRating : undefined,
    country: toCountry(searchParams.get("country")),
    yearFrom: toNumber(searchParams.get("year_from")),
    yearTo: toNumber(searchParams.get("year_to")),
    sort: toSort(searchParams.get("sort")),
    page: toNumber(searchParams.get("page")) ?? 1,
    pageSize: toNumber(searchParams.get("page_size")) ?? 18,
  };
}

export function encodeBrowseFilters(filters: BrowseFilters) {
  const params = new URLSearchParams();

  if (filters.query?.trim()) params.set("q", filters.query.trim());
  if (filters.genres?.length) params.set("genres", filters.genres.join(","));
  if (filters.status?.length) params.set("status", filters.status.join(","));
  if (filters.types?.length) params.set("types", filters.types.join(","));
  if (filters.contentRating?.length) params.set("content_rating", filters.contentRating.join(","));
  if (filters.country && filters.country !== "ALL") params.set("country", filters.country);
  if (filters.yearFrom) params.set("year_from", String(filters.yearFrom));
  if (filters.yearTo) params.set("year_to", String(filters.yearTo));
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  if (filters.pageSize && filters.pageSize !== 18) params.set("page_size", String(filters.pageSize));

  return params;
}
