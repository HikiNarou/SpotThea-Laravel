"use client";

import { RatingStars } from "@/components/domain/rating-stars";
import { Button } from "@/components/ui/button";
import { useMangaRatingSummaryQuery } from "@/lib/api/hooks";
import { formatRating } from "@/lib/utils/format";
import { useAppStore, useMangaRatingSummary } from "@/stores/app-store";

interface MangaRatingPanelProps {
  mangaId: string;
  baseRating: number;
  baseRatingCount: number;
}

export function MangaRatingPanel({ mangaId, baseRating, baseRatingCount }: MangaRatingPanelProps) {
  const session = useAppStore((state) => state.session);
  const rateManga = useAppStore((state) => state.rateManga);
  const localSummary = useMangaRatingSummary(mangaId, baseRating, baseRatingCount);
  const { data: dbSummary, refetch: refetchDbSummary } = useMangaRatingSummaryQuery(mangaId, session?.token, session?.userId ?? "guest");
  const summary = /^\d+$/.test(mangaId) && dbSummary ? dbSummary : localSummary;

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Community Rating</h3>
          <p className="text-xs text-[var(--text-muted)]">{summary.count} votes</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{formatRating(summary.rating)}</p>
          <RatingStars value={summary.rating} size="sm" />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs text-[var(--text-secondary)]">Rating kamu:</p>
        <RatingStars
          value={summary.userRating ?? 0}
          onChange={async (value) => {
            const result = await rateManga(mangaId, value);
            if (!result.ok) {
              alert(result.error);
              return;
            }

            if (/^\d+$/.test(mangaId)) {
              void refetchDbSummary();
            }
          }}
        />
        <Button variant="ghost" size="sm">
          {summary.userRating ? `Kamu kasih ${summary.userRating} bintang` : "Belum kasih rating"}
        </Button>
      </div>
    </section>
  );
}
