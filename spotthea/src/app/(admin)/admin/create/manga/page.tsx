"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { BookMarked, Camera, Clock3, Info, Plus, Sparkles, Tag, UploadCloud } from "lucide-react";

import {
  createAdminManga,
  createAdminTheme,
  fetchAdminGenres,
  fetchAdminThemes,
  uploadAdminMangaAsset,
  type AdminTaxonomyItem,
} from "@/lib/api/admin-api";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { slugify } from "@/lib/utils/slugify";
import { useAppStore } from "@/stores/app-store";
import type { Manga } from "@/types/domain";

type PublishMode = "immediate" | "scheduled";

interface MangaCreateFormState {
  title: string;
  slug: string;
  altTitle: string;
  synopsis: string;
  author: string;
  artist: string;
  serialization: string;
  year: number;
  originalLanguage: string;
  status: Manga["status"];
  type: Manga["type"];
  contentRating: Manga["contentRating"];
  publishMode: PublishMode;
  scheduledAt: string;
  contentWarnings: string[];
  formats: string[];
  genres: string[];
  themes: string[];
  coverUrl: string;
  bannerUrl: string;
}

const PRESET_CONTENT_WARNINGS = [
  "gore",
  "sexual-violence",
  "strong-language",
  "self-harm",
  "drug-use",
  "violence",
  "body-horror",
];

const PRESET_FORMATS = [
  "4-koma",
  "adaptation",
  "anthology",
  "award-winning",
  "full-color",
  "long-strip",
  "one-shot",
  "official-colored",
  "web-comic",
];

const SECTION_ITEMS = [
  { id: "title", label: "Title", icon: BookMarked },
  { id: "metadata", label: "Metadata", icon: Info },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "covers", label: "Covers", icon: Camera },
] as const;

type SectionId = (typeof SECTION_ITEMS)[number]["id"];

const SECTION_DESCRIPTIONS: Record<SectionId, string> = {
  title: "Input judul utama, slug otomatis, judul alternatif, dan synopsis.",
  metadata: "Atur author, artist, bahasa asli, status, rating, format publikasi, dan jadwal rilis.",
  tags: "Kelola Content Warning, Format, Genre, dan Theme secara praktis.",
  covers: "Upload langsung cover dan banner, atau isi URL manual.",
};

const defaultFormState: MangaCreateFormState = {
  title: "",
  slug: "",
  altTitle: "",
  synopsis: "",
  author: "",
  artist: "",
  serialization: "",
  year: new Date().getFullYear(),
  originalLanguage: "ja",
  status: "ongoing",
  type: "manga",
  contentRating: "safe",
  publishMode: "immediate",
  scheduledAt: "",
  contentWarnings: [],
  formats: [],
  genres: ["action", "fantasy"],
  themes: [],
  coverUrl: "https://picsum.photos/seed/new-cover/480/680",
  bannerUrl: "https://picsum.photos/seed/new-banner/1600/600",
};

function toggleArrayValue(list: string[], value: string) {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return [...list, value];
}

function normalizeTagList(list: string[]) {
  return Array.from(new Set(list.map((item) => slugify(item)).filter(Boolean)));
}

function resolveSectionFromHash(hash: string): SectionId {
  const section = hash.replace(/^#/, "");
  if (SECTION_ITEMS.some((item) => item.id === section)) {
    return section as SectionId;
  }

  return "title";
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
          : "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] hover:border-[var(--accent)]/45 hover:text-[var(--text-primary)]",
      )}
    >
      {label}
    </button>
  );
}

export default function AdminCreateMangaPage() {
  const router = useRouter();
  const token = useAppStore((state) => state.session?.token);
  const role = useAppStore((state) => state.session?.role);
  const canWrite = role === "admin";

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  const [formState, setFormState] = useState<MangaCreateFormState>(defaultFormState);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [genresOptions, setGenresOptions] = useState<AdminTaxonomyItem[]>([]);
  const [themesOptions, setThemesOptions] = useState<AdminTaxonomyItem[]>([]);
  const [customGenreInput, setCustomGenreInput] = useState("");
  const [customThemeInput, setCustomThemeInput] = useState("");
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("title");

  const sectionIndex = useMemo(
    () => SECTION_ITEMS.findIndex((item) => item.id === activeSection),
    [activeSection],
  );

  const activeSectionMeta = useMemo(
    () => SECTION_ITEMS.find((item) => item.id === activeSection) ?? SECTION_ITEMS[0],
    [activeSection],
  );

  const allGenreOptions = useMemo(() => {
    const manual = formState.genres.filter((slug) => !genresOptions.some((item) => item.slug === slug));
    return [
      ...genresOptions.map((item) => item.slug),
      ...manual,
    ];
  }, [formState.genres, genresOptions]);

  const allThemeOptions = useMemo(() => {
    const manual = formState.themes.filter((slug) => !themesOptions.some((item) => item.slug === slug));
    return [
      ...themesOptions.map((item) => item.slug),
      ...manual,
    ];
  }, [formState.themes, themesOptions]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const applyFromHash = () => {
      setActiveSection(resolveSectionFromHash(window.location.hash));
    };

    applyFromHash();
    window.addEventListener("hashchange", applyFromHash);

    return () => window.removeEventListener("hashchange", applyFromHash);
  }, []);

  useEffect(() => {
    if (!token || !canWrite) {
      return;
    }

    setIsLoadingTaxonomy(true);
    setPageError(null);

    void Promise.all([fetchAdminGenres(token), fetchAdminThemes(token)])
      .then(([genres, themes]) => {
        setGenresOptions(genres);
        setThemesOptions(themes);
      })
      .catch((error) => {
        if (error instanceof ApiClientError) {
          setPageError(error.message);
          return;
        }

        setPageError("Gagal memuat taxonomy admin.");
      })
      .finally(() => setIsLoadingTaxonomy(false));
  }, [canWrite, token]);

  const addCustomGenre = () => {
    const slug = slugify(customGenreInput);
    if (!slug) {
      return;
    }

    setFormState((prev) => ({
      ...prev,
      genres: normalizeTagList([...prev.genres, slug]),
    }));
    setCustomGenreInput("");
  };

  const addCustomTheme = async () => {
    const slug = slugify(customThemeInput);
    if (!slug || !token || !canWrite) {
      return;
    }

    if (allThemeOptions.includes(slug)) {
      setFormState((prev) => ({
        ...prev,
        themes: normalizeTagList([...prev.themes, slug]),
      }));
      setCustomThemeInput("");
      return;
    }

    try {
      const created = await createAdminTheme(
        {
          name: customThemeInput.trim(),
          slug,
        },
        token,
      );

      setThemesOptions((prev) => {
        if (prev.some((item) => item.slug === created.slug)) {
          return prev;
        }
        return [...prev, created].sort((left, right) => left.name.localeCompare(right.name));
      });

      setFormState((prev) => ({
        ...prev,
        themes: normalizeTagList([...prev.themes, created.slug]),
      }));

      setCustomThemeInput("");
      setPageError(null);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPageError(error.message);
        return;
      }

      setPageError("Gagal menambahkan theme baru.");
    }
  };

  const uploadAsset = async (type: "cover" | "banner", file: File | null) => {
    if (!file || !token || !canWrite) {
      return;
    }

    if (type === "cover") {
      setIsUploadingCover(true);
    } else {
      setIsUploadingBanner(true);
    }

    setPageError(null);

    try {
      const uploaded = await uploadAdminMangaAsset(type, file, token);
      setFormState((prev) => ({
        ...prev,
        ...(type === "cover" ? { coverUrl: uploaded.url } : { bannerUrl: uploaded.url }),
      }));
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPageError(error.message);
      } else {
        setPageError("Upload cover gagal.");
      }
    } finally {
      if (type === "cover") {
        setIsUploadingCover(false);
      } else {
        setIsUploadingBanner(false);
      }
    }
  };

  const submit = async () => {
    if (!token || !canWrite) {
      setPageError("Hanya admin yang dapat publish manga.");
      return;
    }

    const slug = formState.slug.trim() || slugify(formState.title);
    if (!slug || !formState.title.trim() || !formState.synopsis.trim() || !formState.author.trim() || !formState.coverUrl.trim()) {
      setPageError("Title, synopsis, author, slug, dan cover wajib diisi.");
      return;
    }

    if (formState.publishMode === "scheduled" && !formState.scheduledAt) {
      setPageError("Pilih tanggal dan jam untuk jadwal rilis.");
      return;
    }

    const publishAt =
      formState.publishMode === "scheduled"
        ? new Date(formState.scheduledAt).toISOString()
        : new Date().toISOString();

    if (formState.publishMode === "scheduled" && new Date(publishAt).getTime() <= Date.now()) {
      setPageError("Jadwal rilis harus lebih dari waktu saat ini.");
      return;
    }

    setIsSubmitting(true);
    setPageError(null);

    try {
      await createAdminManga(
        {
          slug,
          title: formState.title.trim(),
          altTitle: formState.altTitle.trim(),
          synopsis: formState.synopsis.trim(),
          status: formState.status,
          type: formState.type,
          contentRating: formState.contentRating,
          year: Number.isFinite(formState.year) ? formState.year : null,
          author: formState.author.trim(),
          artist: formState.artist.trim(),
          serialization: formState.serialization.trim(),
          originalLanguage: formState.originalLanguage.trim() || null,
          contentWarnings: normalizeTagList(formState.contentWarnings),
          formats: normalizeTagList(formState.formats),
          genres: normalizeTagList(formState.genres),
          themes: normalizeTagList(formState.themes),
          isPublished: true,
          publishAt,
          coverUrl: formState.coverUrl.trim(),
          bannerUrl: formState.bannerUrl.trim() || formState.coverUrl.trim(),
        },
        token,
      );

      router.push("/admin/manga");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setPageError(error.message);
      } else {
        setPageError("Gagal publish manga.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);

    if (typeof window !== "undefined") {
      const nextHash = `#${sectionId}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", nextHash);
      }
    }
  };

  const moveSection = (direction: "prev" | "next") => {
    const currentIndex = SECTION_ITEMS.findIndex((item) => item.id === activeSection);
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    const boundedIndex = Math.max(0, Math.min(nextIndex, SECTION_ITEMS.length - 1));
    selectSection(SECTION_ITEMS[boundedIndex].id);
  };

  if (!token) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai admin untuk membuat manga baru." ctaHref="/login" ctaLabel="Masuk" />;
  }

  if (!canWrite) {
    return <EmptyState title="Akses ditolak" description="Halaman publish manga hanya untuk role admin." ctaHref="/admin/manga" ctaLabel="Kembali" />;
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Admin / Create / Manga</p>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Publish Manga Baru</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Step {sectionIndex + 1}/{SECTION_ITEMS.length}: {activeSectionMeta.label} · {SECTION_DESCRIPTIONS[activeSection]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/manga">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button onClick={() => void submit()} isLoading={isSubmitting}>
            <UploadCloud size={16} />
            {formState.publishMode === "scheduled" ? "Schedule Publish" : "Publish"}
          </Button>
        </div>
      </header>

      {pageError ? <article className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">{pageError}</article> : null}

      <div className="grid gap-4 lg:grid-cols-[210px_1fr] lg:items-start">
        <aside className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 lg:sticky lg:top-24">
          <nav className="space-y-1">
            {SECTION_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => selectSection(id)}
                aria-current={activeSection === id ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  activeSection === id
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-4">
          <section
            id="title"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "title" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Title</h2>
            <p className="text-sm text-[var(--text-secondary)]">Input judul utama, slug otomatis, judul alternatif, dan synopsis.</p>

            <div className="mt-3 grid gap-3">
              <Input
                placeholder="Title"
                value={formState.title}
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setFormState((prev) => ({
                    ...prev,
                    title: nextTitle,
                    ...(slugManuallyEdited ? {} : { slug: slugify(nextTitle) }),
                  }));
                }}
              />

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Slug"
                  value={formState.slug}
                  onChange={(event) => {
                    setSlugManuallyEdited(true);
                    setFormState((prev) => ({ ...prev, slug: slugify(event.target.value) }));
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSlugManuallyEdited(false);
                    setFormState((prev) => ({ ...prev, slug: slugify(prev.title) }));
                  }}
                >
                  Auto Slug
                </Button>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Preview URL: `/manga/{formState.slug || slugify(formState.title) || "judul-manga"}`</p>

              <Input
                placeholder="Alternative Title"
                value={formState.altTitle}
                onChange={(event) => setFormState((prev) => ({ ...prev, altTitle: event.target.value }))}
              />
              <Textarea
                placeholder="Synopsis"
                value={formState.synopsis}
                onChange={(event) => setFormState((prev) => ({ ...prev, synopsis: event.target.value }))}
                className="min-h-40"
              />
            </div>
          </section>

          <section
            id="metadata"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "metadata" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Metadata</h2>
            <p className="text-sm text-[var(--text-secondary)]">Atur author, artist, bahasa asli, status, rating, format publikasi, dan jadwal rilis.</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input placeholder="Author" value={formState.author} onChange={(event) => setFormState((prev) => ({ ...prev, author: event.target.value }))} />
              <Input placeholder="Artist" value={formState.artist} onChange={(event) => setFormState((prev) => ({ ...prev, artist: event.target.value }))} />

              <Select
                value={formState.originalLanguage}
                onChange={(event) => setFormState((prev) => ({ ...prev, originalLanguage: event.target.value }))}
              >
                <option value="ja">Japanese (JA)</option>
                <option value="ko">Korean (KO)</option>
                <option value="zh">Chinese (ZH)</option>
                <option value="id">Indonesian (ID)</option>
                <option value="en">English (EN)</option>
              </Select>

              <Input
                type="number"
                placeholder="Publication Year"
                value={String(formState.year)}
                onChange={(event) => setFormState((prev) => ({ ...prev, year: Number(event.target.value) }))}
              />

              <Select
                value={formState.contentRating}
                onChange={(event) => setFormState((prev) => ({ ...prev, contentRating: event.target.value as Manga["contentRating"] }))}
              >
                <option value="safe">Safe</option>
                <option value="mature">Mature</option>
              </Select>

              <Select value={formState.status} onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value as Manga["status"] }))}>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </Select>

              <Select value={formState.type} onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value as Manga["type"] }))}>
                <option value="manga">Manga</option>
                <option value="manhwa">Manhwa</option>
                <option value="manhua">Manhua</option>
              </Select>

              <Input
                placeholder="Serialization"
                value={formState.serialization}
                onChange={(event) => setFormState((prev) => ({ ...prev, serialization: event.target.value }))}
              />
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Clock3 size={14} />
                Publish Schedule
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  value={formState.publishMode}
                  onChange={(event) => setFormState((prev) => ({ ...prev, publishMode: event.target.value as PublishMode }))}
                >
                  <option value="immediate">Publish Sekarang</option>
                  <option value="scheduled">Jadwalkan Publish</option>
                </Select>
                <Input
                  type="datetime-local"
                  value={formState.scheduledAt}
                  onChange={(event) => setFormState((prev) => ({ ...prev, scheduledAt: event.target.value }))}
                  disabled={formState.publishMode !== "scheduled"}
                />
              </div>
            </div>
          </section>

          <section
            id="tags"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "tags" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tags</h2>
            <p className="text-sm text-[var(--text-secondary)]">Kelola Content Warning, Format, Genre, dan Theme secara praktis.</p>

            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Content Warning</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_CONTENT_WARNINGS.map((item) => (
                    <Chip
                      key={item}
                      active={formState.contentWarnings.includes(item)}
                      label={item.replace(/-/g, " ")}
                      onClick={() => setFormState((prev) => ({ ...prev, contentWarnings: toggleArrayValue(prev.contentWarnings, item) }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Format</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_FORMATS.map((item) => (
                    <Chip
                      key={item}
                      active={formState.formats.includes(item)}
                      label={item.replace(/-/g, " ")}
                      onClick={() => setFormState((prev) => ({ ...prev, formats: toggleArrayValue(prev.formats, item) }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Genre</p>
                {isLoadingTaxonomy ? <p className="text-xs text-[var(--text-muted)]">Memuat genre...</p> : null}
                <div className="flex flex-wrap gap-2">
                  {allGenreOptions.map((slug) => (
                    <Chip
                      key={slug}
                      active={formState.genres.includes(slug)}
                      label={slug.replace(/-/g, " ")}
                      onClick={() => setFormState((prev) => ({ ...prev, genres: toggleArrayValue(prev.genres, slug) }))}
                    />
                  ))}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Tambah genre baru"
                    value={customGenreInput}
                    onChange={(event) => setCustomGenreInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomGenre();
                      }
                    }}
                  />
                  <Button variant="secondary" onClick={addCustomGenre}>
                    <Plus size={14} />
                    Add Genre
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Theme</p>
                {isLoadingTaxonomy ? <p className="text-xs text-[var(--text-muted)]">Memuat theme...</p> : null}
                <div className="flex flex-wrap gap-2">
                  {allThemeOptions.map((slug) => (
                    <Chip
                      key={slug}
                      active={formState.themes.includes(slug)}
                      label={slug.replace(/-/g, " ")}
                      onClick={() => setFormState((prev) => ({ ...prev, themes: toggleArrayValue(prev.themes, slug) }))}
                    />
                  ))}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="Tambah theme baru"
                    value={customThemeInput}
                    onChange={(event) => setCustomThemeInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void addCustomTheme();
                      }
                    }}
                  />
                  <Button variant="secondary" onClick={() => void addCustomTheme()}>
                    <Sparkles size={14} />
                    Add Theme
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section
            id="covers"
            className={cn(
              "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4",
              activeSection !== "covers" && "hidden",
            )}
          >
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Covers</h2>
            <p className="text-sm text-[var(--text-secondary)]">Upload langsung cover dan banner, atau isi URL manual.</p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Main Cover</p>
                <div className="mb-3 aspect-[2/3] overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]">
                  {formState.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formState.coverUrl} alt="Cover preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-[var(--text-muted)]">No cover</div>
                  )}
                </div>
                <Input value={formState.coverUrl} onChange={(event) => setFormState((prev) => ({ ...prev, coverUrl: event.target.value }))} placeholder="Cover URL" />
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void uploadAsset("cover", file);
                    event.currentTarget.value = "";
                  }}
                />
                <Button className="mt-2 w-full" variant="secondary" onClick={() => coverInputRef.current?.click()} isLoading={isUploadingCover}>
                  Upload Cover
                </Button>
              </article>

              <article className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Banner Cover</p>
                <div className="mb-3 aspect-[16/6] overflow-hidden rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]">
                  {formState.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formState.bannerUrl} alt="Banner preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-[var(--text-muted)]">No banner</div>
                  )}
                </div>
                <Input value={formState.bannerUrl} onChange={(event) => setFormState((prev) => ({ ...prev, bannerUrl: event.target.value }))} placeholder="Banner URL" />
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    void uploadAsset("banner", file);
                    event.currentTarget.value = "";
                  }}
                />
                <Button className="mt-2 w-full" variant="secondary" onClick={() => bannerInputRef.current?.click()} isLoading={isUploadingBanner}>
                  Upload Banner
                </Button>
              </article>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button variant="ghost" disabled={sectionIndex === 0} onClick={() => moveSection("prev")}>
                Sebelumnya
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/admin/manga">
                  <Button variant="ghost">Cancel</Button>
                </Link>
                {sectionIndex < SECTION_ITEMS.length - 1 ? (
                  <Button onClick={() => moveSection("next")}>Lanjut</Button>
                ) : (
                  <Button onClick={() => void submit()} isLoading={isSubmitting}>
                    <UploadCloud size={16} />
                    {formState.publishMode === "scheduled" ? "Schedule Publish" : "Publish"}
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
