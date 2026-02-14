"use client";

import Link from "next/link";

import { RatingStars } from "@/components/domain/rating-stars";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppStore } from "@/stores/app-store";
import { formatRelativeDate } from "@/lib/utils/format";
import { resolveMangaById } from "@/lib/utils/resolve-catalog";

export default function ReviewsPage() {
  const session = useAppStore((state) => state.session);
  const ratings = useAppStore((state) => state.ratings);
  const comments = useAppStore((state) => state.comments);

  const myRatings = session ? ratings.filter((rating) => rating.userId === session.userId) : [];
  const myComments = session ? comments.filter((comment) => comment.userId === session.userId) : [];

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">My Reviews</h1>
        <p className="text-sm text-[var(--text-secondary)]">Rekap rating dan komentar yang pernah kamu kirim.</p>
      </header>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Ratings</h2>
        {myRatings.length === 0 ? (
          <EmptyState title="Belum ada rating" description="Beri rating di halaman detail manga." ctaHref="/browse" ctaLabel="Lihat katalog" />
        ) : (
          myRatings.map((rating) => {
            const manga = resolveMangaById(rating.mangaId);
            if (!manga) return null;
            return (
              <article key={`${rating.mangaId}-${rating.userId}`} className="rounded-xl border border-[var(--border)] p-3">
                <Link href={`/manga/${manga.slug}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
                  {manga.title}
                </Link>
                <div className="mt-1 flex items-center gap-2">
                  <RatingStars value={rating.value} size="sm" />
                  <span className="text-xs text-[var(--text-muted)]">{formatRelativeDate(rating.updatedAt)}</span>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Comments</h2>
        {myComments.length === 0 ? (
          <EmptyState title="Belum ada komentar" description="Kirim komentar di halaman detail manga." ctaHref="/browse" ctaLabel="Cari manga" />
        ) : (
          myComments.map((comment) => {
            const manga = resolveMangaById(comment.mangaId);
            if (!manga) return null;
            return (
              <article key={comment.id} className="rounded-xl border border-[var(--border)] p-3">
                <Link href={`/manga/${manga.slug}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent)]">
                  {manga.title}
                </Link>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{comment.content}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{formatRelativeDate(comment.createdAt)}</p>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}