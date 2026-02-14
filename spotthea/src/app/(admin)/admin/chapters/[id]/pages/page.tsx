"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GripVertical, ImagePlus, Link as LinkIcon, Trash2, Upload, UploadCloud } from "lucide-react";

import {
  fetchAdminChapter,
  fetchAdminChapterPages,
  removeAdminChapterPage,
  upsertAdminChapterPages,
  uploadChapterPageImages,
  uploadChapterPagesZip,
} from "@/lib/api/admin-api";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/app-store";
import type { Chapter, ChapterPage } from "@/types/domain";

function reindexPages(pages: ChapterPage[]) {
  return pages.map((page, index) => ({
    ...page,
    index,
  }));
}

function sortPages(pages: ChapterPage[]) {
  return [...pages].sort((left, right) => left.index - right.index);
}

function isPersistedId(id: string) {
  return /^\d+$/.test(id);
}

function createTempPageId() {
  return `tmp-${crypto.randomUUID()}`;
}

export default function AdminChapterPagesPage() {
  const params = useParams<{ id: string }>();
  const chapterId = params.id;

  const token = useAppStore((state) => state.session?.token);
  const role = useAppStore((state) => state.session?.role);
  const canWrite = role === "admin";

  const imageFileInputRef = useRef<HTMLInputElement | null>(null);
  const zipFileInputRef = useRef<HTMLInputElement | null>(null);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<ChapterPage[]>([]);
  const [removedPersistedPageIds, setRemovedPersistedPageIds] = useState<string[]>([]);
  const [manualPageUrl, setManualPageUrl] = useState("");
  const [draggingPageId, setDraggingPageId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [chapterResponse, pagesResponse] = await Promise.all([fetchAdminChapter(chapterId, token), fetchAdminChapterPages(chapterId, token)]);

      setChapter(chapterResponse);
      setPages(reindexPages(sortPages(pagesResponse)));
      setRemovedPersistedPageIds([]);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Gagal memuat halaman chapter.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [chapterId, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const chapterLabel = useMemo(() => {
    if (!chapter) {
      return "";
    }

    return `${chapter.mangaTitle ?? chapter.mangaSlug ?? "Manga"} - Chapter ${chapter.number}`;
  }, [chapter]);

  const addManualPage = () => {
    const trimmed = manualPageUrl.trim();
    if (!trimmed) {
      return;
    }

    setPages((prev) =>
      reindexPages([
        ...prev,
        {
          id: createTempPageId(),
          index: prev.length,
          imageUrl: trimmed,
          width: 0,
          height: 0,
        },
      ]),
    );
    setManualPageUrl("");
  };

  const appendUploadedPages = (nextPages: Array<{ imageUrl: string; width: number; height: number }>) => {
    if (nextPages.length === 0) {
      return;
    }

    setPages((prev) =>
      reindexPages([
        ...prev,
        ...nextPages.map((page, index) => ({
          id: createTempPageId(),
          index: prev.length + index,
          imageUrl: page.imageUrl,
          width: page.width,
          height: page.height,
        })),
      ]),
    );
  };

  const onUploadImageFiles = async (files: File[]) => {
    if (!token || !canWrite || files.length === 0) {
      return;
    }

    setIsUploadingImages(true);
    setErrorMessage(null);

    try {
      const response = await uploadChapterPageImages(chapterId, files, token);
      appendUploadedPages(
        response.items.map((item) => ({
          imageUrl: item.imageUrl,
          width: item.width,
          height: item.height,
        })),
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Upload gambar gagal.");
      }
    } finally {
      setIsUploadingImages(false);
    }
  };

  const onUploadZipFile = async (archive: File | null) => {
    if (!token || !canWrite || !archive) {
      return;
    }

    setIsUploadingZip(true);
    setErrorMessage(null);

    try {
      const response = await uploadChapterPagesZip(chapterId, archive, token);
      appendUploadedPages(
        response.items.map((item) => ({
          imageUrl: item.imageUrl,
          width: item.width,
          height: item.height,
        })),
      );
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Upload ZIP gagal.");
      }
    } finally {
      setIsUploadingZip(false);
    }
  };

  const removePage = (pageId: string) => {
    setPages((prev) => reindexPages(prev.filter((page) => page.id !== pageId)));
    if (isPersistedId(pageId)) {
      setRemovedPersistedPageIds((prev) => (prev.includes(pageId) ? prev : [...prev, pageId]));
    }
  };

  const movePage = (sourcePageId: string, targetPageId: string) => {
    if (sourcePageId === targetPageId) {
      return;
    }

    setPages((prev) => {
      const sourceIndex = prev.findIndex((page) => page.id === sourcePageId);
      const targetIndex = prev.findIndex((page) => page.id === targetPageId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return prev;
      }

      const clone = [...prev];
      const [moved] = clone.splice(sourceIndex, 1);
      clone.splice(targetIndex, 0, moved);
      return reindexPages(clone);
    });
  };

  const onSave = async () => {
    if (!token || !canWrite) {
      return;
    }

    if (pages.length === 0) {
      alert("Minimal harus ada satu halaman.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (removedPersistedPageIds.length > 0) {
        await Promise.all(removedPersistedPageIds.map(async (pageId) => await removeAdminChapterPage(chapterId, pageId, token)));
      }

      const saved = await upsertAdminChapterPages(chapterId, reindexPages(pages), token);
      setPages(reindexPages(sortPages(saved)));
      setRemovedPersistedPageIds([]);
      alert("Halaman chapter berhasil disimpan.");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Gagal menyimpan halaman chapter.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!token) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai admin." ctaHref="/login" ctaLabel="Masuk" />;
  }

  if (isLoading && !chapter) {
    return <EmptyState title="Memuat halaman chapter..." description="Mohon tunggu sebentar." />;
  }

  if (!chapter) {
    return <EmptyState title="Chapter tidak ditemukan" description={errorMessage ?? "ID chapter tidak valid."} ctaHref="/admin/manga" ctaLabel="Kembali" />;
  }

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <p className="text-sm text-[var(--text-muted)]">Admin / Chapters / {chapter.id}</p>
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Manage Chapter Pages</h1>
        <p className="text-sm text-[var(--text-secondary)]">{chapterLabel}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link href={`/admin/manga/${chapter.mangaId}/chapters`}>
          <Button variant="ghost">Kembali ke Chapter List</Button>
        </Link>
        <Button onClick={() => void onSave()} isLoading={isSaving} disabled={!canWrite || isUploadingImages || isUploadingZip}>
          <UploadCloud size={16} />
          Save Changes
        </Button>
      </div>

      <section className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Upload Halaman</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Upload gambar lokal (multi-file) atau ZIP batch. Urutan otomatis berdasarkan nama file (natural ascending).
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => imageFileInputRef.current?.click()}
            disabled={!canWrite || isUploadingImages || isUploadingZip}
            isLoading={isUploadingImages}
          >
            <ImagePlus size={16} />
            Upload Images
          </Button>
          <Button
            variant="secondary"
            onClick={() => zipFileInputRef.current?.click()}
            disabled={!canWrite || isUploadingImages || isUploadingZip}
            isLoading={isUploadingZip}
          >
            <Upload size={16} />
            Upload ZIP
          </Button>
        </div>

        <input
          ref={imageFileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            void onUploadImageFiles(files);
            event.currentTarget.value = "";
          }}
        />

        <input
          ref={zipFileInputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(event) => {
            const archive = event.target.files?.[0] ?? null;
            void onUploadZipFile(archive);
            event.currentTarget.value = "";
          }}
        />

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            placeholder="Tambahkan URL gambar manual (opsional)"
            value={manualPageUrl}
            onChange={(event) => setManualPageUrl(event.target.value)}
            disabled={!canWrite}
          />
          <Button variant="secondary" onClick={addManualPage} disabled={!canWrite}>
            <LinkIcon size={16} />
            Add URL
          </Button>
        </div>
      </section>

      {errorMessage ? (
        <article className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">{errorMessage}</article>
      ) : null}

      <section className="space-y-3">
        {pages.map((page) => (
          <article
            key={page.id}
            className="grid grid-cols-[72px_1fr_auto] items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
            draggable={canWrite}
            onDragStart={() => setDraggingPageId(page.id)}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={() => {
              if (draggingPageId) {
                movePage(draggingPageId, page.id);
              }
              setDraggingPageId(null);
            }}
          >
            <Image src={page.imageUrl} alt={`Page ${page.index + 1}`} width={72} height={102} className="rounded-md object-cover" unoptimized />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Page {page.index + 1}</p>
              <p className="truncate text-xs text-[var(--text-muted)]">{page.imageUrl}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-1 text-xs text-[var(--text-muted)]">
                <GripVertical size={14} />
              </span>
              {canWrite ? (
                <Button variant="ghost" size="sm" onClick={() => removePage(page.id)} aria-label={`Delete page ${page.index + 1}`}>
                  <Trash2 size={15} />
                </Button>
              ) : null}
            </div>
          </article>
        ))}

        {pages.length === 0 ? (
          <EmptyState
            title="Belum ada halaman"
            description="Upload gambar chapter dari perangkat lokal atau ZIP batch agar admin workflow lebih cepat."
          />
        ) : null}
      </section>
    </section>
  );
}
