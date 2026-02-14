"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ContinueReadingSection } from "@/components/domain/continue-reading-section";
import { FeaturedCarousel } from "@/components/domain/featured-carousel";
import { HomeAdsGrid, HomeAdsOverlay } from "@/components/domain/home-ads";
import { HomeTabs } from "@/components/domain/home-tabs";
import { LatestUpdatesFeed, LatestUpdatesViewToggle, type LatestUpdatesViewMode } from "@/components/domain/latest-updates-feed";
import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeQuery } from "@/lib/api/hooks";
import { cn } from "@/lib/utils/cn";
import { useAppStore, useUserHistory } from "@/stores/app-store";

export default function HomePage() {
  const session = useAppStore((state) => state.session);
  const platformSettings = useAppStore((state) => state.platformSettings);
  const history = useUserHistory();
  const latestUpdatesSectionRef = useRef<HTMLElement | null>(null);
  const [isLatestUpdatesHeaderFloating, setIsLatestUpdatesHeaderFloating] = useState(false);
  const [latestUpdatesView, setLatestUpdatesView] = useState<LatestUpdatesViewMode>("grid");
  const [latestUpdatesViewTouched, setLatestUpdatesViewTouched] = useState(false);
  const { data, isLoading, isError, refetch } = useHomeQuery(session?.token, session?.userId ?? "guest");

  const isMobileViewport = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }

      const mediaQuery = window.matchMedia("(max-width: 767px)");
      const onChange = () => onStoreChange();
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false),
    () => false,
  );

  const effectiveLatestUpdatesView: LatestUpdatesViewMode = !latestUpdatesViewTouched && isMobileViewport ? "list" : latestUpdatesView;

  const handleLatestUpdatesViewChange = (nextMode: LatestUpdatesViewMode) => {
    setLatestUpdatesView(nextMode);
    setLatestUpdatesViewTouched(true);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const latestUpdatesSection = latestUpdatesSectionRef.current;
    if (!latestUpdatesSection) {
      return;
    }

    let frameId = 0;

    const syncFloatingState = () => {
      const stickyOffset = window.matchMedia("(min-width: 768px)").matches ? 72 : 64;
      const sectionRect = latestUpdatesSection.getBoundingClientRect();
      const sectionTop = window.scrollY + sectionRect.top;
      const sectionBottom = sectionTop + sectionRect.height;
      const stickyAnchor = window.scrollY + stickyOffset + 1;
      const sectionBottomBuffer = 48;

      const shouldFloat = stickyAnchor >= sectionTop && stickyAnchor < sectionBottom - sectionBottomBuffer;
      setIsLatestUpdatesHeaderFloating((previous) => (previous === shouldFloat ? previous : shouldFloat));
    };

    const onScrollOrResize = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        syncFloatingState();
      });
    };

    syncFloatingState();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [data]);

  if (isLoading) {
    return (
      <PageShell className="space-y-6">
        <Skeleton className="h-[380px] w-full rounded-3xl" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-72 w-full" />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <ErrorState message="Gagal memuat homepage." onRetry={() => refetch()} />
      </PageShell>
    );
  }

  return (
    <PageShell className="space-y-8">
      <HomeAdsGrid
        items={platformSettings.homeAdsTopItems}
        maxItems={8}
        ariaLabel="Iklan homepage slot utama"
      />

      <FeaturedCarousel items={data.featured} />

      {session || history.length > 0 ? (
        <section className="space-y-4">
          <header className="flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Continue Reading</h2>
            <Link href="/me/history" className="text-sm text-[var(--accent)] hover:underline">
              Lihat history
            </Link>
          </header>
          <ContinueReadingSection items={data.continueReading} />
        </section>
      ) : null}

      <HomeTabs tabs={data.tabs} />

      <HomeAdsGrid
        items={platformSettings.homeAdsBeforeLatestItems}
        maxItems={4}
        ariaLabel="Iklan homepage sebelum latest updates"
      />

      <section ref={latestUpdatesSectionRef}>
        <header className="sticky top-[64px] z-30 mb-4 pt-2 md:top-[72px]">
          <div
            className={cn(
              "flex items-end justify-between gap-3 transition-all duration-200",
              isLatestUpdatesHeaderFloating
                ? "rounded-2xl border border-white/10 bg-[var(--background)]/75 px-3 py-2.5 shadow-[0_14px_36px_rgba(2,6,23,0.42)] backdrop-blur-xl md:px-4"
                : "px-0 py-0",
            )}
          >
            <h2 className="font-display text-2xl text-[var(--text-primary)]">Latest Updates</h2>
            <div className="flex items-center gap-2">
              <LatestUpdatesViewToggle viewMode={effectiveLatestUpdatesView} onChange={handleLatestUpdatesViewChange} />
              <Link href="/updates" className="text-sm text-[var(--accent)] hover:underline">
                Semua update
              </Link>
            </div>
          </div>
        </header>

        <LatestUpdatesFeed
          items={data.latestUpdates}
          viewMode={effectiveLatestUpdatesView}
          onViewModeChange={handleLatestUpdatesViewChange}
          showViewToggle={false}
          gridLimit={15}
          listLimit={9}
          gridColumnsClassName="grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          listColumnsClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
        />
      </section>

      <HomeAdsOverlay enabled={platformSettings.homeAdsOverlayEnabled} items={platformSettings.homeAdsOverlayItems} />
    </PageShell>
  );
}
