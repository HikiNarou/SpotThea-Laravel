"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { attachAdminGenresToManga, fetchAdminGenres, fetchAdminManga, type AdminTaxonomyItem } from "@/lib/api/admin-api";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import type { Manga } from "@/types/domain";

export default function AdminGenresPage() {
  const session = useAppStore((state) => state.session);
  const token = session?.token;
  const isAdmin = session?.role === "admin";

  const [mangas, setMangas] = useState<Manga[]>([]);
  const [genres, setGenres] = useState<AdminTaxonomyItem[]>([]);
  const [selectedMangaId, setSelectedMangaId] = useState("");
  const [genreInput, setGenreInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token || !isAdmin) {
      return;
    }

    setLoading(true);
    try {
      const [mangaResponse, genreResponse] = await Promise.all([
        fetchAdminManga(
          {
            page: 1,
            pageSize: 100,
            sortBy: "title",
            sortDir: "asc",
          },
          token,
        ),
        fetchAdminGenres(token),
      ]);

      setMangas(mangaResponse.items);
      setGenres(genreResponse);
      setSelectedMangaId((currentSelected) => {
        if (currentSelected !== "" && mangaResponse.items.some((manga) => manga.id === currentSelected)) {
          return currentSelected;
        }

        return mangaResponse.items[0]?.id ?? "";
      });
      setError(null);
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError("Gagal memuat data genres dari backend.");
      }
    } finally {
      setLoading(false);
    }
  }, [isAdmin, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const genreSummary = useMemo(() => {
    if (genres.length > 0) {
      return [...genres].sort((left, right) => (right.count ?? 0) - (left.count ?? 0));
    }

    const fallbackMap = new Map<string, number>();
    mangas.forEach((manga) => {
      manga.genres.forEach((genre) => {
        fallbackMap.set(genre, (fallbackMap.get(genre) ?? 0) + 1);
      });
    });

    return Array.from(fallbackMap.entries())
      .map(([slug, count]) => ({
        id: slug,
        slug,
        name: slug,
        label: slug,
        count,
      }))
      .sort((left, right) => (right.count ?? 0) - (left.count ?? 0));
  }, [genres, mangas]);

  const selectedManga = mangas.find((manga) => manga.id === selectedMangaId) ?? null;

  if (!session) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai admin untuk mengelola genre." ctaHref="/login" ctaLabel="Masuk" />;
  }

  if (!isAdmin) {
    return <EmptyState title="Akses ditolak" description="Genres Management hanya untuk role admin." ctaHref="/admin" ctaLabel="Kembali" />;
  }

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Genres Management</h1>
        <p className="text-sm text-[var(--text-secondary)]">Kelola taxonomy genre dan assign ke manga.</p>
      </header>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add Genre to Manga</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_200px_auto]">
          <Select value={selectedMangaId} onChange={(event) => setSelectedMangaId(event.target.value)} disabled={loading || saving || mangas.length === 0}>
            {mangas.map((manga) => (
              <option key={manga.id} value={manga.id}>
                {manga.title}
              </option>
            ))}
          </Select>
          <Input value={genreInput} onChange={(event) => setGenreInput(event.target.value)} placeholder="contoh: martial-arts" disabled={loading || saving} />
          <Button
            onClick={async () => {
              if (!selectedManga || !token || !genreInput.trim()) {
                return;
              }

              const nextGenre = genreInput.trim().toLowerCase().replace(/\s+/g, "-");
              if (selectedManga.genres.includes(nextGenre)) {
                setError("Genre sudah ada di manga ini.");
                return;
              }

              setSaving(true);
              try {
                const updatedManga = await attachAdminGenresToManga(selectedManga.id, [...selectedManga.genres, nextGenre], token);
                setMangas((currentMangas) => currentMangas.map((item) => (item.id === updatedManga.id ? updatedManga : item)));

                const latestGenres = await fetchAdminGenres(token);
                setGenres(latestGenres);
                setGenreInput("");
                setError(null);
              } catch (requestError) {
                if (requestError instanceof ApiClientError) {
                  setError(requestError.message);
                } else {
                  setError("Gagal menyimpan genre manga.");
                }
              } finally {
                setSaving(false);
              }
            }}
            disabled={loading || saving || !selectedManga}
            isLoading={saving}
          >
            Add
          </Button>
        </div>

        {loading ? <p className="mt-2 text-xs text-[var(--text-muted)]">Memuat data manga dan genre...</p> : null}
        {selectedManga ? <p className="mt-2 text-xs text-[var(--text-muted)]">Genre saat ini: {selectedManga.genres.join(", ")}</p> : null}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Genre Distribution</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {genreSummary.map((genre) => (
            <article key={genre.id} className="rounded-xl border border-[var(--border)] p-3">
              <p className="text-sm font-medium text-[var(--text-primary)]">{genre.label}</p>
              <p className="text-xs text-[var(--text-muted)]">{genre.count ?? 0} manga</p>
            </article>
          ))}
          {genreSummary.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Belum ada data genre.</p> : null}
        </div>
      </section>
    </section>
  );
}
