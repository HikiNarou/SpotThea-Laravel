"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, GripVertical, Plus, SquarePen, X } from "lucide-react";

import { createAdminChapter, fetchAdminMangaDetail, uploadChapterPageImages, upsertAdminChapterPages } from "@/lib/api/admin-api";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/app-store";
import type { ChapterPage, Manga } from "@/types/domain";

type SubmitIntent = "upload" | "upload-another";

interface UploadPageItem {
  id: string;
  file: File;
  fileName: string;
  previewUrl: string;
}

interface UploadedPageItem {
  imageUrl: string;
  width: number;
  height: number;
  sourceName: string;
}

const languageOptions = [
  { value: "id", label: "Indonesia", countryCode: "id" },
  { value: "en", label: "English", countryCode: "us" },
  { value: "ja", label: "Japanese", countryCode: "jp" },
  { value: "ko", label: "Korean", countryCode: "kr" },
  { value: "zh", label: "Chinese", countryCode: "cn" },
] as const;

const fileNameCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function resolveFlagUrl(countryCode: string): string {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
}

function createUploadPage(file: File): UploadPageItem {
  return {
    id: `upload-${crypto.randomUUID()}`,
    file,
    fileName: file.name,
    previewUrl: URL.createObjectURL(file),
  };
}

function normalizeFileKey(fileName: string): string {
  return fileName.trim().toLowerCase();
}

function isNumericMangaId(id: string): boolean {
  return /^\d+$/.test(id);
}

function resolveStatusLabel(status: Manga["status"]) {
  if (status === "completed") {
    return "Completed";
  }
  if (status === "hiatus") {
    return "Hiatus";
  }

  return "Ongoing";
}

function reorderPages(currentPages: UploadPageItem[], sourceId: string, targetId: string): UploadPageItem[] {
  if (sourceId === targetId) {
    return currentPages;
  }

  const sourceIndex = currentPages.findIndex((page) => page.id === sourceId);
  const targetIndex = currentPages.findIndex((page) => page.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) {
    return currentPages;
  }

  const nextPages = [...currentPages];
  const [moved] = nextPages.splice(sourceIndex, 1);
  nextPages.splice(targetIndex, 0, moved);
  return nextPages;
}

function resolveUploadedPageOrder(uploaded: UploadedPageItem[], selected: UploadPageItem[]): UploadedPageItem[] {
  const available = [...uploaded];
  const resolved: UploadedPageItem[] = [];

  for (const selectedPage of selected) {
    const selectedKey = normalizeFileKey(selectedPage.fileName);
    const matchedIndex = available.findIndex((item) => normalizeFileKey(item.sourceName) === selectedKey);

    if (matchedIndex >= 0) {
      resolved.push(available.splice(matchedIndex, 1)[0]);
      continue;
    }

    if (available.length > 0) {
      resolved.push(available.shift() as UploadedPageItem);
    }
  }

  return [...resolved, ...available];
}

function toChapterPagePayload(items: UploadedPageItem[]): ChapterPage[] {
  return items.map((item, index) => ({
    id: `temp-${index + 1}`,
    index,
    imageUrl: item.imageUrl,
    width: item.width,
    height: item.height,
  }));
}

export default function AdminAddChapterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const mangaId = params.id;
  const token = useAppStore((state) => state.session?.token);
  const role = useAppStore((state) => state.session?.role);
  const canWrite = role === "admin";

  const [manga, setManga] = useState<Manga | null>(null);
  const [isLoadingManga, setIsLoadingManga] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recoveryChapterId, setRecoveryChapterId] = useState<string | null>(null);
  const [submitIntent, setSubmitIntent] = useState<SubmitIntent | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isOneshot, setIsOneshot] = useState(false);
  const [volumeNumber, setVolumeNumber] = useState("");
  const [chapterNumber, setChapterNumber] = useState("1");
  const [translationLanguage, setTranslationLanguage] = useState("id");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [chapterName, setChapterName] = useState("");

  const [pages, setPages] = useState<UploadPageItem[]>([]);
  const pagesRef = useRef<UploadPageItem[]>([]);
  const [isFilesDragOver, setIsFilesDragOver] = useState(false);
  const [draggingPageId, setDraggingPageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const languageDropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedLanguage = useMemo(
    () => languageOptions.find((option) => option.value === translationLanguage) ?? languageOptions[0],
    [translationLanguage],
  );

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  useEffect(() => {
    if (!isLanguageDropdownOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!languageDropdownRef.current?.contains(target)) {
        setIsLanguageDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLanguageDropdownOpen]);

  useEffect(() => {
    return () => {
      for (const page of pagesRef.current) {
        URL.revokeObjectURL(page.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    if (!isNumericMangaId(mangaId)) {
      setPageError("ID manga tidak valid. Gunakan ID numerik manga pada URL.");
      setManga(null);
      return;
    }

    let mounted = true;

    const loadManga = async () => {
      setIsLoadingManga(true);
      setPageError(null);

      try {
        const response = await fetchAdminMangaDetail(mangaId, token);
        if (!mounted) {
          return;
        }

        setManga(response.manga);
        setChapterNumber(String(Math.max(1, response.manga.chapterCount + 1)));
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error instanceof ApiClientError) {
          setPageError(error.message);
        } else {
          setPageError("Gagal memuat detail manga.");
        }
      } finally {
        if (mounted) {
          setIsLoadingManga(false);
        }
      }
    };

    void loadManga();

    return () => {
      mounted = false;
    };
  }, [mangaId, token]);

  const appendFiles = useCallback((incomingFiles: File[]) => {
    const imageFiles = incomingFiles.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      setSubmitError("Hanya file gambar yang didukung untuk halaman chapter.");
      return;
    }

    setSubmitError(null);
    setPages((current) => [...current, ...imageFiles.map((file) => createUploadPage(file))]);
  }, []);

  const removePage = (pageId: string) => {
    setPages((current) => {
      const target = current.find((page) => page.id === pageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((page) => page.id !== pageId);
    });
  };

  const removeAllPages = () => {
    setPages((current) => {
      for (const page of current) {
        URL.revokeObjectURL(page.previewUrl);
      }
      return [];
    });
  };

  const quickSortPages = () => {
    setPages((current) => [...current].sort((left, right) => fileNameCollator.compare(left.fileName, right.fileName)));
  };

  const handleDropFiles = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsFilesDragOver(false);

    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length > 0) {
      appendFiles(files);
    }
  };

  const handleSubmit = async (intent: SubmitIntent) => {
    if (!token || !manga || !canWrite) {
      setSubmitError("Hanya admin yang dapat mengunggah chapter.");
      return;
    }

    const parsedChapterNumber = Number(chapterNumber);
    const parsedVolumeNumber = volumeNumber.trim() === "" ? null : Number(volumeNumber);
    if (!Number.isFinite(parsedChapterNumber) || parsedChapterNumber <= 0) {
      setSubmitError("Chapter number wajib diisi dengan angka lebih dari 0.");
      return;
    }

    if (parsedVolumeNumber !== null && (!Number.isFinite(parsedVolumeNumber) || parsedVolumeNumber < 0)) {
      setSubmitError("Volume number harus berupa angka valid.");
      return;
    }

    if (chapterName.trim().length === 0) {
      setSubmitError("Chapter name wajib diisi.");
      return;
    }

    if (pages.length === 0) {
      setSubmitError("Minimal satu halaman gambar wajib diunggah.");
      return;
    }

    setSubmitIntent(intent);
    setSubmitError(null);
    setRecoveryChapterId(null);
    setSuccessMessage(null);

    let createdChapterId: string | null = null;

    try {
      const createdChapter = await createAdminChapter(
        manga.id,
        {
          number: parsedChapterNumber,
          title: chapterName.trim(),
          isOneshot,
          volumeNumber: parsedVolumeNumber,
          translationLanguage,
          isPublished: true,
        },
        token,
      );

      createdChapterId = createdChapter.id;

      const uploadResponse = await uploadChapterPageImages(
        createdChapter.id,
        pages.map((page) => page.file),
        token,
      );

      const orderedUploadItems = resolveUploadedPageOrder(uploadResponse.items, pages);
      await upsertAdminChapterPages(createdChapter.id, toChapterPagePayload(orderedUploadItems), token);

      if (intent === "upload-another") {
        removeAllPages();
        setChapterName("");
        setChapterNumber(String(parsedChapterNumber + 1));
        setSuccessMessage(`Chapter ${createdChapter.number} berhasil diunggah. Siap untuk chapter berikutnya.`);
        return;
      }

      router.push(`/admin/manga/${manga.id}/chapters`);
    } catch (error) {
      if (createdChapterId !== null) {
        setRecoveryChapterId(createdChapterId);
      }

      if (error instanceof ApiClientError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Gagal mengunggah chapter. Silakan coba lagi.");
      }
    } finally {
      setSubmitIntent(null);
    }
  };

  if (!token) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai admin untuk upload chapter." ctaHref="/login" ctaLabel="Masuk" />;
  }

  if (!canWrite) {
    return (
      <EmptyState
        title="Akses ditolak"
        description="Halaman upload chapter hanya untuk role admin."
        ctaHref="/admin"
        ctaLabel="Kembali ke Dashboard"
      />
    );
  }

  if (isLoadingManga && !manga) {
    return <EmptyState title="Memuat detail manga..." description="Mohon tunggu sebentar." />;
  }

  if (pageError && !manga) {
    return <EmptyState title="Manga tidak dapat dimuat" description={pageError} ctaHref="/admin/manga" ctaLabel="Kembali ke Manga List" />;
  }

  if (!manga) {
    return <EmptyState title="Manga tidak ditemukan" description="Pastikan URL memakai ID manga yang valid." ctaHref="/admin/manga" ctaLabel="Kembali" />;
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-[#2f333d] bg-[#11151d] text-[#f5f7fb]">
        <header className="border-b-4 border-[#ff6b3d] px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/admin/manga/${manga.id}/chapters`} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#363c49] bg-[#181d27]">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-sm text-[#9fa8ba]">Admin / Manga / Upload Chapter</p>
              <h1 className="font-display text-4xl leading-tight text-[#f7f9ff]">Upload Chapter</h1>
            </div>
          </div>
        </header>

        <div className="space-y-7 px-5 py-6">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Details</h2>
            <article className="flex flex-wrap items-start gap-4 rounded-2xl border border-[#323845] bg-[#1f232c] p-4">
              <Image src={manga.coverUrl} alt={manga.title} width={76} height={104} className="rounded-lg object-cover" unoptimized />
              <div className="space-y-1">
                <p className="text-xl font-semibold text-[#f7f9ff]">{manga.title}</p>
                <p className="text-base text-[#d5dbea]">{manga.author}, {manga.artist}</p>
                <span className="inline-flex items-center gap-2 rounded-lg border border-[#2f4a33] bg-[#1d2d22] px-3 py-1 text-sm text-[#96e5a5]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2ad553]" />
                  {resolveStatusLabel(manga.status)}
                </span>
              </div>
            </article>
          </section>

          <section className="space-y-4 border-t border-[#2e3441] pt-6">
            <label className="inline-flex items-center gap-3 text-xl text-[#e9edf7]">
              <input
                type="checkbox"
                checked={isOneshot}
                onChange={(event) => setIsOneshot(event.target.checked)}
                className="h-6 w-6 rounded border border-[#495065] bg-[#121720]"
              />
              This is a Oneshot
            </label>

            <div className="grid gap-3 lg:grid-cols-3">
              <Input
                value={volumeNumber}
                onChange={(event) => setVolumeNumber(event.target.value)}
                placeholder="Volume Number"
                className="h-14 rounded-xl border-[#323845] bg-[#252a34] text-lg placeholder:text-[#aeb6c8]"
              />
              <Input
                value={chapterNumber}
                onChange={(event) => setChapterNumber(event.target.value)}
                placeholder="Chapter Number"
                className="h-14 rounded-xl border-[#323845] bg-[#252a34] text-lg placeholder:text-[#aeb6c8]"
              />
              <div className="relative" ref={languageDropdownRef}>
                <button
                  type="button"
                  className="flex h-14 w-full items-center justify-between rounded-xl border border-[#323845] bg-[#252a34] px-3 text-left text-lg text-[#f1f5ff] transition hover:border-[#4b5365]"
                  onClick={() => setIsLanguageDropdownOpen((current) => !current)}
                  aria-haspopup="listbox"
                  aria-expanded={isLanguageDropdownOpen}
                >
                  <span className="inline-flex items-center gap-2">
                    <Image
                      src={resolveFlagUrl(selectedLanguage.countryCode)}
                      alt={`Flag ${selectedLanguage.label}`}
                      width={22}
                      height={16}
                      className="h-4 w-[22px] rounded-[2px] object-cover"
                      unoptimized
                    />
                    <span className="text-sm uppercase text-[#9da8bf]">{selectedLanguage.countryCode.toUpperCase()}</span>
                    <span>{selectedLanguage.label}</span>
                  </span>
                  <ChevronDown size={16} className={`text-[#a8b1c4] transition ${isLanguageDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isLanguageDropdownOpen ? (
                  <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#3b4250] bg-[#1a2029] p-1 shadow-2xl" role="listbox">
                    {languageOptions.map((option) => {
                      const isSelected = option.value === translationLanguage;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition ${
                            isSelected ? "bg-[#2a3448] text-[#f2f6ff]" : "text-[#d2d9e8] hover:bg-[#262f3f]"
                          }`}
                          onClick={() => {
                            setTranslationLanguage(option.value);
                            setIsLanguageDropdownOpen(false);
                          }}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <Image
                            src={resolveFlagUrl(option.countryCode)}
                            alt={`Flag ${option.label}`}
                            width={22}
                            height={16}
                            className="h-4 w-[22px] rounded-[2px] object-cover"
                            unoptimized
                          />
                          <span className="text-sm uppercase text-[#8fa0c4]">{option.countryCode.toUpperCase()}</span>
                          <span className="text-base">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            <Input
              value={chapterName}
              onChange={(event) => setChapterName(event.target.value)}
              placeholder="Chapter Name"
              className="h-14 rounded-xl border-[#323845] bg-[#252a34] text-lg placeholder:text-[#aeb6c8]"
            />

            <p className="text-sm text-[#91a0bb]">
              Translation Language dipilih:
              <span className="ml-2 inline-flex items-center gap-2 font-semibold text-[#e7ebf6]">
                <Image
                  src={resolveFlagUrl(selectedLanguage.countryCode)}
                  alt={`Flag ${selectedLanguage.label}`}
                  width={18}
                  height={13}
                  className="h-[13px] w-[18px] rounded-[2px] object-cover"
                  unoptimized
                />
                <span>{selectedLanguage.countryCode.toUpperCase()} {selectedLanguage.label}</span>
              </span>
            </p>
          </section>

          <section className="space-y-4 border-t border-[#2e3441] pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-semibold">Pages</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 rounded-xl border-[#39404f] bg-[#1e232c] px-4 text-[#e9edfa]"
              >
                <Plus size={16} />
                Add Images
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
              multiple
              className="hidden"
              onChange={(event) => {
                appendFiles(Array.from(event.currentTarget.files ?? []));
                event.currentTarget.value = "";
              }}
            />

            <div
              className={`rounded-2xl border border-dashed p-3 transition ${isFilesDragOver ? "border-[#ff6b3d] bg-[#2a2320]" : "border-[#3a4150] bg-[#121720]"}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsFilesDragOver(true);
              }}
              onDragLeave={() => setIsFilesDragOver(false)}
              onDrop={handleDropFiles}
            >
              <div className="flex flex-wrap gap-4">
                {pages.map((page, index) => (
                  <article
                    key={page.id}
                    className="group relative w-[155px] rounded-xl border border-[#3a4150] bg-[#1a1f28] p-1"
                    draggable
                    onDragStart={() => setDraggingPageId(page.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const droppedFiles = Array.from(event.dataTransfer.files ?? []);
                      if (droppedFiles.length > 0) {
                        appendFiles(droppedFiles);
                        return;
                      }

                      if (!draggingPageId) {
                        return;
                      }

                      setPages((current) => reorderPages(current, draggingPageId, page.id));
                      setDraggingPageId(null);
                    }}
                  >
                    <div className="absolute left-2 top-2 z-10 inline-flex items-center rounded-full bg-black/65 px-2 py-1 text-xs text-white">
                      {(index + 1).toString().padStart(3, "0")}
                    </div>
                    <button
                      type="button"
                      onClick={() => removePage(page.id)}
                      className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute left-2 top-11 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white">
                      <SquarePen size={12} />
                    </div>
                    <div className="absolute inset-x-0 bottom-10 z-10 flex justify-center opacity-0 transition group-hover:opacity-100">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#101522]">
                        <GripVertical size={18} />
                      </span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={page.previewUrl} alt={page.fileName} className="h-[210px] w-full rounded-lg object-cover" />
                    <p className="mt-2 truncate rounded-md bg-[#2f3542] px-2 py-1 text-xs text-[#ecf1ff]">{page.fileName}</p>
                  </article>
                ))}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="grid h-[260px] w-[155px] place-items-center rounded-xl border border-dashed border-[#4d5567] bg-[#171c25] text-[#e9ecf8] transition hover:border-[#ff6b3d] hover:text-[#ff9f80]"
                >
                  <Plus size={34} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <Button variant="ghost" className="h-10 rounded-none px-0 text-3xl font-semibold text-[#f5f8ff]" onClick={quickSortPages}>
                Quick sort
              </Button>
              <Button variant="ghost" className="h-10 rounded-none px-0 text-3xl font-semibold text-[#f5f8ff]" onClick={removeAllPages}>
                Remove all pages
              </Button>
            </div>
            <p className="text-sm text-[#93a2bc]">
              Quick sort hanya mengurutkan posisi halaman secara ascending berdasarkan nama file asli, tanpa mengubah nama file.
            </p>
          </section>

          {submitError ? (
            <article className="rounded-xl border border-[#5a2e2e] bg-[#3b1e1e] px-4 py-3 text-sm text-[#ffd6d6]">{submitError}</article>
          ) : null}

          {successMessage ? (
            <article className="rounded-xl border border-[#2f5d37] bg-[#1c3a23] px-4 py-3 text-sm text-[#d6ffe1]">{successMessage}</article>
          ) : null}

          {recoveryChapterId ? (
            <article className="rounded-xl border border-[#3f4f76] bg-[#1a2238] px-4 py-3 text-sm text-[#dbe6ff]">
              Chapter sudah berhasil dibuat, tetapi proses upload halaman sempat gagal.
              <Link href={`/admin/chapters/${recoveryChapterId}/pages`} className="ml-2 underline">
                Lanjutkan di Manage Pages
              </Link>
            </article>
          ) : null}
        </div>

        <footer className="border-t border-[#2e3441] bg-[#11151d] px-5 py-4">
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              className="h-14 min-w-[320px] rounded-xl border-[#4f3a35] bg-[#2a2220] text-lg text-[#d7aca0] hover:bg-[#3c2b26]"
              onClick={() => void handleSubmit("upload-another")}
              isLoading={submitIntent === "upload-another"}
              disabled={submitIntent !== null}
            >
              Upload and add another chapter
            </Button>
            <Button
              className="h-14 min-w-[220px] rounded-xl bg-[#7b3f2e] text-lg text-[#fbe7de] hover:bg-[#944b36]"
              onClick={() => void handleSubmit("upload")}
              isLoading={submitIntent === "upload"}
              disabled={submitIntent !== null}
            >
              Upload
            </Button>
          </div>
        </footer>
      </div>
    </section>
  );
}
