"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import { BookmarkButton } from "@/components/domain/bookmark-button";
import { ChapterListVirtualized } from "@/components/domain/chapter-list-virtualized";
import { CommentsSection } from "@/components/domain/comments-section";
import { FollowButton } from "@/components/domain/follow-button";
import { MangaRatingPanel } from "@/components/domain/manga-rating-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useMangaDetailQuery } from "@/lib/api/hooks";
import { formatCompactNumber, formatDate, formatRating } from "@/lib/utils/format";
import { useUserHistory } from "@/stores/app-store";

export default function MangaDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const history = useUserHistory();

  const [tab, setTab] = useState<"synopsis" | "chapters" | "rating" | "related">("synopsis");

  const { data, isLoading, isError, refetch } = useMangaDetailQuery(slug);

  const continueHistory = useMemo(() => {
    if (!data) {
      return null;
    }

    return history
      .filter((entry) => entry.mangaId === data.manga.id)
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))[0];
  }, [data, history]);

  const isMobileViewport = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const mediaQuery = window.matchMedia("(max-width: 1023px)");
      const onChange = () => onStoreChange();
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false),
    () => false,
  );

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-6 md:px-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-6">
        <ErrorState message="Manga tidak ditemukan atau gagal dimuat." onRetry={() => refetch()} />
      </main>
    );
  }

  const { manga, chapters, related } = data;
  const latestChapter = chapters[0];
  const firstChapter = chapters[chapters.length - 1];
  const desktopTab = tab === "chapters" ? "chapters" : "synopsis";
  const activeTab = isMobileViewport ? tab : desktopTab;

  const relatedSection = (
    <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Related Manga</h2>
      <div className="space-y-3">
        {related.map((item) => {
          return (
            <Link
              key={item.id}
              href={`/manga/${item.slug}`}
              className="grid grid-cols-[52px_1fr] items-center gap-2 rounded-xl border border-[var(--border)] p-2 hover:bg-[var(--surface-soft)]"
            >
              <Image src={item.coverUrl} alt={item.title} width={52} height={72} className="rounded-md object-cover" unoptimized />
              <div>
                <p className="line-clamp-1 text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.chapterCount} chapters</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );

  return (
    <main className="mx-auto w-full max-w-[1280px] space-y-8 px-4 py-6 md:px-6">
      <p className="text-sm text-[var(--text-muted)]">
        <Link href="/">Home</Link> / <Link href="/browse">Manga</Link> / {manga.title}
      </p>

      <section className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
        <div className="relative h-44 w-full sm:h-56 md:h-72">
          <Image src={manga.bannerUrl} alt={manga.title} fill className="object-cover" unoptimized priority />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/20" />
        </div>

        <div className="relative -mt-14 grid gap-4 px-4 pb-5 md:-mt-20 md:grid-cols-[220px_1fr] md:gap-5 md:px-8 md:pb-8">
          <div className="relative mx-auto h-[250px] w-[172px] overflow-hidden rounded-2xl border-4 border-[var(--surface)] shadow-xl md:mx-0 md:h-[290px] md:w-[200px]">
            <Image src={manga.coverUrl} alt={manga.title} fill className="object-cover" unoptimized />
          </div>

          <div className="space-y-4 self-end text-center md:text-left">
            <div>
              <h1 className="font-display text-4xl leading-[1.08] text-[var(--text-primary)] md:text-5xl">{manga.title}</h1>
              <p className="text-sm text-[var(--text-secondary)]">{manga.altTitle}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <Badge>{manga.status.toUpperCase()}</Badge>
              <Badge>{manga.type.toUpperCase()}</Badge>
              <Badge tone={manga.contentRating === "mature" ? "warning" : "success"}>{manga.contentRating.toUpperCase()}</Badge>
              <span className="text-xs text-[var(--text-muted)]">{manga.year}</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--text-secondary)] md:justify-start">
              <span>{formatRating(manga.baseRating)} / 5</span>
              <span>{formatCompactNumber(manga.views)} views</span>
              <span>{manga.chapterCount} chapters</span>
              <span>Updated {formatDate(manga.updatedAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap [&>a]:w-full md:[&>a]:w-auto [&>a>button]:w-full md:[&>a>button]:w-auto [&>button]:w-full md:[&>button]:w-auto">
              {firstChapter ? (
                <Link href={`/read/${manga.slug}/${firstChapter.id}`}>
                  <Button>Read First</Button>
                </Link>
              ) : null}
              {latestChapter ? (
                <Link href={`/read/${manga.slug}/${latestChapter.id}`}>
                  <Button variant="secondary">Read Latest</Button>
                </Link>
              ) : null}
              {continueHistory ? (
                <Link href={`/read/${manga.slug}/${continueHistory.chapterId}`}>
                  <Button variant="ghost">Continue</Button>
                </Link>
              ) : null}
              <FollowButton mangaId={manga.id} manga={manga} />
              <BookmarkButton mangaId={manga.id} manga={manga} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="lg:hidden">
            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as "synopsis" | "chapters" | "rating" | "related")}
              items={[
                { value: "synopsis", label: "Synopsis" },
                { value: "chapters", label: "Chapters" },
                { value: "rating", label: "Rating" },
                { value: "related", label: "Related" },
              ]}
            />
          </div>

          <div className="hidden lg:block">
            <Tabs
              value={desktopTab}
              onValueChange={(value) => setTab(value as "synopsis" | "chapters")}
              items={[
                { value: "synopsis", label: "Synopsis" },
                { value: "chapters", label: "Chapters" },
              ]}
            />
          </div>

          {activeTab === "synopsis" ? (
            <article className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <p className="leading-7 text-[var(--text-secondary)]">{manga.synopsis}</p>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--text-muted)]">Author</dt>
                  <dd className="font-medium text-[var(--text-primary)]">{manga.author}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Artist</dt>
                  <dd className="font-medium text-[var(--text-primary)]">{manga.artist}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Serialization</dt>
                  <dd className="font-medium text-[var(--text-primary)]">{manga.serialization}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Genres</dt>
                  <dd className="font-medium text-[var(--text-primary)]">{manga.genres.join(", ")}</dd>
                </div>
              </dl>
            </article>
          ) : null}

          {activeTab === "chapters" ? (
            chapters.length > 0 ? (
              <ChapterListVirtualized chapters={chapters} mangaSlug={manga.slug} />
            ) : (
              <EmptyState title="Belum ada chapter" description="Follow manga ini agar dapat notifikasi saat chapter baru rilis." />
            )
          ) : null}

          {activeTab === "rating" ? <MangaRatingPanel mangaId={manga.id} baseRating={manga.baseRating} baseRatingCount={manga.baseRatingCount} /> : null}

          {activeTab === "related" ? relatedSection : null}

          <CommentsSection mangaId={manga.id} />
        </div>

        <div className="hidden space-y-4 lg:block">
          <MangaRatingPanel mangaId={manga.id} baseRating={manga.baseRating} baseRatingCount={manga.baseRatingCount} />

          {relatedSection}
        </div>
      </section>
    </main>
  );
}
