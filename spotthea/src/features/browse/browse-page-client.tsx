"use client";

import { ArrowRight, Filter, LayoutGrid, List, RotateCcw, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BrowseGridCard, BrowseListCard } from "@/components/domain/browse-manga-cards";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrowseInfiniteQuery, useGenresQuery } from "@/lib/api/hooks";
import { encodeBrowseFilters, parseBrowseFilters } from "@/lib/utils/query";
import type { BrowseFilters, ContentRating, MangaStatus, MangaType } from "@/types/domain";

const GRID_PAGE_SIZE = 10;
const LIST_PAGE_SIZE = 9;

function toggleListValue<T extends string>(values: T[] | undefined, value: T): T[] {
  if (!values || values.length === 0) {
    return [value];
  }

  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function normalizeQueryForApi(query: string | undefined) {
  const normalized = query?.trim() ?? "";
  if (!normalized) {
    return undefined;
  }

  return normalized.length >= 2 ? normalized : undefined;
}

export default function BrowsePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [viewModeTouched, setViewModeTouched] = useState(false);

  const isMobileViewport = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const mediaQuery = window.matchMedia("(max-width: 767px)");
      const onChange = () => onStoreChange();
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false),
    () => false,
  );

  const effectiveViewMode: "grid" | "list" = !viewModeTouched && isMobileViewport ? "list" : viewMode;
  const pageSize = effectiveViewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  const filters = useMemo(() => parseBrowseFilters(searchParams), [searchParams]);
  const { data: genres = [] } = useGenresQuery();

  const applyFilters = useCallback(
    (patch: Partial<BrowseFilters>) => {
      const next: BrowseFilters = {
        ...filters,
        ...patch,
        page: 1,
        pageSize: undefined,
      };

      const params = encodeBrowseFilters({
        ...next,
        query: next.query?.trim() || undefined,
        page: undefined,
        pageSize: undefined,
      });

      params.delete("page");
      params.delete("page_size");

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [filters, pathname, router],
  );

  const resetFilters = useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  const runSearch = useCallback(
    (raw: string) => {
      applyFilters({ query: raw.trim() || undefined });
    },
    [applyFilters],
  );

  const queueSearch = useCallback(
    (raw: string) => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        runSearch(raw);
      }, 320);
    },
    [runSearch],
  );

  useEffect(
    () => () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    },
    [],
  );

  const browseFilters = useMemo<BrowseFilters>(
    () => ({
      query: normalizeQueryForApi(filters.query),
      genres: filters.genres,
      status: filters.status,
      types: filters.types,
      contentRating: filters.contentRating,
      country: filters.country,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      sort: filters.sort ?? "popular",
      pageSize,
    }),
    [filters.contentRating, filters.country, filters.genres, filters.query, filters.sort, filters.status, filters.types, filters.yearFrom, filters.yearTo, pageSize],
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
  } = useBrowseInfiniteQuery(browseFilters);

  const filterKey = useMemo(() => JSON.stringify(browseFilters), [browseFilters]);

  const items = useMemo(() => {
    const pages = data?.pages ?? [];
    const seen = new Set<string>();
    const merged: NonNullable<(typeof pages)[number]>["items"] = [];

    for (const page of pages) {
      for (const manga of page.items) {
        if (seen.has(manga.id)) {
          continue;
        }

        seen.add(manga.id);
        merged.push(manga);
      }
    }

    return merged;
  }, [data]);

  const total = data?.pages[0]?.total ?? 0;
  const queryLength = filters.query?.trim().length ?? 0;

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isFetchingNextPage) {
          return;
        }

        void fetchNextPage();
      },
      {
        rootMargin: "420px 0px",
      },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, filterKey, hasNextPage, isFetchingNextPage]);

  return (
    <PageShell className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Home / Browse</p>
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Browse Manga</h1>
        <p className="text-sm text-[var(--text-secondary)]">Cari manga dengan mode grid/list, filter panel icon, dan infinite scroll.</p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <form
            className="flex min-h-14 flex-1 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              runSearch(String(form.get("q") ?? ""));
            }}
          >
            <Search size={20} className="text-[var(--text-muted)]" />
            <input
              key={filters.query ?? ""}
              name="q"
              defaultValue={filters.query ?? ""}
              onChange={(event) => queueSearch(event.target.value)}
              placeholder="Type to search (min 2 chars)..."
              className="h-12 w-full bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-hover)]"
              aria-label="Search"
            >
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                effectiveViewMode === "list"
                  ? "border-[#3f7dff] bg-[#3f7dff] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
              }`}
              onClick={() => {
                setViewMode("list");
                setViewModeTouched(true);
              }}
              aria-label="List view"
            >
              <List size={18} />
            </button>
            <button
              type="button"
              className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
                effectiveViewMode === "grid"
                  ? "border-[#3f7dff] bg-[#3f7dff] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
              }`}
              onClick={() => {
                setViewMode("grid");
                setViewModeTouched(true);
              }}
              aria-label="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)]"
              onClick={() => setFilterOpen(true)}
              aria-label="Open filters"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <p>
            Menampilkan {items.length} dari {total} manga
          </p>
          {queryLength > 0 && queryLength < 2 ? <p>Ketik minimal 2 karakter untuk mengaktifkan filter pencarian.</p> : null}
        </div>
      </section>

      {isError ? <ErrorState message="Gagal memuat data browse." onRetry={() => refetch()} /> : null}

      {isLoading ? (
        <div className={effectiveViewMode === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-5" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
          {Array.from({ length: pageSize }).map((_, index) => (
            <Skeleton key={index} className={effectiveViewMode === "grid" ? "aspect-[3/4] w-full rounded-2xl" : "h-[315px] rounded-2xl"} />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError ? (
        items.length > 0 ? (
          <>
            {effectiveViewMode === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                {items.map((manga) => (
                  <BrowseGridCard key={manga.id} manga={manga} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((manga) => (
                  <BrowseListCard key={manga.id} manga={manga} />
                ))}
              </div>
            )}

            {isFetching && !isFetchingNextPage ? <p className="text-xs text-[var(--text-muted)]">Memuat data terbaru...</p> : null}

            <div ref={loadMoreRef} className="h-6" />

            <div className="flex justify-center">
              {isFetchingNextPage ? (
                <p className="text-sm text-[var(--text-muted)]">Memuat manga berikutnya...</p>
              ) : hasNextPage ? (
                <Button variant="secondary" onClick={() => void fetchNextPage()}>
                  Muat Lagi
                </Button>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">Semua manga sudah ditampilkan.</p>
              )}
            </div>
          </>
        ) : (
          <EmptyState title="Tidak ada manga" description="Coba ubah kata kunci atau kombinasi filter." ctaLabel="Reset Browse" ctaHref="/browse" />
        )
      ) : null}

      {filterOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 p-0 md:p-4" onMouseDown={() => setFilterOpen(false)}>
          <aside
            className="ml-auto h-full w-full max-w-md overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl md:rounded-2xl md:border"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-primary)]">Filter Browse</h2>
                <p className="text-xs text-[var(--text-muted)]">Semua filter diterapkan realtime ke katalog.</p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)]"
                onClick={() => setFilterOpen(false)}
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Sort</p>
                <Select value={filters.sort ?? "popular"} onChange={(event) => applyFilters({ sort: event.target.value as BrowseFilters["sort"] })}>
                  <option value="popular">Popular</option>
                  <option value="latest">Latest Update</option>
                  <option value="oldest">Oldest Update</option>
                  <option value="rating">Rating</option>
                  <option value="az">A-Z</option>
                </Select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Country</p>
                <Select value={filters.country ?? "ALL"} onChange={(event) => applyFilters({ country: event.target.value as BrowseFilters["country"] })}>
                  <option value="ALL">Semua Negara</option>
                  <option value="KR">KR</option>
                  <option value="JP">JP</option>
                  <option value="CN">CN</option>
                  <option value="ID">ID</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Year from"
                  defaultValue={filters.yearFrom ? String(filters.yearFrom) : ""}
                  onBlur={(event) =>
                    applyFilters({
                      yearFrom: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Year to"
                  defaultValue={filters.yearTo ? String(filters.yearTo) : ""}
                  onBlur={(event) =>
                    applyFilters({
                      yearTo: event.target.value ? Number(event.target.value) : undefined,
                    })
                  }
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Genre</p>
                <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-[var(--border)] p-2">
                  {genres.map((genre) => {
                    const checked = filters.genres?.includes(genre.slug) ?? false;
                    return (
                      <label key={genre.slug} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-soft)]">
                        <span>{genre.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            applyFilters({
                              genres: toggleListValue(filters.genres, genre.slug),
                            })
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Status</p>
                <div className="space-y-2">
                  {(["ongoing", "completed", "hiatus"] as MangaStatus[]).map((status) => (
                    <label key={status} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-soft)]">
                      <span>{status}</span>
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status) ?? false}
                        onChange={() =>
                          applyFilters({
                            status: toggleListValue(filters.status, status),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Type</p>
                <div className="space-y-2">
                  {(["manga", "manhwa", "manhua"] as MangaType[]).map((type) => (
                    <label key={type} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-soft)]">
                      <span>{type}</span>
                      <input
                        type="checkbox"
                        checked={filters.types?.includes(type) ?? false}
                        onChange={() =>
                          applyFilters({
                            types: toggleListValue(filters.types, type),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Content Rating</p>
                <div className="space-y-2">
                  {(["safe", "mature"] as ContentRating[]).map((rating) => (
                    <label key={rating} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-soft)]">
                      <span>{rating}</span>
                      <input
                        type="checkbox"
                        checked={filters.contentRating?.includes(rating) ?? false}
                        onChange={() =>
                          applyFilters({
                            contentRating: toggleListValue(filters.contentRating, rating),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <footer className="sticky bottom-0 mt-6 grid grid-cols-2 gap-2 border-t border-[var(--border)] bg-[var(--surface)] pt-4">
              <Button variant="secondary" onClick={resetFilters}>
                <RotateCcw size={14} />
                Reset
              </Button>
              <Button onClick={() => setFilterOpen(false)}>Tutup</Button>
            </footer>
          </aside>
        </div>
      ) : null}
    </PageShell>
  );
}
