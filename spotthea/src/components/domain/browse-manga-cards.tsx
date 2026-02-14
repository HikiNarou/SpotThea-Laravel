import Image from "next/image";
import Link from "next/link";
import { Bookmark, Eye, Star } from "lucide-react";

import { formatCompactNumber, formatRating, titleCase } from "@/lib/utils/format";
import type { MangaCardData } from "@/types/domain";

interface BrowseMangaCardProps {
  manga: MangaCardData;
}

function CountryFlagBadge({ manga }: BrowseMangaCardProps) {
  const countryCode = manga.originCountryCode?.toLowerCase();
  if (!countryCode) {
    return null;
  }

  return (
    <span className="inline-flex items-center justify-center rounded-md bg-white/90 p-0.5 shadow">
      <Image
        src={`https://flagcdn.com/w40/${countryCode}.png`}
        alt={manga.originCountryLabel ?? manga.originCountryCode ?? "Country"}
        width={18}
        height={13}
        className="h-[13px] w-[18px] rounded-[2px] object-cover"
        sizes="18px"
      />
    </span>
  );
}

export function BrowseGridCard({ manga }: BrowseMangaCardProps) {
  return (
    <article className="space-y-2 [content-visibility:auto]">
      <Link href={`/manga/${manga.slug}`} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <Image
          src={manga.coverUrl}
          alt={manga.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 30vw, 20vw"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
          <p className="line-clamp-1 text-xs font-medium text-white/85">Story & Art</p>
          <p className="line-clamp-1 text-xl font-semibold text-white">{manga.author || manga.artist}</p>
        </div>
        <div className="absolute bottom-2 right-2">
          <CountryFlagBadge manga={manga} />
        </div>
      </Link>

      <Link href={`/manga/${manga.slug}`} className="block text-center text-[1.25rem] font-semibold leading-tight text-[var(--text-primary)] hover:text-[var(--accent)] md:text-[1.35rem]">
        <span className="line-clamp-2">{manga.title}</span>
      </Link>
    </article>
  );
}

export function BrowseListCard({ manga }: BrowseMangaCardProps) {
  return (
    <article className="grid grid-cols-[112px_1fr] gap-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] [content-visibility:auto] sm:grid-cols-[130px_1fr] lg:grid-cols-[152px_1fr]">
      <Link href={`/manga/${manga.slug}`} className="group relative block h-full min-h-[154px] overflow-hidden border-r border-[var(--border)] sm:min-h-[174px]">
        <Image
          src={manga.coverUrl}
          alt={manga.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 112px, (max-width: 1024px) 130px, 152px"
        />
        <div className="absolute bottom-2 left-2">
          <CountryFlagBadge manga={manga} />
        </div>
      </Link>

      <div className="space-y-1.5 p-3">
        <Link href={`/manga/${manga.slug}`} className="line-clamp-1 text-[1.04rem] font-semibold leading-tight text-[var(--text-primary)] hover:text-[var(--accent)] sm:text-[1.1rem]">
          {manga.title}
        </Link>

        <p className="line-clamp-1 text-[0.92rem] text-[var(--text-secondary)]">{manga.serialization || manga.artist}</p>

        <div className="flex flex-wrap items-center gap-2.5 text-[0.92rem] text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <Star size={13} className="fill-yellow-400 text-yellow-400" />
            {formatRating(manga.baseRating)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye size={13} />
            {formatCompactNumber(manga.views)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bookmark size={13} />
            {formatCompactNumber(manga.followers)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/read/${manga.slug}/${manga.latestChapter.id}`} className="text-[1rem] font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
            Chapter {manga.latestChapter.number}
          </Link>
          <span className="rounded-full border border-[#1f4fb8] bg-[#0f2b60] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#9fc0ff]">
            {titleCase(manga.status)}
          </span>
        </div>

        <p className="line-clamp-3 text-[0.92rem] text-[var(--text-secondary)]">{manga.synopsis}</p>
      </div>
    </article>
  );
}
