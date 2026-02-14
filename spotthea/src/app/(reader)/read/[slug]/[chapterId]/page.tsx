"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Flag, Maximize2, Pause, Play, Settings2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChapterSelector } from "@/components/domain/chapter-selector";
import { ReaderImage } from "@/components/domain/reader-image";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { READER_FIT, READER_THEMES, READING_MODES } from "@/lib/constants/site";
import { useReaderQuery } from "@/lib/api/hooks";
import { clamp } from "@/lib/utils/format";
import { useAppStore, useUserHistory } from "@/stores/app-store";

const readerThemeBackground: Record<string, string> = {
  light: "var(--reader-light)",
  dim: "var(--reader-dim)",
  dark: "var(--reader-dark)",
  sepia: "var(--reader-sepia)",
};

const AUTO_SCROLL_MIN_SPEED = 10;
const AUTO_SCROLL_MAX_SPEED = 260;
const CHROME_HIDE_THRESHOLD = 28;
const CHROME_SHOW_THRESHOLD = 14;
const CHROME_TOGGLE_COOLDOWN_MS = 180;
const CHROME_SHOW_HOLD_MS = 420;
const CHROME_INTERRUPT_HOLD_MS = 900;
const AUTO_SCROLL_INTERRUPT_SCROLL_DELTA = 6;

export default function ReaderPage() {
  const params = useParams<{ slug: string; chapterId: string }>();
  const router = useRouter();
  const slug = params.slug;
  const chapterId = params.chapterId;

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastScrollYRef = useRef(0);
  const lastChromeToggleYRef = useRef(0);
  const lastChromeToggleAtRef = useRef(0);
  const hideSuppressedUntilRef = useRef(0);
  const autoScrollActiveRef = useRef(false);
  const chromeVisibleRef = useRef(true);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const readerSettings = useAppStore((state) => state.readerSettings);
  const setReaderSetting = useAppStore((state) => state.setReaderSetting);
  const addOrUpdateHistory = useAppStore((state) => state.addOrUpdateHistory);
  const createReport = useAppStore((state) => state.createReport);
  const session = useAppStore((state) => state.session);
  const history = useUserHistory();

  const { data, isLoading, isError, refetch } = useReaderQuery(slug, chapterId);

  const chapterHistory = history.find((entry) => entry.chapterId === chapterId);
  const totalPages = data?.chapter.pages.length ?? 1;
  const pageKey = `${slug}:${chapterId}`;
  const [pageByChapter, setPageByChapter] = useState<Record<string, number>>(() =>
    chapterHistory ? { [pageKey]: chapterHistory.pageIndex } : {},
  );
  const rawPageIndex = pageByChapter[pageKey] ?? chapterHistory?.pageIndex ?? 0;
  const pageIndex = clamp(rawPageIndex, 0, Math.max(0, totalPages - 1));
  const progressPct = Math.round(((pageIndex + 1) / totalPages) * 100);
  const canUseAutoScroll = readerSettings.mode === "vertical" || readerSettings.mode === "webtoon";
  const autoScrollSettingEnabled = Boolean(readerSettings.autoScrollEnabled);
  const autoScrollEnabled = canUseAutoScroll && autoScrollSettingEnabled;
  const autoScrollActive = autoScrollEnabled && !settingsOpen;
  const autoScrollSpeed = clamp(Number(readerSettings.autoScrollSpeed ?? 80), AUTO_SCROLL_MIN_SPEED, AUTO_SCROLL_MAX_SPEED);
  const isReaderChromeVisible = chromeVisible || settingsOpen;
  const isLightReaderTheme = readerSettings.theme === "light" || readerSettings.theme === "sepia";
  const readerChromeVisibleClassName = isLightReaderTheme
    ? "border-black/10 bg-white/75"
    : "border-white/10 bg-black/35";
  const readerChromeMutedTextClassName = isLightReaderTheme ? "text-black/65" : "text-white/75";
  const readerChromeProgressTrackClassName = isLightReaderTheme ? "bg-black/15" : "bg-white/20";
  const readerChromeProgressTextClassName = isLightReaderTheme ? "text-black/75" : "text-white/85";
  const readerChromeButtonClassName = isLightReaderTheme
    ? "border-black/10 text-black hover:bg-black/5"
    : "border-white/10 text-white/90 hover:bg-white/10";

  const setCurrentPageIndex = useCallback(
    (value: number | ((current: number) => number)) => {
      setPageByChapter((previous) => {
        const current = previous[pageKey] ?? chapterHistory?.pageIndex ?? 0;
        const next = typeof value === "function" ? value(current) : value;
        if (next === current) {
          return previous;
        }

        return {
          ...previous,
          [pageKey]: next,
        };
      });
    },
    [chapterHistory?.pageIndex, pageKey],
  );

  const showReaderChrome = useCallback((holdForMs = CHROME_SHOW_HOLD_MS) => {
    const now = performance.now();
    lastChromeToggleYRef.current = window.scrollY;
    lastChromeToggleAtRef.current = now;
    hideSuppressedUntilRef.current = now + holdForMs;

    if (!chromeVisibleRef.current) {
      chromeVisibleRef.current = true;
      setChromeVisible(true);
    }
  }, []);

  const openReaderSettings = useCallback(() => {
    showReaderChrome(CHROME_INTERRUPT_HOLD_MS);
    setSettingsOpen(true);
  }, [showReaderChrome]);

  const interruptAutoScrollAndRevealChrome = useCallback(
    (holdForMs = CHROME_INTERRUPT_HOLD_MS) => {
      showReaderChrome(holdForMs);
      if (autoScrollActiveRef.current) {
        autoScrollActiveRef.current = false;
        setReaderSetting("autoScrollEnabled", false);
      }
    },
    [setReaderSetting, showReaderChrome],
  );

  useEffect(() => {
    const currentScrollY = window.scrollY;
    lastScrollYRef.current = currentScrollY;
    lastChromeToggleYRef.current = currentScrollY;
  }, []);

  useEffect(() => {
    autoScrollActiveRef.current = autoScrollActive;
  }, [autoScrollActive]);

  useEffect(() => {
    chromeVisibleRef.current = chromeVisible;
  }, [chromeVisible]);

  useEffect(() => {
    let frame = 0;

    const updateVisibility = () => {
      const nextY = window.scrollY;
      const directionDelta = nextY - lastScrollYRef.current;
      lastScrollYRef.current = nextY;
      const now = performance.now();
      const isAutoScrolling = autoScrollActiveRef.current;

      if (isAutoScrolling && directionDelta <= -AUTO_SCROLL_INTERRUPT_SCROLL_DELTA) {
        interruptAutoScrollAndRevealChrome();
        return;
      }

      if (nextY <= 24) {
        lastChromeToggleYRef.current = nextY;
        lastChromeToggleAtRef.current = now;
        hideSuppressedUntilRef.current = now + CHROME_SHOW_HOLD_MS;
        if (!chromeVisibleRef.current) {
          chromeVisibleRef.current = true;
          setChromeVisible(true);
        }
        return;
      }

      if (Math.abs(directionDelta) < 0.75) {
        return;
      }

      if (now - lastChromeToggleAtRef.current < CHROME_TOGGLE_COOLDOWN_MS) {
        return;
      }

      const distanceFromToggle = nextY - lastChromeToggleYRef.current;
      const hideSuppressed = now < hideSuppressedUntilRef.current;

      if (!hideSuppressed && directionDelta > 0 && distanceFromToggle >= CHROME_HIDE_THRESHOLD) {
        lastChromeToggleYRef.current = nextY;
        lastChromeToggleAtRef.current = now;

        if (chromeVisibleRef.current) {
          chromeVisibleRef.current = false;
          setChromeVisible(false);
        }
        return;
      }

      if (isAutoScrolling) {
        return;
      }

      if (directionDelta < 0 && distanceFromToggle <= -CHROME_SHOW_THRESHOLD) {
        lastChromeToggleYRef.current = nextY;
        lastChromeToggleAtRef.current = now;
        hideSuppressedUntilRef.current = now + CHROME_SHOW_HOLD_MS;

        if (!chromeVisibleRef.current) {
          chromeVisibleRef.current = true;
          setChromeVisible(true);
        }
      }
    };

    const onScroll = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateVisibility();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", onScroll);
    };
  }, [interruptAutoScrollAndRevealChrome]);

  const handleReaderPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handleReaderPointerCancel = useCallback(() => {
    pointerStartRef.current = null;
  }, []);

  const handleReaderPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;

      if (!start || settingsOpen) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const movedDistance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
      if (movedDistance > 12) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest("a,button,input,select,textarea,[role='button'],[role='dialog'],[data-prevent-reader-center-toggle='true']")) {
        return;
      }

      const xRatio = event.clientX / Math.max(1, window.innerWidth);
      const yRatio = event.clientY / Math.max(1, window.innerHeight);
      const clickedCenter = xRatio >= 0.2 && xRatio <= 0.8 && yRatio >= 0.28 && yRatio <= 0.72;

      if (clickedCenter) {
        interruptAutoScrollAndRevealChrome();
      }
    },
    [interruptAutoScrollAndRevealChrome, settingsOpen],
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    if (chapterHistory && chapterHistory.pageIndex === pageIndex && chapterHistory.progressPct === progressPct) {
      return;
    }

    addOrUpdateHistory({
      mangaId: data.manga.id,
      chapterId: data.chapter.id,
      pageIndex,
      progressPct,
      updatedAt: new Date().toISOString(),
      manga: data.manga,
      chapter: data.chapter,
    });
  }, [addOrUpdateHistory, chapterHistory, data, pageIndex, progressPct]);

  useEffect(() => {
    if (!data || readerSettings.preload === "off") {
      return;
    }

    const range = readerSettings.preload === "high" ? 4 : 2;
    const nextPages = data.chapter.pages.slice(pageIndex + 1, pageIndex + 1 + range);
    nextPages.forEach((page) => {
      const img = new window.Image();
      img.src = page.imageUrl;
    });
  }, [data, pageIndex, readerSettings.preload]);

  const goNextPage = useCallback(() => {
    if (!data) {
      return;
    }

    if (pageIndex < data.chapter.pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
      return;
    }

    if (readerSettings.autoNextChapter && data.nextChapter) {
      router.push(`/read/${slug}/${data.nextChapter.id}`);
    }
  }, [data, pageIndex, readerSettings.autoNextChapter, router, setCurrentPageIndex, slug]);

  const goPrevPage = useCallback(() => {
    if (!data) {
      return;
    }

    if (pageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
      return;
    }

    if (data.prevChapter) {
      router.push(`/read/${slug}/${data.prevChapter.id}`);
    }
  }, [data, pageIndex, router, setCurrentPageIndex, slug]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.getAttribute("role") === "combobox")) {
        return;
      }

      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        openReaderSettings();
      }

      if (event.key === "Escape") {
        setSettingsOpen(false);
      }

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => undefined);
        } else {
          document.exitFullscreen().catch(() => undefined);
        }
      }

      if ((event.key === "a" || event.key === "A") && canUseAutoScroll) {
        event.preventDefault();
        setReaderSetting("autoScrollEnabled", !autoScrollSettingEnabled);
      }

      if (readerSettings.mode === "paginated") {
        if ((event.key === "ArrowRight" && readerSettings.direction === "ltr") || (event.key === "ArrowLeft" && readerSettings.direction === "rtl")) {
          event.preventDefault();
          goNextPage();
        }

        if ((event.key === "ArrowLeft" && readerSettings.direction === "ltr") || (event.key === "ArrowRight" && readerSettings.direction === "rtl")) {
          event.preventDefault();
          goPrevPage();
        }
      }

      if (event.key === " " && readerSettings.mode !== "paginated") {
        event.preventDefault();
        const delta = event.shiftKey ? -window.innerHeight * 0.72 : window.innerHeight * 0.72;
        window.scrollBy({ top: delta, behavior: readerSettings.reduceMotion ? "auto" : "smooth" });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [autoScrollSettingEnabled, canUseAutoScroll, goNextPage, goPrevPage, openReaderSettings, readerSettings.direction, readerSettings.mode, readerSettings.reduceMotion, setReaderSetting]);

  useEffect(() => {
    if (!data || readerSettings.mode === "paginated") {
      return;
    }

    let frame = 0;
    const updateFromViewport = () => {
      const container = scrollRef.current;
      if (!container) {
        return;
      }

      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;
      const containerTop = viewportTop + container.getBoundingClientRect().top;
      const containerHeight = Math.max(container.scrollHeight, container.clientHeight);
      const containerBottom = containerTop + containerHeight;

      // Force final page when user reaches the real bottom of reader content.
      if (viewportBottom >= containerBottom - 4) {
        setCurrentPageIndex(totalPages - 1);
        return;
      }

      if (viewportTop <= containerTop + 4) {
        setCurrentPageIndex(0);
        return;
      }

      const scrollableRange = Math.max(1, containerHeight - window.innerHeight);
      const ratio = clamp((viewportTop - containerTop) / scrollableRange, 0, 1);
      const nextIndex = clamp(Math.round(ratio * (totalPages - 1)), 0, totalPages - 1);
      setCurrentPageIndex(nextIndex);
    };

    const onScrollOrResize = () => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateFromViewport();
      });
    };

    updateFromViewport();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [data, readerSettings.mode, setCurrentPageIndex, totalPages]);

  useEffect(() => {
    if (!autoScrollActive) {
      return;
    }

    let frame = 0;
    let previousFrameTime: number | null = null;
    let targetScrollTop = window.scrollY;

    const step = (now: number) => {
      if (previousFrameTime === null) {
        previousFrameTime = now;
        frame = window.requestAnimationFrame(step);
        return;
      }

      const deltaMs = now - previousFrameTime;
      previousFrameTime = now;

      const scrollingElement = document.scrollingElement ?? document.documentElement;
      const maxScrollTop = Math.max(0, scrollingElement.scrollHeight - window.innerHeight);
      const currentTop = window.scrollY;

      if (Math.abs(currentTop - targetScrollTop) > 2) {
        targetScrollTop = currentTop;
      }

      if (targetScrollTop < maxScrollTop - 0.5) {
        targetScrollTop = Math.min(maxScrollTop, targetScrollTop + (autoScrollSpeed * deltaMs) / 1000);
        window.scrollTo({
          top: targetScrollTop,
          behavior: "auto",
        });
      }

      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);

    return () => {
      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [autoScrollActive, autoScrollSpeed]);

  const currentPage = data?.chapter.pages[pageIndex];

  if (isLoading) {
    return (
      <main className="space-y-4 p-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="mx-auto h-[80vh] w-full max-w-4xl" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto mt-16 max-w-2xl px-4">
        <ErrorState message="Chapter tidak ditemukan." onRetry={() => refetch()} />
      </main>
    );
  }

  const fitClassName =
    readerSettings.fit === "height"
      ? "mx-auto h-[70vh] w-auto"
      : readerSettings.fit === "original"
        ? "mx-auto w-auto max-w-none"
        : "mx-auto h-auto w-full max-w-4xl";

  return (
    <main
      className="min-h-screen"
      onPointerDown={handleReaderPointerDown}
      onPointerUp={handleReaderPointerUp}
      onPointerCancel={handleReaderPointerCancel}
      style={{
        background: readerThemeBackground[readerSettings.theme],
        color: readerSettings.theme === "light" || readerSettings.theme === "sepia" ? "#191919" : "#f8f8f8",
      }}
    >
      <header
        className={`sticky top-0 z-40 overflow-hidden px-3 backdrop-blur transition-[max-height,opacity,padding,border-color] duration-300 md:px-6 ${
          isReaderChromeVisible ? `max-h-24 border-b py-2 opacity-100 ${readerChromeVisibleClassName}` : "pointer-events-none max-h-0 border-b-0 bg-black/0 py-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center gap-2">
          <Link href={`/manga/${data.manga.slug}`}>
            <Button variant="ghost" size="sm" className={readerChromeButtonClassName}>
              <ArrowLeft size={14} /> Back
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-semibold">{data.manga.title}</p>
            <p className={`line-clamp-1 text-xs ${readerChromeMutedTextClassName}`}>
              Ch. {data.chapter.number} - {data.chapter.title}
            </p>
          </div>
          <ChapterSelector mangaSlug={data.manga.slug} currentChapterId={data.chapter.id} chapters={data.chapterOptions} />
          <Button variant="ghost" size="sm" onClick={openReaderSettings} className={readerChromeButtonClassName}>
            <Settings2 size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={readerChromeButtonClassName}
            onClick={() => {
              if (!currentPage) {
                return;
              }

              createReport({
                reporterUserId: session?.userId ?? null,
                type: "page",
                targetId: currentPage.id,
                reason: "Broken page",
                details: `Report from reader chapter ${data.chapter.id} page ${currentPage.index + 1}`,
              });
              alert("Report halaman berhasil dikirim.");
            }}
          >
            <Flag size={14} />
          </Button>
        </div>
      </header>

      <section
        ref={scrollRef}
        className="mx-auto flex max-w-[1280px] flex-col px-3 py-5 md:px-6"
        style={{ gap: readerSettings.mode === "webtoon" ? readerSettings.gap + 12 : readerSettings.gap }}
      >
        {readerSettings.mode === "paginated" ? (
          currentPage ? (
            <div className="mx-auto flex w-full max-w-5xl justify-center">
              <ReaderImage
                src={currentPage.imageUrl}
                alt={`Page ${currentPage.index + 1}`}
                width={currentPage.width}
                height={currentPage.height}
                className={fitClassName}
                onReport={() => {
                  createReport({
                    reporterUserId: session?.userId ?? null,
                    type: "page",
                    targetId: currentPage.id,
                    reason: "Broken page",
                    details: `Image gagal dimuat pada chapter ${data.chapter.id}`,
                  });
                }}
              />
            </div>
          ) : null
        ) : (
          data.chapter.pages.map((page) => (
            <ReaderImage
              key={page.id}
              src={page.imageUrl}
              alt={`Page ${page.index + 1}`}
              width={page.width}
              height={page.height}
              className={fitClassName}
              onReport={() => {
                createReport({
                  reporterUserId: session?.userId ?? null,
                  type: "page",
                  targetId: page.id,
                  reason: "Broken page",
                  details: `Image gagal dimuat pada chapter ${data.chapter.id}`,
                });
              }}
            />
          ))
        )}
      </section>

      <footer
        className={`sticky bottom-0 z-40 overflow-hidden px-3 backdrop-blur transition-[max-height,opacity,padding,border-color] duration-300 md:px-6 ${
          isReaderChromeVisible ? `max-h-24 border-t py-2 opacity-100 ${readerChromeVisibleClassName}` : "pointer-events-none max-h-0 border-t-0 bg-black/0 py-0 opacity-0"
        }`}
      >
        <div className="mx-auto flex max-w-[1280px] items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goPrevPage} className={readerChromeButtonClassName}>
            <ArrowLeft size={14} /> Prev
          </Button>
          <div className="min-w-0 flex-1">
            <div className={`h-1.5 w-full overflow-hidden rounded-full ${readerChromeProgressTrackClassName}`}>
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${progressPct}%` }} />
            </div>
            <p className={`mt-1 text-center text-xs ${readerChromeProgressTextClassName}`}>
              Page {pageIndex + 1}/{totalPages} · {progressPct}%
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={goNextPage} className={readerChromeButtonClassName}>
            Next <ArrowRight size={14} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={readerChromeButtonClassName}
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => undefined);
              } else {
                document.exitFullscreen().catch(() => undefined);
              }
            }}
          >
            <Maximize2 size={14} />
          </Button>
        </div>
      </footer>

      <div className="fixed bottom-20 right-4 z-30 flex flex-col gap-2">
        {canUseAutoScroll ? (
          <Button
            variant={autoScrollEnabled ? "primary" : "secondary"}
            size="sm"
            onClick={() => setReaderSetting("autoScrollEnabled", !autoScrollSettingEnabled)}
            aria-label={autoScrollEnabled ? "Matikan auto scroll" : "Nyalakan auto scroll"}
          >
            {autoScrollEnabled ? <Pause size={16} /> : <Play size={16} />}
          </Button>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.scrollTo({ top: 0, behavior: readerSettings.reduceMotion ? "auto" : "smooth" })}
          aria-label="Scroll ke atas"
        >
          <ArrowUp size={16} />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: readerSettings.reduceMotion ? "auto" : "smooth",
            });
          }}
          aria-label="Scroll ke bawah"
        >
          <ArrowDown size={16} />
        </Button>
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Reader Settings">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)} aria-label="Tutup reader settings">
              <X size={16} />
            </Button>
          </div>

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Mode</span>
            <Select value={readerSettings.mode} onChange={(event) => setReaderSetting("mode", event.target.value as typeof readerSettings.mode)}>
              {READING_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Theme</span>
            <Select value={readerSettings.theme} onChange={(event) => setReaderSetting("theme", event.target.value as typeof readerSettings.theme)}>
              {READER_THEMES.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Fit</span>
            <Select value={readerSettings.fit} onChange={(event) => setReaderSetting("fit", event.target.value as typeof readerSettings.fit)}>
              {READER_FIT.map((fit) => (
                <option key={fit.value} value={fit.value}>
                  {fit.label}
                </option>
              ))}
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Direction</span>
            <Select
              value={readerSettings.direction}
              onChange={(event) => setReaderSetting("direction", event.target.value as typeof readerSettings.direction)}
            >
              <option value="ltr">Left to Right</option>
              <option value="rtl">Right to Left</option>
            </Select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Gap ({readerSettings.gap}px)</span>
            <input
              type="range"
              min={4}
              max={40}
              step={2}
              value={readerSettings.gap}
              onChange={(event) => setReaderSetting("gap", Number(event.target.value))}
              className="w-full"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-[var(--text-secondary)]">Preload</span>
            <Select value={readerSettings.preload} onChange={(event) => setReaderSetting("preload", event.target.value as typeof readerSettings.preload)}>
              <option value="off">Off</option>
              <option value="low">Low</option>
              <option value="high">High</option>
            </Select>
          </label>

          <div className="space-y-2 rounded-xl border border-[var(--border)] p-3">
            <Switch checked={readerSettings.autoNextChapter} onChange={(next) => setReaderSetting("autoNextChapter", next)} label="Auto next chapter" />
            <Switch checked={readerSettings.reduceMotion} onChange={(next) => setReaderSetting("reduceMotion", next)} label="Reduce motion" />
            <Switch checked={autoScrollSettingEnabled} onChange={(next) => setReaderSetting("autoScrollEnabled", next)} label="Auto scroll (Vertical/Webtoon)" />

            <label className="space-y-1 text-sm">
              <span className="text-[var(--text-secondary)]">Auto scroll speed ({autoScrollSpeed}px/s)</span>
              <input
                type="range"
                min={AUTO_SCROLL_MIN_SPEED}
                max={AUTO_SCROLL_MAX_SPEED}
                step={5}
                value={autoScrollSpeed}
                onChange={(event) => setReaderSetting("autoScrollSpeed", Number(event.target.value))}
                className="w-full"
              />
            </label>
            <p className="text-xs text-[var(--text-muted)]">Auto scroll aktif hanya di mode Vertical atau Webtoon.</p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 text-xs text-[var(--text-secondary)]">
            <p className="font-semibold text-[var(--text-primary)]">Keyboard shortcuts</p>
            <p>Arrow Left/Right: prev/next page (paginated)</p>
            <p>Space / Shift+Space: scroll down/up</p>
            <p>A: auto scroll toggle (vertical/webtoon)</p>
            <p>F: fullscreen, S: settings, Esc: close overlay</p>
          </div>
        </div>
      </Modal>
    </main>
  );
}
