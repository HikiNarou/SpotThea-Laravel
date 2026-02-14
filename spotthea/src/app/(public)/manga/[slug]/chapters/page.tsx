"use client";

import { useParams } from "next/navigation";

import { ChapterListVirtualized } from "@/components/domain/chapter-list-virtualized";
import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMangaDetailQuery } from "@/lib/api/hooks";

export default function MangaChaptersPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, isError, refetch } = useMangaDetailQuery(slug);

  return (
    <PageShell className="space-y-4">
      <h1 className="font-display text-3xl text-[var(--text-primary)]">Daftar Chapter</h1>

      {isLoading ? <Skeleton className="h-96" /> : null}
      {isError ? <ErrorState message="Gagal memuat chapter list." onRetry={() => refetch()} /> : null}
      {data ? (
        data.chapters.length > 0 ? (
          <ChapterListVirtualized chapters={data.chapters} mangaSlug={data.manga.slug} />
        ) : (
          <EmptyState title="Belum ada chapter" description="Cek lagi nanti setelah update terbaru." />
        )
      ) : null}
    </PageShell>
  );
}