"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  browseManga,
  getMangaComments,
  getGenres,
  getHomeData,
  getMangaDetail,
  getMangaRatingSummary,
  getPopularManga,
  getReaderChapter,
  getStatusManga,
  getUpdatesFeed,
  type UpdatesFeedFilters,
  searchSuggestions,
} from "@/lib/api/manga-api";
import { queryKeys } from "@/lib/api/query-keys";
import type { BrowseFilters, Manga } from "@/types/domain";

export function useHomeQuery(token?: string, viewerKey = "guest") {
  return useQuery({
    queryKey: queryKeys.home(viewerKey),
    queryFn: () => getHomeData(token),
    staleTime: 1000 * 60 * 5,
    refetchOnMount: false,
  });
}

export function useBrowseQuery(filters: BrowseFilters) {
  const params = JSON.stringify(filters);

  return useQuery({
    queryKey: queryKeys.browse(params),
    queryFn: () => browseManga(filters),
    staleTime: 1000 * 60 * 3,
  });
}

export function useBrowseInfiniteQuery(filters: BrowseFilters) {
  const params = JSON.stringify(filters);

  return useInfiniteQuery({
    queryKey: queryKeys.browseInfinite(params),
    queryFn: ({ pageParam }) => browseManga({ ...filters, page: Number(pageParam) }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    staleTime: 1000 * 60 * 3,
  });
}

export function useGenresQuery() {
  return useQuery({
    queryKey: queryKeys.genres,
    queryFn: getGenres,
    staleTime: 1000 * 60 * 20,
  });
}

export function useMangaDetailQuery(slug: string) {
  return useQuery({
    queryKey: queryKeys.manga(slug),
    queryFn: () => getMangaDetail(slug),
    staleTime: 1000 * 60 * 5,
    enabled: !!slug,
  });
}

export function useMangaCommentsQuery(mangaId: string) {
  return useQuery({
    queryKey: queryKeys.mangaComments(mangaId),
    queryFn: () => getMangaComments(mangaId),
    staleTime: 1000 * 30,
    enabled: /^\d+$/.test(mangaId),
  });
}

export function useMangaRatingSummaryQuery(mangaId: string, token?: string, viewerKey = "guest") {
  return useQuery({
    queryKey: queryKeys.mangaRatingSummary(mangaId, viewerKey),
    queryFn: () => getMangaRatingSummary(mangaId, token),
    staleTime: 1000 * 30,
    enabled: /^\d+$/.test(mangaId),
  });
}

export function useReaderQuery(slug: string, chapterId: string) {
  return useQuery({
    queryKey: queryKeys.reader(slug, chapterId),
    queryFn: () => getReaderChapter(slug, chapterId),
    staleTime: 1000 * 60,
    enabled: !!slug && !!chapterId,
  });
}

export function useUpdatesQuery(filters: UpdatesFeedFilters = {}) {
  const params = JSON.stringify(filters);

  return useQuery({
    queryKey: queryKeys.updates(params),
    queryFn: () => getUpdatesFeed(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePopularQuery() {
  return useQuery({
    queryKey: queryKeys.popular,
    queryFn: getPopularManga,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStatusQuery(status: Manga["status"]) {
  return useQuery({
    queryKey: queryKeys.status(status),
    queryFn: () => getStatusManga(status),
    staleTime: 1000 * 60 * 5,
    enabled: !!status,
  });
}

export function useSuggestionQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.suggest(query),
    queryFn: () => searchSuggestions(query),
    staleTime: 1000 * 30,
    enabled: query.trim().length > 1,
  });
}
