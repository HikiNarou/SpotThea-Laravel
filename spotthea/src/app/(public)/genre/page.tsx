"use client";

import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenresQuery } from "@/lib/api/hooks";
import { titleCase } from "@/lib/utils/format";

export default function GenrePage() {
  const { data, isLoading, isError, refetch } = useGenresQuery();

  return (
    <PageShell className="space-y-5">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Home / Genre</p>
        <h1 className="font-display text-4xl text-[var(--text-primary)]">Genres</h1>
        <p className="text-sm text-[var(--text-secondary)]">Pilih genre untuk filter cepat katalog manga.</p>
      </header>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : null}

      {isError ? <ErrorState message="Gagal memuat daftar genre." onRetry={() => refetch()} /> : null}

      {data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((genre) => (
            <Link
              key={genre.slug}
              href={`/genre/${genre.slug}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-soft)]"
            >
              <p className="font-semibold text-[var(--text-primary)]">{titleCase(genre.slug)}</p>
              <p className="text-xs text-[var(--text-muted)]">{genre.count} manga</p>
            </Link>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}