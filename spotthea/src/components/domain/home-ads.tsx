"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { PlatformAdItem } from "@/types/domain";

interface HomeAdsGridProps {
  items: PlatformAdItem[];
  maxItems: number;
  className?: string;
  gridClassName?: string;
  ariaLabel: string;
}

interface HomeAdsOverlayProps {
  enabled: boolean;
  items: PlatformAdItem[];
}

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function normalizeTargetHref(href: string) {
  const trimmed = href.trim();
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  if (isExternalHref(trimmed)) {
    return trimmed;
  }

  return "/browse";
}

function normalizeAds(items: PlatformAdItem[], maxItems: number) {
  return items
    .map((item) => ({
      imageUrl: item.imageUrl.trim(),
      targetUrl: normalizeTargetHref(item.targetUrl),
      altText: item.altText.trim(),
    }))
    .filter((item) => item.imageUrl !== "")
    .slice(0, maxItems);
}

function AdTile({ ad, index, className }: { ad: PlatformAdItem; index: number; className?: string }) {
  const href = normalizeTargetHref(ad.targetUrl);
  const altText = ad.altText.trim() || `Advertisement ${index + 1}`;
  const tileBody = (
    <>
      <Image
        src={ad.imageUrl}
        alt={altText}
        fill
        loading="lazy"
        decoding="async"
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        unoptimized
      />
      <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90">
        Ads
      </span>
    </>
  );

  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          "group relative block aspect-[25/3] overflow-hidden rounded-lg border border-white/10",
          className,
        )}
      >
        {tileBody}
      </a>
    );
  }

  return (
    <Link href={href} className={cn("group relative block aspect-[25/3] overflow-hidden rounded-lg border border-white/10", className)}>
      {tileBody}
    </Link>
  );
}

export function HomeAdsGrid({ items, maxItems, className, gridClassName, ariaLabel }: HomeAdsGridProps) {
  const normalizedItems = useMemo(() => normalizeAds(items, maxItems), [items, maxItems]);

  if (normalizedItems.length === 0) {
    return null;
  }

  return (
    <section className={cn(className)} aria-label={ariaLabel}>
      <div className={cn("grid grid-cols-1 gap-1 md:grid-cols-2", gridClassName)}>
        {normalizedItems.map((ad, index) => (
          <AdTile key={`${ad.imageUrl}-${index}`} ad={ad} index={index} />
        ))}
      </div>
    </section>
  );
}

export function HomeAdsOverlay({ enabled, items }: HomeAdsOverlayProps) {
  const normalizedItems = useMemo(() => normalizeAds(items, 2), [items]);
  const [closed, setClosed] = useState(false);

  if (!enabled || closed || normalizedItems.length === 0) {
    return null;
  }

  return (
    <aside className="pointer-events-none fixed bottom-3 left-1/2 z-50 w-[min(1200px,calc(100%-1rem))] -translate-x-1/2">
      <div className="pointer-events-auto">
        <div className="mb-2 flex justify-center">
          <button
            type="button"
            onClick={() => setClosed(true)}
            className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-black/35 px-3 py-1 text-sm font-medium text-white/95 transition-colors hover:bg-black/50"
          >
            Close
            <X size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
          {normalizedItems.map((ad, index) => (
            <AdTile key={`${ad.imageUrl}-${index}`} ad={ad} index={index} className="rounded-md" />
          ))}
        </div>
      </div>
    </aside>
  );
}
