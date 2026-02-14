"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils/cn";
import type { Chapter, Manga, MangaCardData } from "@/types/domain";

const categoryConfig = [
  { value: "popular", label: "Popular" },
  { value: "latest", label: "Latest" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
] as const;

type HomeTabKey = (typeof categoryConfig)[number]["value"];

const MAX_RECOMMENDATION_ITEMS = 10;
const MIN_ITEMS_FOR_AUTOPLAY = 6;
const AUTO_SHIFT_INTERVAL_MS = 3000;
const DESKTOP_BREAKPOINT_QUERY = "(min-width: 1024px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SCROLL_EPSILON = 2;

const countryFallbackByType: Record<Manga["type"], "JP" | "KR" | "CN"> = {
  manga: "JP",
  manhwa: "KR",
  manhua: "CN",
};

const flagByCountryCode: Record<NonNullable<Manga["originCountryCode"]>, string> = {
  JP: "https://flagcdn.com/w40/jp.png",
  KR: "https://flagcdn.com/w40/kr.png",
  CN: "https://flagcdn.com/w40/cn.png",
  ID: "https://flagcdn.com/w40/id.png",
};

function toCardData(manga: Manga): MangaCardData {
  const latestChapter: Chapter = {
    id: `${manga.id}-chapter-${Math.max(1, manga.chapterCount)}`,
    mangaId: manga.id,
    mangaSlug: manga.slug,
    number: Math.max(1, manga.chapterCount),
    title: "Latest",
    publishedAt: manga.updatedAt,
    pages: [],
  };

  const firstChapter: Chapter = {
    ...latestChapter,
    id: `${manga.id}-chapter-1`,
    number: 1,
    title: "Opening",
  };

  return {
    ...manga,
    latestChapter,
    firstChapter,
  };
}

function getElapsedLabel(updatedAt: string) {
  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return "now";
  }

  const diffHours = Math.max(1, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)));
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  return `${Math.floor(diffDays / 7)}w`;
}

function getPulseTag(updatedAt: string): "UP" | "NEW" | null {
  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const diffHours = Math.max(0, Math.floor((Date.now() - timestamp) / (1000 * 60 * 60)));
  if (diffHours <= 24) {
    return "UP";
  }

  if (diffHours <= 72) {
    return "NEW";
  }

  return null;
}

interface HomeTabsProps {
  tabs: {
    popular: Manga[];
    latest: Manga[];
    ongoing: Manga[];
    completed: Manga[];
  };
}

export function HomeTabs({ tabs }: HomeTabsProps) {
  const [active, setActive] = useState<HomeTabKey>("popular");
  const sliderViewportRef = useRef<HTMLDivElement | null>(null);

  const isDesktopViewport = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const mediaQuery = window.matchMedia(DESKTOP_BREAKPOINT_QUERY);
      const onChange = () => onStoreChange();
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia(DESKTOP_BREAKPOINT_QUERY).matches : false),
    () => false,
  );

  const prefersReducedMotion = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
      const onChange = () => onStoreChange();
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia(REDUCED_MOTION_QUERY).matches : false),
    () => false,
  );

  const items = useMemo(() => tabs[active].map(toCardData), [active, tabs]);
  const recommendationItems = useMemo(() => items.slice(0, MAX_RECOMMENDATION_ITEMS), [items]);
  const shouldUseInfiniteTrack = recommendationItems.length >= MIN_ITEMS_FOR_AUTOPLAY && isDesktopViewport && !prefersReducedMotion;
  const displayedItems = useMemo(
    () => (shouldUseInfiniteTrack ? [...recommendationItems, ...recommendationItems] : recommendationItems),
    [recommendationItems, shouldUseInfiniteTrack],
  );

  useEffect(() => {
    const viewport = sliderViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTo({ left: 0, behavior: "auto" });
  }, [active, shouldUseInfiniteTrack]);

  useEffect(() => {
    const viewport = sliderViewportRef.current;
    if (!viewport || !shouldUseInfiniteTrack) {
      return;
    }

    let isPaused = false;
    let timerId: number | null = null;
    let resumeId: number | null = null;

    const getCards = () => viewport.querySelectorAll<HTMLElement>("[data-recommendation-card]");

    const getCycleWidth = () => {
      const cards = getCards();
      if (cards.length <= recommendationItems.length) {
        return 0;
      }

      return Math.max(0, cards[recommendationItems.length].offsetLeft - cards[0].offsetLeft);
    };

    const normalizeInfiniteOffset = () => {
      const cycleWidth = getCycleWidth();
      if (cycleWidth <= 0) {
        return;
      }

      if (viewport.scrollLeft >= cycleWidth - SCROLL_EPSILON) {
        viewport.scrollLeft -= cycleWidth;
      }
    };

    const getScrollStops = () => {
      const cards = getCards();
      if (cards.length === 0) {
        return [] as number[];
      }

      const cycleWidth = getCycleWidth();
      if (cycleWidth <= 0) {
        return [] as number[];
      }

      const offsets = Array.from(cards)
        .slice(0, recommendationItems.length)
        .map((card) => card.offsetLeft)
        .sort((left, right) => left - right)
        .filter((value, index, list) => index === 0 || Math.abs(value - list[index - 1]) > SCROLL_EPSILON);

      if (offsets.length === 0 || offsets[0] > SCROLL_EPSILON) {
        offsets.unshift(0);
      }

      const lastOffset = offsets[offsets.length - 1];
      if (lastOffset === undefined || Math.abs(lastOffset - cycleWidth) > SCROLL_EPSILON) {
        offsets.push(cycleWidth);
      }

      return offsets;
    };

    const moveToNext = () => {
      if (isPaused) {
        return;
      }

      normalizeInfiniteOffset();

      const stops = getScrollStops();
      if (stops.length < 2) {
        return;
      }

      const currentScrollLeft = viewport.scrollLeft;
      const nextStop = stops.find((stop) => stop > currentScrollLeft + SCROLL_EPSILON);

      viewport.scrollTo({
        left: nextStop ?? 0,
        behavior: "smooth",
      });
    };

    const stopAutoplay = () => {
      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      timerId = window.setInterval(moveToNext, AUTO_SHIFT_INTERVAL_MS);
    };

    const onMouseEnter = () => {
      isPaused = true;
    };

    const onMouseLeave = () => {
      isPaused = false;
    };

    const onUserTouchOrWheel = () => {
      isPaused = true;
      if (resumeId !== null) {
        window.clearTimeout(resumeId);
      }

      resumeId = window.setTimeout(() => {
        isPaused = false;
      }, AUTO_SHIFT_INTERVAL_MS);
    };

    const onVisibilityChange = () => {
      isPaused = document.visibilityState !== "visible";
    };

    viewport.addEventListener("mouseenter", onMouseEnter);
    viewport.addEventListener("mouseleave", onMouseLeave);
    viewport.addEventListener("wheel", onUserTouchOrWheel, { passive: true });
    viewport.addEventListener("touchstart", onUserTouchOrWheel, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    startAutoplay();

    return () => {
      stopAutoplay();
      if (resumeId !== null) {
        window.clearTimeout(resumeId);
      }
      viewport.removeEventListener("mouseenter", onMouseEnter);
      viewport.removeEventListener("mouseleave", onMouseLeave);
      viewport.removeEventListener("wheel", onUserTouchOrWheel);
      viewport.removeEventListener("touchstart", onUserTouchOrWheel);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [recommendationItems, shouldUseInfiniteTrack]);

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="font-display text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">Rekomendasi</h2>
        <div className="max-w-full overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] p-1 whitespace-nowrap">
            {categoryConfig.map((item) => (
              <button
                key={item.value}
                type="button"
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                  active === item.value
                    ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                )}
                onClick={() => setActive(item.value)}
                aria-pressed={active === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--text-secondary)]">
          Belum ada rekomendasi untuk kategori ini.
        </div>
      ) : (
        <div ref={sliderViewportRef} className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-1.5 sm:gap-2">
            {displayedItems.map((manga, index) => {
              const countryCode = manga.originCountryCode ?? countryFallbackByType[manga.type];
              const countryFlag = flagByCountryCode[countryCode];
              const elapsedLabel = getElapsedLabel(manga.updatedAt);
              const pulseTag = getPulseTag(manga.updatedAt);

              return (
                <Link
                  key={`${manga.id}-${index}`}
                  href={`/manga/${manga.slug}`}
                  data-recommendation-card
                  className={cn(
                    "group relative block h-[330px] w-[190px] shrink-0 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
                  )}
                >
                  <Image src={manga.coverUrl} alt={manga.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="190px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                  <div className="absolute inset-x-1.5 top-1.5 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/95 px-1.5 py-0.5 text-[11px] font-semibold text-[#342155]">
                        <Clock3 size={11} className="text-[#8063ff]" />
                        {elapsedLabel}
                      </span>
                      {pulseTag ? (
                        <span className="inline-flex rounded-md bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">{pulseTag}</span>
                      ) : null}
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-[#0f172a]">
                      <Image src={countryFlag} alt={`Bendera ${countryCode}`} width={18} height={13} className="h-[13px] w-[18px] rounded-[2px] object-cover" sizes="18px" />
                      {countryCode}
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 space-y-1 p-2.5">
                    <p className="line-clamp-2 text-[20px] font-semibold leading-[1.06] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.85)]">{manga.title}</p>
                    <p className="text-[11px] font-semibold tracking-wide text-white/80">
                      Ch. {manga.latestChapter.number} · {manga.status.toUpperCase()}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
