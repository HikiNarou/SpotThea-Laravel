"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { useCurrentUser, useUserHistory, useUserLibrary } from "@/stores/app-store";
import { formatRelativeDate } from "@/lib/utils/format";
import { resolveChapterById, resolveMangaById } from "@/lib/utils/resolve-catalog";
import type { HistoryEntry, Manga, Chapter } from "@/types/domain";

export default function UserDashboardPage() {
  const user = useCurrentUser();
  const history = useUserHistory();
  const library = useUserLibrary();

  const following = library.filter((entry) => entry.type === "following");
  const continueReadingEntries = useMemo(
    () =>
      history
        .slice(0, 5)
        .map((entry) => ({
          entry,
          manga: entry.manga ?? resolveMangaById(entry.mangaId),
          chapter: entry.chapter ?? resolveChapterById(entry.chapterId),
        }))
        .filter((item): item is { entry: HistoryEntry; manga: Manga; chapter: Chapter } => item.manga !== undefined && item.chapter !== undefined),
    [history],
  );

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center gap-3">
          {user ? <Image src={user.avatarUrl} alt={user.username} width={64} height={64} className="rounded-full" unoptimized /> : null}
          <div>
            <h1 className="font-display text-3xl text-[var(--text-primary)]">Welcome back, {user?.username ?? "Reader"}</h1>
            <p className="text-sm text-[var(--text-secondary)]">Kelola progres baca, library, dan preferensi akunmu.</p>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Following</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{following.length}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">History Entries</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{history.length}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Role</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{user?.role ?? "user"}</p>
        </article>
      </section>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Continue Reading</h2>
          <Link href="/me/history" className="text-sm text-[var(--accent)] hover:underline">
            Lihat semua
          </Link>
        </div>

        {continueReadingEntries.length === 0 ? (
          <EmptyState title="Belum ada history" description="Mulai baca manga untuk menyimpan progress." ctaHref="/browse" ctaLabel="Mulai Browse" />
        ) : (
          <div className="space-y-3">
            {continueReadingEntries.map(({ entry, manga, chapter }) => {
              return (
                <article key={entry.chapterId} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-xl border border-[var(--border)] p-3">
                  <Image src={manga.coverUrl} alt={manga.title} width={56} height={80} className="rounded-md object-cover" unoptimized />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{manga.title}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Chapter {chapter.number}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{formatRelativeDate(entry.updatedAt)}</p>
                  </div>
                  <Link href={`/read/${manga.slug}/${chapter.id}`} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs hover:bg-[var(--surface-soft)]">
                    Resume
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <Link href="/me/library" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-[var(--surface-soft)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Library</h3>
          <p className="text-sm text-[var(--text-secondary)]">Kelola following, bookmark, favorites, dan custom list.</p>
        </Link>
        <Link href="/me/settings" className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:bg-[var(--surface-soft)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h3>
          <p className="text-sm text-[var(--text-secondary)]">Update profil, keamanan akun, dan preferensi reader.</p>
        </Link>
      </section>
    </section>
  );
}
