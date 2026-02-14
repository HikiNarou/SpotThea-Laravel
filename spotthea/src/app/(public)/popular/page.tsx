"use client";

import { MangaGrid } from "@/components/domain/manga-grid";
import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePopularQuery } from "@/lib/api/hooks";
import type { Chapter, Manga, MangaCardData } from "@/types/domain";

function toCard(item: Manga): MangaCardData {
  const latest: Chapter = {
    id: `${item.id}-chapter-${Math.max(1, item.chapterCount)}`,
    mangaId: item.id,
    mangaSlug: item.slug,
    number: Math.max(1, item.chapterCount),
    title: "Latest",
    publishedAt: item.updatedAt,
    pages: [],
  };
  return { ...item, latestChapter: latest, firstChapter: { ...latest, id: `${item.id}-chapter-1`, number: 1 } };
}

export default function PopularPage() {
  const { data, isLoading, isError, refetch } = usePopularQuery();

  return (
    <PageShell className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Home / Popular</p>
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Popular Manga</h1>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))}
        </div>
      ) : null}

      {isError ? <ErrorState message="Gagal memuat daftar popular." onRetry={() => refetch()} /> : null}

      {data ? <MangaGrid items={data.map(toCard)} /> : null}
    </PageShell>
  );
}
