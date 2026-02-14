import { apiRequest } from "@/lib/api/client";
import type { Chapter, ChapterPage, Manga, PagedResult, PlatformAdItem, PlatformFooterLink, PlatformSettings, ReportPayload, UserRole } from "@/types/domain";

export type MangaAdminSortBy = "updated" | "title" | "created" | "chapter_count" | "popular_rank" | "year";
export type SortDirection = "asc" | "desc";

export interface AdminMangaQuery {
  q?: string;
  status?: Manga["status"] | "all";
  type?: Manga["type"] | "all";
  contentRating?: Manga["contentRating"] | "all";
  sortBy?: MangaAdminSortBy;
  sortDir?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface MangaMutationPayload {
  slug: string;
  title: string;
  altTitle: string;
  synopsis: string;
  status: Manga["status"];
  type: Manga["type"];
  contentRating: Manga["contentRating"];
  year: number | null;
  author: string;
  artist: string;
  serialization: string;
  originalLanguage?: string | null;
  contentWarnings?: string[];
  formats?: string[];
  genres: string[];
  themes?: string[];
  isPublished?: boolean;
  publishAt?: string | null;
  coverUrl: string;
  bannerUrl: string;
}

export interface AdminTaxonomyItem {
  id: string;
  slug: string;
  name: string;
  label: string;
  description?: string | null;
  count?: number | null;
}

export interface ChapterMutationPayload {
  number: number;
  title: string;
  isOneshot?: boolean;
  volumeNumber?: number | null;
  translationLanguage?: string;
  publishedAt?: string | null;
  isPublished?: boolean;
  pages?: Array<{
    id?: string;
    imageUrl: string;
    width?: number;
    height?: number;
  }>;
}

export interface AdminChapterQuery {
  q?: string;
  sortBy?: "number" | "title" | "published_at" | "created_at";
  sortDir?: SortDirection;
  page?: number;
  pageSize?: number;
}

export type ManagedUserRole = Exclude<UserRole, "guest">;

export interface AdminUserQuery {
  q?: string;
  role?: ManagedUserRole | "all";
  page?: number;
  pageSize?: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  role: ManagedUserRole;
  createdAt: string;
  bio: string;
  preferredLocale: "id" | "en";
}

export interface AdminReportQuery {
  status?: ReportPayload["status"] | "all";
  type?: ReportPayload["type"] | "all";
  page?: number;
  pageSize?: number;
}

interface AdminMangaDetailResponse {
  manga: Manga;
}

interface ChapterPagesUploadItem {
  index: number;
  imageUrl: string;
  width: number;
  height: number;
  sourceName: string;
}

interface ChapterPagesUploadResponse {
  items: ChapterPagesUploadItem[];
}

interface ApiPlatformSettings {
  maintenance_mode: boolean;
  site_name: string;
  site_tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  header_notice_enabled: boolean;
  header_notice_text: string;
  footer_description: string;
  footer_copyright: string;
  footer_links: PlatformFooterLink[];
  home_ads_top_items: Array<{
    image_url: string;
    target_url: string;
    alt_text: string;
  }>;
  home_ads_before_latest_items: Array<{
    image_url: string;
    target_url: string;
    alt_text: string;
  }>;
  home_ads_overlay_enabled: boolean;
  home_ads_overlay_items: Array<{
    image_url: string;
    target_url: string;
    alt_text: string;
  }>;
}

interface PlatformSettingsEnvelopeResponse {
  platform: ApiPlatformSettings;
}

interface LaravelPaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface AdminDashboardResponse {
  kpi: {
    mangaCount: number;
    chapterCount: number;
    userCount: number;
    openReportCount: number;
  };
  recentReports: ReportPayload[];
}

function normalizeAdItemsFromApi(items: ApiPlatformSettings["home_ads_top_items"]): PlatformAdItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      imageUrl: item.image_url?.trim() ?? "",
      targetUrl: item.target_url?.trim() ?? "",
      altText: item.alt_text?.trim() ?? "",
    }))
    .filter((item) => item.imageUrl !== "" && item.targetUrl !== "");
}

function normalizePlatformSettingsFromApi(payload: ApiPlatformSettings): PlatformSettings {
  return {
    maintenanceMode: Boolean(payload.maintenance_mode),
    siteName: payload.site_name ?? "",
    siteTagline: payload.site_tagline ?? "",
    logoUrl: payload.logo_url ?? null,
    faviconUrl: payload.favicon_url ?? null,
    headerNoticeEnabled: Boolean(payload.header_notice_enabled),
    headerNoticeText: payload.header_notice_text ?? "",
    footerDescription: payload.footer_description ?? "",
    footerCopyright: payload.footer_copyright ?? "",
    footerLinks: Array.isArray(payload.footer_links)
      ? payload.footer_links
          .map((item) => ({
            label: item.label?.trim() ?? "",
            href: item.href?.trim() ?? "",
          }))
          .filter((item) => item.label !== "" && item.href !== "")
      : [],
    homeAdsTopItems: normalizeAdItemsFromApi(payload.home_ads_top_items),
    homeAdsBeforeLatestItems: normalizeAdItemsFromApi(payload.home_ads_before_latest_items),
    homeAdsOverlayEnabled: Boolean(payload.home_ads_overlay_enabled),
    homeAdsOverlayItems: normalizeAdItemsFromApi(payload.home_ads_overlay_items),
  };
}

function normalizeAdItemsPayload(items: PlatformAdItem[]) {
  const normalizeTargetUrl = (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (trimmed === "") {
      return "";
    }

    if (trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  };

  return items
    .map((item, index) => ({
      image_url: item.imageUrl.trim(),
      target_url: normalizeTargetUrl(item.targetUrl),
      alt_text: item.altText.trim() || `Ad banner ${index + 1}`,
    }))
    .filter((item) => item.image_url !== "" && item.target_url !== "");
}

function normalizePlatformSettingsPayload(payload: PlatformSettings) {
  return {
    maintenance_mode: payload.maintenanceMode,
    site_name: payload.siteName.trim(),
    site_tagline: payload.siteTagline.trim(),
    logo_url: payload.logoUrl?.trim() || null,
    favicon_url: payload.faviconUrl?.trim() || null,
    header_notice_enabled: payload.headerNoticeEnabled,
    header_notice_text: payload.headerNoticeText.trim(),
    footer_description: payload.footerDescription.trim(),
    footer_copyright: payload.footerCopyright.trim(),
    footer_links: payload.footerLinks.map((item) => ({
      label: item.label.trim(),
      href: item.href.trim(),
    })),
    home_ads_top_items: normalizeAdItemsPayload(payload.homeAdsTopItems),
    home_ads_before_latest_items: normalizeAdItemsPayload(payload.homeAdsBeforeLatestItems),
    home_ads_overlay_enabled: payload.homeAdsOverlayEnabled,
    home_ads_overlay_items: normalizeAdItemsPayload(payload.homeAdsOverlayItems),
  };
}

function normalizeChapterPayload(payload: ChapterMutationPayload) {
  return {
    number: payload.number,
    title: payload.title,
    is_oneshot: payload.isOneshot ?? false,
    volume_number: payload.volumeNumber ?? null,
    translation_language: (payload.translationLanguage ?? "id").toLowerCase(),
    published_at: payload.publishedAt ?? null,
    is_published: payload.isPublished ?? true,
    ...(payload.pages
      ? {
          pages: payload.pages.map((page) => ({
            ...(page.id && /^\d+$/.test(page.id) ? { id: Number(page.id) } : {}),
            image_url: page.imageUrl,
            width: page.width ?? null,
            height: page.height ?? null,
          })),
        }
      : {}),
  };
}

function buildAdminMangaQueryString(query: AdminMangaQuery) {
  const params = new URLSearchParams();

  if (query.q && query.q.trim() !== "") {
    params.set("q", query.q.trim());
  }

  if (query.status && query.status !== "all") {
    params.set("status", query.status);
  }

  if (query.type && query.type !== "all") {
    params.set("type", query.type);
  }

  if (query.contentRating && query.contentRating !== "all") {
    params.set("content_rating", query.contentRating);
  }

  params.set("sort_by", query.sortBy ?? "updated");
  params.set("sort_dir", query.sortDir ?? "desc");
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const search = params.toString();
  return search.length > 0 ? `?${search}` : "";
}

function normalizeMangaPayload(payload: MangaMutationPayload) {
  return {
    slug: payload.slug,
    title: payload.title,
    alt_title: payload.altTitle,
    synopsis: payload.synopsis,
    status: payload.status,
    type: payload.type,
    content_rating: payload.contentRating,
    year: payload.year,
    author: payload.author,
    artist: payload.artist,
    serialization: payload.serialization,
    original_language: payload.originalLanguage ?? null,
    content_warnings: payload.contentWarnings ?? [],
    formats: payload.formats ?? [],
    genres: payload.genres,
    themes: payload.themes ?? [],
    is_published: payload.isPublished ?? true,
    publish_at: payload.publishAt ?? null,
    cover_url: payload.coverUrl,
    banner_url: payload.bannerUrl,
  };
}

export async function fetchAdminManga(query: AdminMangaQuery, token: string) {
  return await apiRequest<PagedResult<Manga>>(`/admin/manga${buildAdminMangaQueryString(query)}`, {
    token,
  });
}

export async function fetchAdminDashboard(token: string) {
  return await apiRequest<AdminDashboardResponse>("/admin/dashboard", {
    token,
  });
}

export async function fetchPublicPlatformSettings() {
  const response = await apiRequest<PlatformSettingsEnvelopeResponse>("/site-settings");
  return normalizePlatformSettingsFromApi(response.platform);
}

export async function fetchAdminPlatformSettings(token: string) {
  const response = await apiRequest<PlatformSettingsEnvelopeResponse>("/admin/settings/platform", {
    token,
  });

  return normalizePlatformSettingsFromApi(response.platform);
}

export async function updateAdminPlatformSettings(payload: PlatformSettings, token: string) {
  const response = await apiRequest<PlatformSettingsEnvelopeResponse>("/admin/settings/platform", {
    method: "PUT",
    token,
    body: normalizePlatformSettingsPayload(payload),
  });

  return normalizePlatformSettingsFromApi(response.platform);
}

export async function fetchAdminMangaDetail(mangaId: string, token: string) {
  return await apiRequest<AdminMangaDetailResponse>(`/admin/manga/${encodeURIComponent(mangaId)}`, {
    token,
  });
}

export async function createAdminManga(payload: MangaMutationPayload, token: string) {
  return await apiRequest<Manga>("/admin/manga", {
    method: "POST",
    token,
    body: normalizeMangaPayload(payload),
  });
}

export async function updateAdminManga(mangaId: string, payload: MangaMutationPayload, token: string) {
  return await apiRequest<Manga>(`/admin/manga/${encodeURIComponent(mangaId)}`, {
    method: "PATCH",
    token,
    body: normalizeMangaPayload(payload),
  });
}

export async function removeAdminManga(mangaId: string, token: string) {
  await apiRequest<void>(`/admin/manga/${encodeURIComponent(mangaId)}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchAdminGenres(token: string) {
  return await apiRequest<AdminTaxonomyItem[]>("/admin/genres", {
    token,
  });
}

export async function attachAdminGenresToManga(mangaId: string, genres: string[], token: string) {
  return await apiRequest<Manga>(`/admin/manga/${encodeURIComponent(mangaId)}/genres`, {
    method: "PUT",
    token,
    body: {
      genres,
    },
  });
}

export async function fetchAdminThemes(token: string) {
  return await apiRequest<AdminTaxonomyItem[]>("/admin/themes", {
    token,
  });
}

export async function createAdminTheme(payload: { name: string; slug?: string; description?: string }, token: string) {
  return await apiRequest<AdminTaxonomyItem>("/admin/themes", {
    method: "POST",
    token,
    body: payload,
  });
}

function buildAdminChapterQueryString(query: AdminChapterQuery) {
  const params = new URLSearchParams();

  if (query.q && query.q.trim() !== "") {
    params.set("q", query.q.trim());
  }

  params.set("sort_by", query.sortBy ?? "number");
  params.set("sort_dir", query.sortDir ?? "desc");
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));

  const serialized = params.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

function buildAdminUserQueryString(query: AdminUserQuery) {
  const params = new URLSearchParams();

  if (query.q && query.q.trim() !== "") {
    params.set("q", query.q.trim());
  }

  if (query.role && query.role !== "all") {
    params.set("role", query.role);
  }

  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 20));

  const serialized = params.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

function buildAdminReportQueryString(query: AdminReportQuery) {
  const params = new URLSearchParams();

  if (query.status && query.status !== "all") {
    params.set("status", query.status);
  }

  if (query.type && query.type !== "all") {
    params.set("type", query.type);
  }

  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 30));

  const serialized = params.toString();
  return serialized.length > 0 ? `?${serialized}` : "";
}

export async function fetchAdminChapters(mangaId: string, query: AdminChapterQuery, token: string) {
  return await apiRequest<PagedResult<Chapter>>(`/admin/manga/${encodeURIComponent(mangaId)}/chapters${buildAdminChapterQueryString(query)}`, {
    token,
  });
}

export async function fetchAdminChapter(chapterId: string, token: string) {
  return await apiRequest<Chapter>(`/admin/chapters/${encodeURIComponent(chapterId)}`, {
    token,
  });
}

export async function createAdminChapter(mangaId: string, payload: ChapterMutationPayload, token: string) {
  return await apiRequest<Chapter>(`/admin/manga/${encodeURIComponent(mangaId)}/chapters`, {
    method: "POST",
    token,
    body: normalizeChapterPayload(payload),
  });
}

export async function updateAdminChapter(chapterId: string, payload: ChapterMutationPayload, token: string) {
  return await apiRequest<Chapter>(`/admin/chapters/${encodeURIComponent(chapterId)}`, {
    method: "PATCH",
    token,
    body: normalizeChapterPayload(payload),
  });
}

export async function removeAdminChapter(chapterId: string, token: string) {
  await apiRequest<void>(`/admin/chapters/${encodeURIComponent(chapterId)}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchAdminChapterPages(chapterId: string, token: string) {
  return await apiRequest<ChapterPage[]>(`/admin/chapters/${encodeURIComponent(chapterId)}/pages`, {
    token,
  });
}

export async function upsertAdminChapterPages(chapterId: string, pages: ChapterPage[], token: string) {
  return await apiRequest<ChapterPage[]>(`/admin/chapters/${encodeURIComponent(chapterId)}/pages`, {
    method: "PUT",
    token,
    body: {
      pages: pages.map((page) => ({
        ...(page.id && /^\d+$/.test(page.id) ? { id: Number(page.id) } : {}),
        image_url: page.imageUrl,
        width: page.width || null,
        height: page.height || null,
      })),
    },
  });
}

export async function removeAdminChapterPage(chapterId: string, pageId: string, token: string) {
  await apiRequest<void>(`/admin/chapters/${encodeURIComponent(chapterId)}/pages/${encodeURIComponent(pageId)}`, {
    method: "DELETE",
    token,
  });
}

export async function uploadChapterPageImages(chapterId: string, files: File[], token: string) {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files[]", file);
  });

  return await apiRequest<ChapterPagesUploadResponse>(`/admin/chapters/${encodeURIComponent(chapterId)}/pages/upload`, {
    method: "POST",
    token,
    formData,
  });
}

export async function uploadChapterPagesZip(chapterId: string, archive: File, token: string) {
  const formData = new FormData();
  formData.append("archive", archive);

  return await apiRequest<ChapterPagesUploadResponse>(`/admin/chapters/${encodeURIComponent(chapterId)}/pages/upload-zip`, {
    method: "POST",
    token,
    formData,
  });
}

export async function uploadAdminMangaAsset(type: "cover" | "banner" | "site_logo" | "site_favicon" | "ad_banner", file: File, token: string) {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);

  return await apiRequest<{ type: "cover" | "banner" | "site_logo" | "site_favicon" | "ad_banner"; url: string; width: number; height: number }>("/admin/uploads/manga-assets", {
    method: "POST",
    token,
    formData,
  });
}

export async function fetchAdminUsers(query: AdminUserQuery, token: string) {
  return await apiRequest<PagedResult<AdminUserItem>>(`/admin/users${buildAdminUserQueryString(query)}`, {
    token,
  });
}

export async function updateAdminUserRole(userId: string, role: ManagedUserRole, token: string) {
  return await apiRequest<AdminUserItem>(`/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    token,
    body: {
      role,
    },
  });
}

export async function fetchAdminReports(query: AdminReportQuery, token: string) {
  const response = await apiRequest<LaravelPaginatedResponse<ReportPayload>>(`/admin/reports${buildAdminReportQueryString(query)}`, {
    token,
  });

  return {
    items: response.data,
    page: response.meta.current_page,
    pageSize: response.meta.per_page,
    total: response.meta.total,
    totalPages: response.meta.last_page,
  } as PagedResult<ReportPayload>;
}

export async function updateAdminReportStatus(reportId: string, status: ReportPayload["status"], token: string) {
  return await apiRequest<ReportPayload>(`/admin/reports/${encodeURIComponent(reportId)}/status`, {
    method: "PATCH",
    token,
    body: {
      status,
    },
  });
}
