import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { Chapter, HistoryEntry } from "@/types/domain";

interface ChapterRowProps {
  chapter: Chapter;
  mangaSlug: string;
  isRead?: boolean;
  history?: HistoryEntry;
}

export function ChapterRow({ chapter, mangaSlug, isRead = false, history }: ChapterRowProps) {
  return (
    <Link
      href={`/read/${mangaSlug}/${chapter.id}`}
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border p-3 transition-colors",
        isRead ? "border-emerald-500/25 bg-emerald-500/8" : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-soft)]",
      )}
    >
      <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">Ch. {chapter.number}</span>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">{chapter.title}</p>
        <p className="text-xs text-[var(--text-muted)]">{formatDate(chapter.publishedAt, "dd MMM yyyy")}</p>
      </div>
      <div className="text-right">
        {history ? <p className="text-xs text-[var(--accent)]">{history.progressPct}%</p> : null}
        <p className="text-[11px] text-[var(--text-muted)]">{chapter.pages.length} pages</p>
      </div>
    </Link>
  );
}