"use client";

import Link from "next/link";
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { BrowseGridCard, BrowseListCard } from "@/components/domain/browse-manga-cards";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBrowseQuery } from "@/lib/api/hooks";
import { titleCase } from "@/lib/utils/format";
import type { BrowseFilters } from "@/types/domain";

type GenreCountryFilter = "ALL" | "KR" | "JP" | "CN" | "ID";
type GenreOrderFilter = "latest" | "oldest";

const PAGE_SIZE = 15;

function toPositiveInt(value: string | null, fallback = 1): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.floor(parsed));
}

function normalizeCountry(value: string | null): GenreCountryFilter {
  const normalized = (value ?? "ALL").toUpperCase();
  if (normalized === "KR" || normalized === "JP" || normalized === "CN" || normalized === "ID") {
    return normalized;
  }

  return "ALL";
}

function normalizeOrder(value: string | null): GenreOrderFilter {
  return value === "oldest" ? "oldest" : "latest";
}

export default function GenreDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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

  const currentQuery = useMemo(() => (searchParams.get("q") ?? "").trim(), [searchParams]);
  const currentOrder = useMemo(() => normalizeOrder(searchParams.get("order")), [searchParams]);
  const currentCountry = useMemo(() => normalizeCountry(searchParams.get("country")), [searchParams]);
  const currentPage = useMemo(() => toPositiveInt(searchParams.get("page"), 1), [searchParams]);

  const replaceFilters = useCallback(
    (next: Partial<{ q: string; order: GenreOrderFilter; country: GenreCountryFilter; page: number }>) => {
      const paramsCopy = new URLSearchParams(searchParams.toString());

      if (next.q !== undefined) {
        const normalized = next.q.trim();
        if (normalized) {
          paramsCopy.set("q", normalized);
        } else {
          paramsCopy.delete("q");
        }
      }

      if (next.order !== undefined) {
        if (next.order === "latest") {
          paramsCopy.delete("order");
        } else {
          paramsCopy.set("order", next.order);
        }
      }

      if (next.country !== undefined) {
        if (next.country === "ALL") {
          paramsCopy.delete("country");
        } else {
          paramsCopy.set("country", next.country);
        }
      }

      if (next.page !== undefined) {
        if (next.page <= 1) {
          paramsCopy.delete("page");
        } else {
          paramsCopy.set("page", String(next.page));
        }
      }

      const queryString = paramsCopy.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const browseFilters = useMemo<BrowseFilters>(
    () => ({
      query: currentQuery || undefined,
      genres: [slug],
      country: currentCountry,
      sort: currentOrder === "oldest" ? "oldest" : "latest",
      page: currentPage,
      pageSize: PAGE_SIZE,
    }),
    [currentCountry, currentOrder, currentPage, currentQuery, slug],
  );

  const { data, isLoading, isError, isFetching, refetch } = useBrowseQuery(browseFilters);

  const summary = useMemo(() => {
    if (!data || data.total === 0) {
      return "0 hasil";
    }

    const start = (data.page - 1) * data.pageSize + 1;
    const end = Math.min(data.total, start + data.pageSize - 1);
    return `${start}-${end} dari ${data.total}`;
  }, [data]);

  const makePageHref = useCallback(
    (nextPage: number) => {
      const paramsCopy = new URLSearchParams(searchParams.toString());

      if (nextPage <= 1) {
        paramsCopy.delete("page");
      } else {
        paramsCopy.set("page", String(nextPage));
      }

      const queryString = paramsCopy.toString();
      return queryString ? `${pathname}?${queryString}` : pathname;
    },
    [pathname, searchParams],
  );

  return (
    <PageShell className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">
          <Link href="/">Home</Link> / <Link href="/genre">Genre</Link> / {titleCase(slug)}
        </p>
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Genre: {titleCase(slug)}</h1>
        <p className="text-sm text-[var(--text-secondary)]">Filter katalog berdasarkan judul, negara asal, dan urutan update.</p>
      </header>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--text-muted)]">{summary}</p>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
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
                <List size={16} />
              </button>
              <button
                type="button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
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
                <LayoutGrid size={16} />
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                replaceFilters({
                  q: "",
                  order: "latest",
                  country: "ALL",
                  page: 1,
                })
              }
            >
              Reset Filter
            </Button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-3">
          <Input
            value={currentQuery}
            onChange={(event) =>
              replaceFilters({
                q: event.target.value,
                page: 1,
              })
            }
            placeholder="Cari judul manga..."
          />
          <Select
            value={currentOrder}
            onChange={(event) =>
              replaceFilters({
                order: normalizeOrder(event.target.value),
                page: 1,
              })
            }
          >
            <option value="latest">Latest Updates</option>
            <option value="oldest">Oldest Updates</option>
          </Select>
          <Select
            value={currentCountry}
            onChange={(event) =>
              replaceFilters({
                country: normalizeCountry(event.target.value),
                page: 1,
              })
            }
          >
            <option value="ALL">Semua Negara</option>
            <option value="KR">KR</option>
            <option value="JP">JP</option>
            <option value="CN">CN</option>
            <option value="ID">ID</option>
          </Select>
        </div>

        {isFetching && !isLoading ? <p className="text-xs text-[var(--text-muted)]">Memuat hasil terbaru...</p> : null}
      </section>

      {isLoading ? (
        <div className={effectiveViewMode === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-5" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <Skeleton key={index} className={effectiveViewMode === "grid" ? "aspect-[3/4] w-full rounded-2xl" : "h-[160px] rounded-2xl"} />
          ))}
        </div>
      ) : null}

      {isError ? <ErrorState message="Gagal memuat manga genre ini." onRetry={() => refetch()} /> : null}

      {data ? (
        data.items.length > 0 ? (
          <>
            {effectiveViewMode === "grid" ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
                {data.items.map((manga) => (
                  <BrowseGridCard key={manga.id} manga={manga} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.items.map((manga) => (
                  <BrowseListCard key={manga.id} manga={manga} />
                ))}
              </div>
            )}
            <Pagination page={data.page} totalPages={data.totalPages} makeHref={makePageHref} />
          </>
        ) : (
          <EmptyState title="Belum ada manga" description="Tidak ada manga yang cocok dengan filter saat ini." ctaHref="/genre" ctaLabel="Kembali ke daftar genre" />
        )
      ) : null}
    </PageShell>
  );
}
