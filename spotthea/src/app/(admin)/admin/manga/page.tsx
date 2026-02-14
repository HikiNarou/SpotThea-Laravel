"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

import {
  fetchAdminManga,
  type MangaAdminSortBy,
  removeAdminManga,
  type SortDirection,
} from "@/lib/api/admin-api";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import type { Manga, PagedResult } from "@/types/domain";

const pageSizeOptions = [20, 40, 80];

function formatDate(dateValue: string) {
  if (!dateValue) {
    return "-";
  }

  return new Date(dateValue).toLocaleDateString("id-ID");
}

export default function AdminMangaPage() {
  const token = useAppStore((state) => state.session?.token);
  const role = useAppStore((state) => state.session?.role);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Manga["status"] | "all">("all");
  const [typeFilter, setTypeFilter] = useState<Manga["type"] | "all">("all");
  const [sortBy, setSortBy] = useState<MangaAdminSortBy>("updated");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [result, setResult] = useState<PagedResult<Manga> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const hasToken = Boolean(token);
  const canWrite = role === "admin";

  const listItems = result?.items ?? [];
  const totalPages = result?.totalPages ?? 1;
  const totalRows = result?.total ?? 0;

  const loadManga = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetchAdminManga(
        {
          q: query,
          status: statusFilter,
          type: typeFilter,
          sortBy,
          sortDir,
          page,
          pageSize,
        },
        token,
      );
      setResult(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setLoadError(error.message);
      } else {
        setLoadError("Gagal memuat data manga admin.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, query, sortBy, sortDir, statusFilter, token, typeFilter]);

  useEffect(() => {
    void loadManga();
  }, [loadManga]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, typeFilter, sortBy, sortDir, pageSize]);

  const pageLabel = useMemo(() => {
    if (!result || totalRows === 0) {
      return "0 data";
    }

    const start = (result.page - 1) * result.pageSize + 1;
    const end = Math.min(totalRows, start + result.items.length - 1);
    return `${start}-${end} dari ${totalRows}`;
  }, [result, totalRows]);

  const deleteManga = async (manga: Manga) => {
    if (!token || !canWrite) {
      alert("Hanya admin yang dapat menghapus manga.");
      return;
    }

    const confirmed = window.confirm(`Hapus manga "${manga.title}" beserta chapter-nya?`);
    if (!confirmed) {
      return;
    }

    try {
      await removeAdminManga(manga.id, token);
      await loadManga();
    } catch (error) {
      if (error instanceof ApiClientError) {
        alert(error.message);
      } else {
        alert("Gagal menghapus manga.");
      }
    }
  };

  if (!hasToken) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai admin untuk mengelola katalog manga." ctaHref="/login" ctaLabel="Masuk" />;
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Manga Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">Kelola data manga produksi dengan filter, sorting, dan CRUD terintegrasi database.</p>
        </div>
        {canWrite ? (
          <Link href="/admin/create/manga#title">
            <Button>Tambah Manga</Button>
          </Link>
        ) : null}
      </header>

      <section className="grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 md:grid-cols-[minmax(220px,1fr)_160px_150px_170px_130px_110px_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau slug..." />

        <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Manga["status"] | "all")}>
          <option value="all">Semua status</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="hiatus">Hiatus</option>
        </Select>

        <Select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as Manga["type"] | "all")}>
          <option value="all">Semua type</option>
          <option value="manga">Manga</option>
          <option value="manhwa">Manhwa</option>
          <option value="manhua">Manhua</option>
        </Select>

        <Select value={sortBy} onChange={(event) => setSortBy(event.target.value as MangaAdminSortBy)}>
          <option value="updated">Latest Update</option>
          <option value="title">Title</option>
          <option value="created">Date Created</option>
          <option value="chapter_count">Chapter Count</option>
          <option value="popular_rank">Popular Rank</option>
          <option value="year">Year</option>
        </Select>

        <Select value={sortDir} onChange={(event) => setSortDir(event.target.value as SortDirection)}>
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </Select>

        <Select value={String(pageSize)} onChange={(event) => setPageSize(Number(event.target.value))}>
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option} / page
            </option>
          ))}
        </Select>

        <Button variant="secondary" onClick={() => void loadManga()} disabled={isLoading}>
          <RotateCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <table className="min-w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--surface-soft)] text-left text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Chapters</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                  Memuat daftar manga...
                </td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-[var(--danger)]">
                  {loadError}
                </td>
              </tr>
            ) : listItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                  Data manga tidak ditemukan.
                </td>
              </tr>
            ) : (
              listItems.map((manga) => (
                <tr key={manga.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-3 py-2">
                    <p className="font-medium text-[var(--text-primary)]">{manga.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{manga.slug}</p>
                  </td>
                  <td className="px-3 py-2 capitalize">{manga.status}</td>
                  <td className="px-3 py-2 capitalize">{manga.type}</td>
                  <td className="px-3 py-2">{manga.chapterCount}</td>
                  <td className="px-3 py-2">{formatDate(manga.updatedAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <Link href={`/admin/manga/${manga.id}/chapters`}>
                        <Button variant="secondary" size="sm">
                          Chapters
                        </Button>
                      </Link>
                      {canWrite ? (
                        <>
                          <Link href={`/admin/edit/manga/${manga.id}#title`}>
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button variant="danger" size="sm" onClick={() => void deleteManga(manga)}>
                            Delete
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-[var(--text-secondary)]">{pageLabel}</p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1 || isLoading}>
            <ChevronLeft size={14} />
            Prev
          </Button>
          <span className="text-[var(--text-muted)]">
            Page {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((value) => (value < totalPages ? value + 1 : value))}
            disabled={page >= totalPages || isLoading}
          >
            Next
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </section>
  );
}
