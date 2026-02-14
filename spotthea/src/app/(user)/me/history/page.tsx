"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useAppStore, useUserHistory } from "@/stores/app-store";
import { formatRelativeDate } from "@/lib/utils/format";
import { resolveChapterById, resolveMangaById } from "@/lib/utils/resolve-catalog";

const ranges = [
  { value: "7", label: "7 Hari" },
  { value: "30", label: "30 Hari" },
  { value: "all", label: "Semua" },
] as const;

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const history = useUserHistory();
  const clearHistory = useAppStore((state) => state.clearHistory);
  const clearHistoryForManga = useAppStore((state) => state.clearHistoryForManga);

  const [range, setRange] = useState<(typeof ranges)[number]["value"]>("30");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [nowTimestamp] = useState(() => Date.now());

  const filteredByRange = useMemo(() => {
    if (range === "all") {
      return history;
    }

    const days = Number(range);
    const threshold = nowTimestamp - days * 24 * 60 * 60 * 1000;
    return history.filter((entry) => +new Date(entry.updatedAt) >= threshold);
  }, [history, nowTimestamp, range]);

  const resolvedEntries = useMemo(
    () =>
      filteredByRange
        .map((entry) => ({
          entry,
          manga: entry.manga ?? resolveMangaById(entry.mangaId),
          chapter: entry.chapter ?? resolveChapterById(entry.chapterId),
        }))
        .filter(
          (item): item is { entry: (typeof filteredByRange)[number]; manga: NonNullable<(typeof filteredByRange)[number]["manga"]>; chapter: NonNullable<(typeof filteredByRange)[number]["chapter"]> } =>
            item.manga !== undefined && item.chapter !== undefined,
        ),
    [filteredByRange],
  );

  const searchedAndSortedEntries = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const withSearch = normalizedSearch
      ? resolvedEntries.filter(({ manga, chapter }) => {
          const chapterText = `chapter ${chapter.number}`;
          return [manga.title, manga.slug, chapter.title, chapterText].some((value) => value.toLowerCase().includes(normalizedSearch));
        })
      : resolvedEntries;

    return [...withSearch].sort((left, right) => {
      const leftTime = +new Date(left.entry.updatedAt);
      const rightTime = +new Date(right.entry.updatedAt);
      return sortDir === "asc" ? leftTime - rightTime : rightTime - leftTime;
    });
  }, [resolvedEntries, search, sortDir]);

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

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Reading History</h1>
        <p className="text-sm text-[var(--text-secondary)]">Lihat progres chapter terakhir dan lanjutkan langsung.</p>
      </header>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_140px_230px_auto]">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Cari judul manga atau chapter..."
          />

          <Select
            value={range}
            onChange={(event) => {
              setRange(event.target.value as (typeof ranges)[number]["value"]);
              setPage(1);
            }}
          >
            {ranges.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>

          <Select
            value={sortDir}
            onChange={(event) => {
              setSortDir(event.target.value as "desc" | "asc");
              setPage(1);
            }}
          >
            <option value="desc">Latest Chapter (Desc)</option>
            <option value="asc">Oldest Chapter (Asc)</option>
          </Select>

          <Button variant="danger" onClick={() => setModalOpen(true)}>
            Clear History
          </Button>
        </div>

        <p className="text-xs text-[var(--text-muted)]">{pageSummary}</p>
      </section>

      {paginatedEntries.length === 0 ? (
        <EmptyState title="History kosong" description="Belum ada progres baca pada rentang waktu ini." ctaHref="/browse" ctaLabel="Cari manga" />
      ) : (
        <>
          <div className="space-y-3">
            {paginatedEntries.map(({ entry, manga, chapter }) => {
              return (
                <article key={entry.chapterId} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                  <Image src={manga.coverUrl} alt={manga.title} width={72} height={100} className="rounded-lg object-cover" unoptimized />
                  <div>
                    <Link href={`/manga/${manga.slug}`} className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
                      {manga.title}
                    </Link>
                    <p className="text-xs text-[var(--text-secondary)]">Chapter {chapter.number} · Page {entry.pageIndex + 1}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${entry.progressPct}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">{formatRelativeDate(entry.updatedAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <Link href={`/read/${manga.slug}/${chapter.id}`} className="block rounded-lg border border-[var(--border)] px-3 py-2 text-center text-xs hover:bg-[var(--surface-soft)]">
                      Resume
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => clearHistoryForManga(entry.mangaId)}>
                      Hapus Manga
                    </Button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Clear History">
        <p className="text-sm text-[var(--text-secondary)]">Aksi ini akan menghapus seluruh history baca akun kamu.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              clearHistory();
              setModalOpen(false);
            }}
          >
            Ya, hapus
          </Button>
        </div>
      </Modal>
    </section>
  );
}
