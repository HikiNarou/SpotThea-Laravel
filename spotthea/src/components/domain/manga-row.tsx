import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatCompactNumber, formatDate, formatRating, titleCase } from "@/lib/utils/format";
import type { MangaCardData } from "@/types/domain";

export function MangaRow({ manga }: { manga: MangaCardData }) {
  return (
    <article className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-[96px_1fr_auto]">
      <Link href={`/manga/${manga.slug}`} className="relative h-24 w-full overflow-hidden rounded-xl md:w-24">
        <Image src={manga.coverUrl} alt={manga.title} fill className="object-cover" sizes="96px" />
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/manga/${manga.slug}`} className="text-base font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
            {manga.title}
          </Link>
          <Badge>{titleCase(manga.status)}</Badge>
          <Badge tone={manga.contentRating === "mature" ? "warning" : "success"}>{manga.contentRating.toUpperCase()}</Badge>
        </div>

        <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{manga.synopsis}</p>

        <div className="flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
          <span>{formatRating(manga.baseRating)} rating</span>
          <span>{formatCompactNumber(manga.views)} views</span>
          <span>{manga.chapterCount} chapters</span>
          <span>Updated {formatDate(manga.updatedAt)}</span>
        </div>
      </div>

      <div className="flex items-center justify-start gap-2 md:justify-end">
        <Link className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-soft)]" href={`/manga/${manga.slug}`}>
          Detail
        </Link>
        <Link className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[var(--accent-foreground)] hover:bg-[var(--accent-strong)]" href={`/read/${manga.slug}/${manga.latestChapter.id}`}>
          Baca Ch. {manga.latestChapter.number}
        </Link>
      </div>
    </article>
  );
}