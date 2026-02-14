"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import type { HomeContinueReadingEntry } from "@/lib/api/manga-api";
import { catalogData } from "@/lib/data/catalog";
import { formatRelativeDate } from "@/lib/utils/format";
import { useAppStore, useUserHistory } from "@/stores/app-store";
import type { Chapter, Manga } from "@/types/domain";

function resolveManga(mangaId: string) {
  const customManga = useAppStore.getState().customMangas.find((item) => item.id === mangaId);
  if (customManga) {
    return customManga;
  }

  return catalogData.getMangaById(mangaId);
}

function resolveChapter(chapterId: string) {
  const customChapter = useAppStore.getState().customChapters.find((item) => item.id === chapterId);
  if (customChapter) {
    return customChapter;
  }

  return catalogData.getChapter(chapterId);
}

interface ContinueReadingSectionProps {
  items?: HomeContinueReadingEntry[];
}

interface ContinueReadingCard {
  entry: HomeContinueReadingEntry;
  manga: Manga;
  chapter: Chapter;
}

export function ContinueReadingSection({ items }: ContinueReadingSectionProps) {
  const history = useUserHistory();

  const cards = useMemo<ContinueReadingCard[]>(() => {
    const merged = [...(items ?? []), ...(history as HomeContinueReadingEntry[])]
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .reduce<HomeContinueReadingEntry[]>((acc, current) => {
        if (acc.some((item) => item.chapterId === current.chapterId)) {
          return acc;
        }

        acc.push(current);
        return acc;
      }, []);

    return merged
      .map((entry) => {
        const manga = entry.manga ?? resolveManga(entry.mangaId);
        const chapter = entry.chapter ?? resolveChapter(entry.chapterId);

        if (!manga || !chapter) {
          return null;
        }

        return {
          entry,
          manga,
          chapter,
        };
      })
      .filter((item): item is ContinueReadingCard => item !== null)
      .slice(0, 3);
  }, [history, items]);

  if (cards.length === 0) {
    return <EmptyState title="Belum ada progress" description="Mulai baca manga untuk menampilkan continue reading di homepage." ctaHref="/browse" ctaLabel="Mulai Browse" />;
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map(({ entry, manga, chapter }) => {
        return (
          <article key={`${entry.mangaId}-${entry.chapterId}`} className="grid grid-cols-[72px_1fr] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <Image src={manga.coverUrl} alt={manga.title} width={72} height={100} className="rounded-lg object-cover" unoptimized />
            <div>
              <Link href={`/manga/${manga.slug}`} className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
                {manga.title}
              </Link>
              <p className="text-xs text-[var(--text-secondary)]">Ch. {chapter.number}</p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-soft)]">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${entry.progressPct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">{formatRelativeDate(entry.updatedAt)}</p>
              <Link href={`/read/${manga.slug}/${chapter.id}`} className="mt-2 inline-block text-xs font-medium text-[var(--accent)] hover:underline">
                Lanjutkan
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
