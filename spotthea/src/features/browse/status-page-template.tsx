"use client";

import { MangaGrid } from "@/components/domain/manga-grid";
import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useStatusQuery } from "@/lib/api/hooks";
import type { Chapter, Manga, MangaCardData } from "@/types/domain";

function mapCard(manga: Manga): MangaCardData {
  const latest: Chapter = {
    id: `${manga.id}-chapter-${Math.max(1, manga.chapterCount)}`,
    mangaId: manga.id,
    mangaSlug: manga.slug,
    number: Math.max(1, manga.chapterCount),
    title: "Latest",
    publishedAt: manga.updatedAt,
    pages: [],
  };

  return {
    ...manga,
    latestChapter: latest,
    firstChapter: {
      ...latest,
      id: `${manga.id}-chapter-1`,
      number: 1,
      title: "Opening",
    },
  };
}

export function StatusPageTemplate({ status, title }: { status: "ongoing" | "completed"; title: string }) {
  const { data, isLoading, isError, refetch } = useStatusQuery(status);

  return (
    <PageShell className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Home / {title}</p>
        <h1 className="font-display text-4xl text-[var(--text-primary)]">{title}</h1>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))}
        </div>
      ) : null}

      {isError ? <ErrorState message={`Gagal memuat manga ${status}.`} onRetry={() => refetch()} /> : null}

      {data ? <MangaGrid items={data.map(mapCard)} /> : null}
    </PageShell>
  );
}
