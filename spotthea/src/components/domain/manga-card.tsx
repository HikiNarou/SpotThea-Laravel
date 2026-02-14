import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCompactNumber, formatDate, formatRating, titleCase } from "@/lib/utils/format";
import type { MangaCardData } from "@/types/domain";

interface MangaCardProps {
  manga: MangaCardData;
}

export function MangaCard({ manga }: MangaCardProps) {
  return (
    <Card className="group overflow-hidden p-0">
      <Link href={`/manga/${manga.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={manga.coverUrl}
            alt={manga.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center justify-between text-[11px] text-white/90">
              <span>{manga.type.toUpperCase()}</span>
              <span>{manga.status.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="space-y-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{titleCase(manga.status)}</Badge>
          <span className="text-xs text-[var(--text-muted)]">{manga.year}</span>
        </div>

        <Link href={`/manga/${manga.slug}`} className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
          {manga.title}
        </Link>

        <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">{manga.synopsis}</p>

        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>{formatRating(manga.baseRating)} / 5</span>
          <span>{formatCompactNumber(manga.views)} views</span>
        </div>

        <div className="rounded-lg bg-[var(--surface-soft)] p-2 text-xs text-[var(--text-secondary)]">
          <p>
            Latest: <Link href={`/read/${manga.slug}/${manga.latestChapter.id}`} className="font-medium hover:text-[var(--accent)]">Ch. {manga.latestChapter.number}</Link>
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">{formatDate(manga.latestChapter.publishedAt, "dd MMM yyyy")}</p>
        </div>
      </div>
    </Card>
  );
}