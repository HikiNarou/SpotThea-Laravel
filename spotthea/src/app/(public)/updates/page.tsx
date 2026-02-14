"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import { LatestUpdatesFeed, LatestUpdatesViewToggle, type LatestUpdatesViewMode } from "@/components/domain/latest-updates-feed";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenresQuery, useUpdatesQuery } from "@/lib/api/hooks";
import type { UpdatesFeedCountryFilter, UpdatesFeedOrder } from "@/lib/api/manga-api";

const GRID_PAGE_SIZE = 15;
const LIST_PAGE_SIZE = 9;

export default function UpdatesPage() {
  const [viewMode, setViewMode] = useState<LatestUpdatesViewMode>("grid");
  const [viewModeTouched, setViewModeTouched] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<UpdatesFeedOrder>("latest");
  const [genre, setGenre] = useState("all");
  const [country, setCountry] = useState<UpdatesFeedCountryFilter>("ALL");

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

  const effectiveViewMode: LatestUpdatesViewMode = !viewModeTouched && isMobileViewport ? "list" : viewMode;
  const pageSize = effectiveViewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  const handleViewModeChange = (nextMode: LatestUpdatesViewMode) => {
    setViewMode(nextMode);
    setViewModeTouched(true);
    setPage(1);
  };

  const filters = useMemo(
    () => ({
      q: query.trim(),
      order,
      genre: genre === "all" ? undefined : genre,
      country,
      page,
      pageSize,
    }),
    [country, genre, order, page, pageSize, query],
  );

  const { data, isLoading, isError, isFetching, refetch } = useUpdatesQuery(filters);
  const { data: genres = [] } = useGenresQuery();

  const items = data?.items ?? [];
  const totalPages = Math.max(1, data?.totalPages ?? 1);
  const summary = useMemo(() => {
    if (!data || data.total === 0) {
      return "0 hasil";
    }

    const start = (data.page - 1) * data.pageSize + 1;
    const end = Math.min(data.total, start + data.pageSize - 1);
    return `${start}-${end} dari ${data.total}`;
  }, [data]);

  return (
    <PageShell className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Home / Updates</p>
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Latest Updates</h1>
        <p className="text-sm text-[var(--text-secondary)]">Feed chapter terbaru dari seluruh katalog.</p>
      </header>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LatestUpdatesViewToggle
              viewMode={effectiveViewMode}
              onChange={handleViewModeChange}
            />
            <p className="text-xs text-[var(--text-muted)]">{summary}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setQuery("");
              setOrder("latest");
              setGenre("all");
              setCountry("ALL");
              setViewModeTouched(false);
              setPage(1);
            }}
          >
            Reset Filter
          </Button>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Cari judul manga/chapter..."
          />

          <Select
            value={order}
            onChange={(event) => {
              setOrder(event.target.value as UpdatesFeedOrder);
              setPage(1);
            }}
          >
            <option value="latest">Latest Updates</option>
            <option value="oldest">Oldest Updates</option>
          </Select>

          <Select
            value={genre}
            onChange={(event) => {
              setGenre(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">Semua Genre</option>
            {genres.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </Select>

          <Select
            value={country}
            onChange={(event) => {
              setCountry(event.target.value as UpdatesFeedCountryFilter);
              setPage(1);
            }}
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
        <div className="space-y-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      ) : null}

      {isError ? <ErrorState message="Gagal memuat feed update." onRetry={() => refetch()} /> : null}

      {data ? (
        <>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-secondary)]">
              Tidak ada update yang cocok dengan filter saat ini.
            </div>
          ) : (
            <LatestUpdatesFeed
              items={items}
              viewMode={effectiveViewMode}
              onViewModeChange={handleViewModeChange}
              showViewToggle={false}
              gridLimit={GRID_PAGE_SIZE}
              listLimit={LIST_PAGE_SIZE}
              gridColumnsClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              listColumnsClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            />
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <Button variant="secondary" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))}>
              <ChevronLeft size={14} />
              Prev
            </Button>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Page {Math.max(1, data.page)} / {totalPages}
            </p>
            <Button variant="secondary" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>
              Next
              <ChevronRight size={14} />
            </Button>
          </div>

          <div className="text-center text-xs text-[var(--text-muted)]">
            Butuh filter lebih detail? Gunakan <Link href="/search" className="text-[var(--accent)] hover:underline">halaman search</Link>.
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
