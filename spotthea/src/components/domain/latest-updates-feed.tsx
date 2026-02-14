"use client";

import Image from "next/image";
import Link from "next/link";
import { Grid2x2, Rows3 } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import type { Chapter, Manga } from "@/types/domain";

interface LatestUpdatesFeedProps {
  items: Array<{ manga: Manga; chapter: Chapter }>;
  viewMode?: LatestUpdatesViewMode;
  onViewModeChange?: (nextMode: LatestUpdatesViewMode) => void;
  showViewToggle?: boolean;
  gridLimit?: number;
  listLimit?: number;
  gridColumnsClassName?: string;
  listColumnsClassName?: string;
}

export type LatestUpdatesViewMode = "grid" | "list";

interface LatestUpdatesViewToggleProps {
  viewMode: LatestUpdatesViewMode;
  onChange: (nextMode: LatestUpdatesViewMode) => void;
  className?: string;
}

interface UpdateBundle {
  manga: Manga;
  chapters: Chapter[];
}

const CHAPTER_PREVIEW_COUNT = 3;
const DEFAULT_GRID_LIMIT = 16;
const DEFAULT_LIST_LIMIT = 6;
const DEFAULT_GRID_COLUMNS_CLASS_NAME = "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
const DEFAULT_LIST_COLUMNS_CLASS_NAME = "xl:grid-cols-2";

function formatCompactRelative(dateString: string, withSuffix = false) {
  const diffMs = Math.max(0, Date.now() - new Date(dateString).getTime());
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;
  const suffix = withSuffix ? " lalu" : "";

  if (diffMs < minute) {
    return "baru";
  }

  if (diffMs < hour) {
    return `${Math.floor(diffMs / minute)} mnt${suffix}`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)} jam${suffix}`;
  }

  if (diffMs < month) {
    return `${Math.floor(diffMs / day)} hari${suffix}`;
  }

  if (diffMs < year) {
    return `${Math.floor(diffMs / month)} bln${suffix}`;
  }

  return `${Math.floor(diffMs / year)} thn${suffix}`;
}

function isFreshUpdate(dateString: string) {
  const diffMs = Math.max(0, Date.now() - new Date(dateString).getTime());
  return diffMs <= 24 * 60 * 60 * 1000;
}

function buildUpdateBundles(items: Array<{ manga: Manga; chapter: Chapter }>) {
  const order: string[] = [];
  const grouped = new Map<string, UpdateBundle>();

  for (const item of items) {
    const key = item.manga.id;
    const existing = grouped.get(key);

    if (!existing) {
      order.push(key);
      grouped.set(key, {
        manga: item.manga,
        chapters: [item.chapter],
      });
      continue;
    }

    if (existing.chapters.some((chapter) => chapter.id === item.chapter.id)) {
      continue;
    }

    existing.chapters.push(item.chapter);
  }

  return order
    .map((key) => grouped.get(key))
    .filter((bundle): bundle is UpdateBundle => bundle !== undefined)
    .map((bundle) => ({
      ...bundle,
      chapters: [...bundle.chapters]
        .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
        .slice(0, CHAPTER_PREVIEW_COUNT),
    }));
}

function ChapterRows({
  manga,
  chapters,
  variant,
}: {
  manga: Manga;
  chapters: Chapter[];
  variant: "grid" | "list";
}) {
  const isGrid = variant === "grid";

  return (
    <div className="space-y-2">
      {chapters.map((chapter) => (
        <div key={chapter.id} className="flex items-center gap-2 rounded-xl bg-[var(--surface-soft)] px-3 py-1.5">
          <Link
            href={`/read/${manga.slug}/${chapter.id}`}
            className="flex-1 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]"
          >
            Chapter {chapter.number}
          </Link>
          <p className="min-w-14 text-right text-xs font-semibold text-[var(--text-muted)]">
            {formatCompactRelative(chapter.publishedAt, !isGrid)}
          </p>
        </div>
      ))}
    </div>
  );
}

function CoverWithFlag({
  manga,
  className,
  sizes,
}: {
  manga: Manga;
  className?: string;
  sizes?: string;
}) {
  const countryCode = manga.originCountryCode?.toLowerCase();

  return (
    <Link href={`/manga/${manga.slug}`} className="group block">
      <div className={cn("relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10", className)}>
        <Image
          src={manga.coverUrl}
          alt={manga.title}
          fill
          sizes={sizes ?? "(max-width: 768px) 48vw, (max-width: 1280px) 30vw, 240px"}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {countryCode ? (
          <span className="absolute bottom-2 right-2 overflow-hidden rounded-md border border-white/30 bg-black/60">
            <Image
              src={`https://flagcdn.com/w40/${countryCode}.png`}
              alt={manga.originCountryLabel ?? manga.originCountryCode ?? "Country"}
              width={18}
              height={12}
              className="h-3 w-[18px] object-cover"
            />
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function MangaTitle({
  manga,
  showUp,
  variant,
}: {
  manga: Manga;
  showUp: boolean;
  variant: "grid" | "list";
}) {
  if (variant === "grid") {
    return (
      <div className="min-h-[3.2rem]">
        {showUp ? (
          <div className="flex items-start justify-center gap-1.5">
            <span className="mt-0.5 rounded-full bg-[var(--danger)] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">UP</span>
            <Link
              href={`/manga/${manga.slug}`}
              className="block line-clamp-2 text-center text-lg font-semibold leading-[1.25] text-[var(--text-primary)] hover:text-[var(--accent)]"
            >
              {manga.title}
            </Link>
          </div>
        ) : (
          <Link
            href={`/manga/${manga.slug}`}
            className="block line-clamp-2 text-center text-lg font-semibold leading-[1.25] text-[var(--text-primary)] hover:text-[var(--accent)]"
          >
            {manga.title}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[3.2rem]">
      <div className="flex items-start gap-1.5">
        {showUp ? <span className="mt-0.5 rounded-full bg-[var(--danger)] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">UP</span> : null}
        <Link
          href={`/manga/${manga.slug}`}
          className="block line-clamp-2 text-left text-lg font-semibold leading-[1.25] text-[var(--text-primary)] hover:text-[var(--accent)]"
        >
          {manga.title}
        </Link>
      </div>
    </div>
  );
}

export function LatestUpdatesViewToggle({ viewMode, onChange, className }: LatestUpdatesViewToggleProps) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl border border-white/10 bg-[#11131b] p-1 shadow-[0_8px_30px_rgba(0,0,0,0.35)]", className)}>
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={viewMode === "grid"}
        aria-label="Grid view"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg text-white/75 transition-colors",
          viewMode === "grid" ? "bg-[#6f46ff] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" : "hover:bg-white/8 hover:text-white",
        )}
      >
        <Grid2x2 size={16} />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={viewMode === "list"}
        aria-label="List view"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-lg text-white/75 transition-colors",
          viewMode === "list" ? "bg-[#6f46ff] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12)]" : "hover:bg-white/8 hover:text-white",
        )}
      >
        <Rows3 size={16} />
      </button>
    </div>
  );
}

export function LatestUpdatesFeed({
  items,
  viewMode: controlledViewMode,
  onViewModeChange,
  showViewToggle = true,
  gridLimit = DEFAULT_GRID_LIMIT,
  listLimit = DEFAULT_LIST_LIMIT,
  gridColumnsClassName = DEFAULT_GRID_COLUMNS_CLASS_NAME,
  listColumnsClassName = DEFAULT_LIST_COLUMNS_CLASS_NAME,
}: LatestUpdatesFeedProps) {
  const [uncontrolledViewMode, setUncontrolledViewMode] = useState<LatestUpdatesViewMode>("grid");
  const viewMode = controlledViewMode ?? uncontrolledViewMode;
  const setViewMode = onViewModeChange ?? setUncontrolledViewMode;
  const bundles = useMemo(() => buildUpdateBundles(items), [items]);

  if (bundles.length === 0) {
    return (
      <EmptyState
        title="Belum ada update chapter"
        description="Nanti chapter terbaru akan otomatis muncul di sini."
        ctaHref="/browse"
        ctaLabel="Lihat katalog"
      />
    );
  }

  const visibleBundles = viewMode === "grid" ? bundles.slice(0, gridLimit) : bundles.slice(0, listLimit);

  return (
    <section className="space-y-4">
      {showViewToggle ? (
        <div className="flex items-center justify-end">
          <LatestUpdatesViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      ) : null}

      {viewMode === "grid" ? (
        <div className={cn("grid gap-x-3 gap-y-5", gridColumnsClassName)}>
          {visibleBundles.map(({ manga, chapters }) => (
            <article key={`grid-${manga.id}`} className="w-full rounded-xl p-2">
              <CoverWithFlag
                manga={manga}
                className="mx-auto w-full max-w-[210px]"
                sizes="(max-width: 768px) 46vw, (max-width: 1280px) 20vw, 210px"
              />

              <div className="mt-2.5 space-y-2">
                <MangaTitle manga={manga} showUp={Boolean(chapters[0] && isFreshUpdate(chapters[0].publishedAt))} variant="grid" />

                <ChapterRows manga={manga} chapters={chapters} variant="grid" />
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={cn("grid gap-4", listColumnsClassName)}>
          {visibleBundles.map(({ manga, chapters }) => (
            <article key={`list-${manga.id}`} className="grid grid-cols-[132px_1fr] items-start gap-4 rounded-xl p-2">
              <div className="w-[132px]">
                <CoverWithFlag
                  manga={manga}
                  className="w-full max-w-[132px]"
                  sizes="(max-width: 768px) 38vw, (max-width: 1280px) 16vw, 132px"
                />
              </div>

              <div className="space-y-2.5">
                <MangaTitle manga={manga} showUp={Boolean(chapters[0] && isFreshUpdate(chapters[0].publishedAt))} variant="list" />

                <ChapterRows manga={manga} chapters={chapters} variant="list" />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
