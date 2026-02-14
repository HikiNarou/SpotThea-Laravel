"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore, useUserLibrary } from "@/stores/app-store";
import { resolveMangaById } from "@/lib/utils/resolve-catalog";
import type { LibraryEntry } from "@/types/domain";

const tabItems: Array<{ value: LibraryEntry["type"]; label: string }> = [
  { value: "following", label: "Following" },
  { value: "bookmark", label: "Bookmarks" },
  { value: "favorites", label: "Favorites" },
  { value: "to-read", label: "To Read" },
  { value: "dropped", label: "Dropped" },
];

const PAGE_SIZE = 10;

export default function LibraryPage() {
  const library = useUserLibrary();
  const moveLibraryEntry = useAppStore((state) => state.moveLibraryEntry);
  const [activeTab, setActiveTab] = useState<LibraryEntry["type"]>("following");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"latest-desc" | "latest-asc" | "title-asc" | "title-desc">("latest-desc");
  const [page, setPage] = useState(1);

  const resolvedEntries = useMemo(
    () =>
      library
        .filter((entry) => entry.type === activeTab)
        .map((entry) => ({
          entry,
          manga: entry.manga ?? resolveMangaById(entry.mangaId),
        }))
        .filter((item): item is { entry: LibraryEntry; manga: NonNullable<LibraryEntry["manga"]> } => item.manga !== undefined),
    [activeTab, library],
  );

  const searchedAndSortedEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = normalizedSearch
      ? resolvedEntries.filter(({ manga }) => {
          const searchTargets = [manga.title, manga.slug, manga.genres.join(" "), `chapter ${manga.chapterCount}`];
          return searchTargets.some((value) => value.toLowerCase().includes(normalizedSearch));
        })
      : resolvedEntries;

    return [...filtered].sort((left, right) => {
      if (sort === "title-asc" || sort === "title-desc") {
        const comparison = left.manga.title.localeCompare(right.manga.title);
        return sort === "title-asc" ? comparison : -comparison;
      }

      const leftTime = +new Date(left.entry.updatedAt);
      const rightTime = +new Date(right.entry.updatedAt);
      return sort === "latest-asc" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [resolvedEntries, search, sort]);

  const totalPages = Math.max(1, Math.ceil(searchedAndSortedEntries.length / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return searchedAndSortedEntries.slice(start, start + PAGE_SIZE);
  }, [currentPage, searchedAndSortedEntries]);

  const pageSummary = useMemo(() => {
    if (searchedAndSortedEntries.length === 0) {
      return "0 hasil";
    }

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(searchedAndSortedEntries.length, start + paginatedEntries.length - 1);
    return `${start}-${end} dari ${searchedAndSortedEntries.length}`;
  }, [currentPage, paginatedEntries.length, searchedAndSortedEntries.length]);

  const goToPage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
  };

  const moveOptions = useMemo(
    () =>
      tabItems.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      )),
    [],
  );

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">My Library</h1>
        <p className="text-sm text-[var(--text-secondary)]">Atur manga yang kamu ikuti, simpan, atau kategorikan dalam list personal.</p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value as LibraryEntry["type"]);
            setPage(1);
          }}
          items={tabItems}
        />
      </div>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_240px]">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari judul manga, slug, genre, atau chapter..."
          />
          <Select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as "latest-desc" | "latest-asc" | "title-asc" | "title-desc");
              setPage(1);
            }}
          >
            <option value="latest-desc">Latest Chapter (Desc)</option>
            <option value="latest-asc">Oldest Chapter (Asc)</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </Select>
        </div>
        <p className="text-xs text-[var(--text-muted)]">{pageSummary}</p>
      </section>

      {paginatedEntries.length === 0 ? (
        <EmptyState title="List kosong" description="Belum ada manga di kategori ini." ctaHref="/browse" ctaLabel="Cari manga" />
      ) : (
        <>
          <div className="space-y-3">
            {paginatedEntries.map(({ entry, manga }) => {
              return (
                <article key={`${entry.mangaId}-${entry.type}`} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <Image src={manga.coverUrl} alt={manga.title} width={72} height={102} className="rounded-lg object-cover" unoptimized />
                  <div>
                    <Link href={`/manga/${manga.slug}`} className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
                      {manga.title}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)]">{manga.chapterCount} chapters</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-[var(--text-secondary)]">
                      {manga.genres.slice(0, 3).map((genre) => (
                        <span key={genre} className="rounded-full bg-[var(--surface-soft)] px-2 py-1">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Link href={`/read/${manga.slug}/${manga.id}-chapter-${Math.max(1, manga.chapterCount)}`} className="block rounded-lg bg-[var(--accent)] px-3 py-2 text-center text-xs font-medium text-[var(--accent-foreground)]">
                      Baca
                    </Link>
                    <Select
                      value={entry.type}
                      onChange={(event) => moveLibraryEntry(entry.mangaId, event.target.value as LibraryEntry["type"])}
                      className="h-8 min-w-28 text-xs"
                    >
                      {moveOptions}
                    </Select>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <Button variant="secondary" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)} className="h-11 rounded-2xl px-5">
              <ChevronLeft size={16} />
              Prev
            </Button>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Page {currentPage} / {totalPages}
            </p>
            <Button variant="secondary" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)} className="h-11 rounded-2xl px-5">
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
