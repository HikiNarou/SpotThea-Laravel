"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { type AdminChapterQuery, fetchAdminChapters, fetchAdminMangaDetail, removeAdminChapter, updateAdminChapter } from "@/lib/api/admin-api";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import type { Chapter, Manga } from "@/types/domain";

interface ChapterFormState {
  id: string;
  number: string;
  title: string;
  isOneshot: boolean;
  volumeNumber: string;
  translationLanguage: string;
  publishedAt: string;
  isPublished: boolean;
}

const emptyForm: ChapterFormState = {
  id: "",
  number: "1",
  title: "",
  isOneshot: false,
  volumeNumber: "",
  translationLanguage: "id",
  publishedAt: "",
  isPublished: true,
};

interface ChapterListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const defaultListMeta: ChapterListMeta = {
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1,
};

const languageOptions = [
  { value: "id", label: "Indonesia" },
  { value: "en", label: "English" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
] as const;

function toLocalDateTimeInput(isoDate: string | undefined) {
  if (!isoDate) {
    return "";
  }

  const date = new Date(isoDate);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toIsoFromInput(input: string) {
  if (!input) {
    return null;
  }

  return new Date(input).toISOString();
}

function resolveChapterMeta(chapter: Chapter) {
  return `${chapter.isOneshot ? "Oneshot" : "Serial"} · Vol ${chapter.volumeNumber ?? "-"} · ${String(chapter.translationLanguage ?? "id").toUpperCase()}`;
}

export default function AdminMangaChaptersPage() {
  const params = useParams<{ id: string }>();
  const mangaId = params.id;
  const token = useAppStore((state) => state.session?.token);
  const role = useAppStore((state) => state.session?.role);
  const canWrite = role === "admin";

  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [listMeta, setListMeta] = useState<ChapterListMeta>(defaultListMeta);
  const [searchInput, setSearchInput] = useState("");
  const [listQuery, setListQuery] = useState<AdminChapterQuery>({
    q: "",
    sortBy: "number",
    sortDir: "desc",
    page: 1,
    pageSize: 10,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState<ChapterFormState>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [mangaResponse, chaptersResponse] = await Promise.all([fetchAdminMangaDetail(mangaId, token), fetchAdminChapters(mangaId, listQuery, token)]);

      setManga(mangaResponse.manga);
      setChapters(chaptersResponse.items);
      setListMeta({
        page: chaptersResponse.page,
        pageSize: chaptersResponse.pageSize,
        total: chaptersResponse.total,
        totalPages: Math.max(1, chaptersResponse.totalPages),
      });
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Gagal memuat data chapter.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [listQuery, mangaId, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setListQuery((prev) => {
        const normalizedSearch = searchInput.trim();
        if ((prev.q ?? "") === normalizedSearch) {
          return prev;
        }

        return {
          ...prev,
          q: normalizedSearch,
          page: 1,
        };
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const requestedPage = listQuery.page ?? 1;
    if (requestedPage <= listMeta.totalPages) {
      return;
    }

    setListQuery((prev) => ({
      ...prev,
      page: listMeta.totalPages,
    }));
  }, [listMeta.totalPages, listQuery.page]);

  const openEdit = (chapter: Chapter) => {
    setSubmitError(null);
    setFormState({
      id: chapter.id,
      number: String(chapter.number),
      title: chapter.title,
      isOneshot: Boolean(chapter.isOneshot),
      volumeNumber: chapter.volumeNumber != null ? String(chapter.volumeNumber) : "",
      translationLanguage: chapter.translationLanguage ?? "id",
      publishedAt: toLocalDateTimeInput(chapter.publishedAt),
      isPublished: chapter.isPublished ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }

    setModalOpen(false);
    setSubmitError(null);
  };

  const saveChapter = async () => {
    if (!token || !canWrite || !formState.id) {
      setSubmitError("Hanya admin yang bisa mengubah chapter.");
      return;
    }

    const chapterNumber = Number(formState.number);
    const volumeNumber = formState.volumeNumber.trim() === "" ? null : Number(formState.volumeNumber);
    if (!Number.isFinite(chapterNumber) || chapterNumber <= 0) {
      setSubmitError("Nomor chapter tidak valid.");
      return;
    }

    if (volumeNumber !== null && (!Number.isFinite(volumeNumber) || volumeNumber < 0)) {
      setSubmitError("Volume number tidak valid.");
      return;
    }

    if (!formState.title.trim()) {
      setSubmitError("Judul chapter wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateAdminChapter(
        formState.id,
        {
          number: chapterNumber,
          title: formState.title.trim(),
          isOneshot: formState.isOneshot,
          volumeNumber,
          translationLanguage: formState.translationLanguage,
          publishedAt: toIsoFromInput(formState.publishedAt),
          isPublished: formState.isPublished,
        },
        token,
      );

      setModalOpen(false);
      await loadData();
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Gagal menyimpan perubahan chapter.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteChapter = async (chapter: Chapter) => {
    if (!token || !canWrite) {
      alert("Hanya admin yang bisa menghapus chapter.");
      return;
    }

    const confirmed = window.confirm(`Hapus chapter ${chapter.number} - ${chapter.title}?`);
    if (!confirmed) {
      return;
    }

    try {
      await removeAdminChapter(chapter.id, token);
      await loadData();
    } catch (error) {
      if (error instanceof ApiClientError) {
        alert(error.message);
      } else {
        alert("Gagal menghapus chapter.");
      }
    }
  };

  const goToPage = (nextPage: number) => {
    setListQuery((prev) => ({
      ...prev,
      page: Math.max(1, Math.min(nextPage, listMeta.totalPages)),
    }));
  };

  const refreshCurrentList = () => {
    setListQuery((prev) => ({ ...prev }));
  };

  const chapterSummary = useMemo(() => {
    if (listMeta.total === 0) {
      return "Belum ada chapter";
    }

    const rangeStart = (listMeta.page - 1) * listMeta.pageSize + 1;
    const rangeEnd = Math.min(listMeta.total, rangeStart + chapters.length - 1);
    const sortLabel = listQuery.sortDir === "asc" ? "Oldest Chapter" : "Latest Chapter";

    return `${listMeta.total} chapter · ${sortLabel} · menampilkan ${rangeStart}-${rangeEnd}`;
  }, [chapters.length, listMeta.page, listMeta.pageSize, listMeta.total, listQuery.sortDir]);

  if (!token) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai admin." ctaHref="/login" ctaLabel="Masuk" />;
  }

  if (isLoading && !manga) {
    return <EmptyState title="Memuat chapter..." description="Sedang mengambil data manga dari server." />;
  }

  if (errorMessage && !manga) {
    return <EmptyState title="Gagal memuat manga" description={errorMessage} ctaHref="/admin/manga" ctaLabel="Kembali" />;
  }

  if (!manga) {
    return <EmptyState title="Manga tidak ditemukan" description="Pastikan ID manga valid." ctaHref="/admin/manga" ctaLabel="Kembali" />;
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Admin / Manga / {manga.title}</p>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Chapter Management</h1>
          <p className="text-sm text-[var(--text-secondary)]">{chapterSummary}</p>
        </div>
        {canWrite ? (
          <Link href={`/admin/manga/add-chapters/${manga.id}`}>
            <Button>Tambah Chapter</Button>
          </Link>
        ) : null}
      </header>

      {errorMessage ? (
        <article className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">{errorMessage}</article>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Cari judul chapter atau nomor chapter..." />
          <Select
            value={listQuery.sortDir ?? "desc"}
            onChange={(event) =>
              setListQuery((prev) => ({
                ...prev,
                sortDir: event.target.value === "asc" ? "asc" : "desc",
                page: 1,
              }))
            }
          >
            <option value="desc">Latest Chapter (Desc)</option>
            <option value="asc">Oldest Chapter (Asc)</option>
          </Select>
          <Button variant="secondary" onClick={refreshCurrentList} disabled={isLoading}>
            Refresh
          </Button>
        </div>
        {isLoading ? <p className="mt-2 text-xs text-[var(--text-muted)]">Memuat daftar chapter...</p> : null}
      </section>

      {listMeta.total === 0 ? (
        <EmptyState title="Belum ada chapter" description="Tambahkan chapter pertama untuk manga ini." />
      ) : (
        <section className="space-y-3">
          {chapters.map((chapter) => (
            <article key={chapter.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Ch. {chapter.number} - {chapter.title}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{resolveChapterMeta(chapter)}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {chapter.pages.length} pages · {new Date(chapter.publishedAt).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/chapters/${chapter.id}/pages`}>
                  <Button variant="secondary" size="sm">
                    Manage Pages
                  </Button>
                </Link>
                {canWrite ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(chapter)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => void deleteChapter(chapter)}>
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}

          <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <Button
              variant="secondary"
              disabled={listMeta.page <= 1 || isLoading}
              onClick={() => goToPage(listMeta.page - 1)}
              className="h-11 rounded-2xl px-5"
            >
              <ChevronLeft size={16} />
              Prev
            </Button>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Page {listMeta.page} / {listMeta.totalPages}
            </p>
            <Button
              variant="secondary"
              disabled={listMeta.page >= listMeta.totalPages || isLoading}
              onClick={() => goToPage(listMeta.page + 1)}
              className="h-11 rounded-2xl px-5"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        </section>
      )}

      <Modal open={modalOpen} onClose={closeModal} title="Edit Chapter" className="max-w-2xl">
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              type="number"
              value={formState.number}
              onChange={(event) => setFormState((prev) => ({ ...prev, number: event.target.value }))}
              placeholder="Nomor chapter"
            />
            <Input
              type="number"
              value={formState.volumeNumber}
              onChange={(event) => setFormState((prev) => ({ ...prev, volumeNumber: event.target.value }))}
              placeholder="Nomor volume (opsional)"
            />
          </div>

          <Input value={formState.title} onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))} placeholder="Judul chapter" />

          <Select
            value={formState.translationLanguage}
            onChange={(event) => setFormState((prev) => ({ ...prev, translationLanguage: event.target.value }))}
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Input
            type="datetime-local"
            value={formState.publishedAt}
            onChange={(event) => setFormState((prev) => ({ ...prev, publishedAt: event.target.value }))}
            placeholder="Tanggal publikasi"
          />

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={formState.isOneshot}
              onChange={(event) => setFormState((prev) => ({ ...prev, isOneshot: event.target.checked }))}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
            />
            This is a Oneshot
          </label>

          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={formState.isPublished}
              onChange={(event) => setFormState((prev) => ({ ...prev, isPublished: event.target.checked }))}
              className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)]"
            />
            Publish chapter ini
          </label>

          {submitError ? <p className="text-sm text-[var(--danger)]">{submitError}</p> : null}

          <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface)] pt-3">
            <Button variant="ghost" onClick={closeModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => void saveChapter()} isLoading={isSubmitting}>
              Save Chapter
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
