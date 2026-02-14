export type UserRole = "guest" | "user" | "moderator" | "admin";

export type MangaStatus = "ongoing" | "completed" | "hiatus";
export type MangaType = "manga" | "manhwa" | "manhua";
export type ReaderMode = "vertical" | "paginated" | "webtoon";
export type ReaderTheme = "light" | "dim" | "dark" | "sepia";
export type ContentRating = "safe" | "mature";

export interface PlatformFooterLink {
  label: string;
  href: string;
}

export interface PlatformAdItem {
  imageUrl: string;
  targetUrl: string;
  altText: string;
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  siteName: string;
  siteTagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  headerNoticeEnabled: boolean;
  headerNoticeText: string;
  footerDescription: string;
  footerCopyright: string;
  footerLinks: PlatformFooterLink[];
  homeAdsTopItems: PlatformAdItem[];
  homeAdsBeforeLatestItems: PlatformAdItem[];
  homeAdsOverlayEnabled: boolean;
  homeAdsOverlayItems: PlatformAdItem[];
}

export interface ChapterPage {
  id: string;
  index: number;
  imageUrl: string;
  width: number;
  height: number;
}

export interface Chapter {
  id: string;
  mangaId: string;
  mangaSlug: string;
  mangaTitle?: string;
  number: number;
  title: string;
  isOneshot?: boolean;
  volumeNumber?: number | null;
  translationLanguage?: string;
  publishedAt: string;
  isPublished?: boolean;
  pages: ChapterPage[];
}

export interface Manga {
  id: string;
  slug: string;
  title: string;
  altTitle: string;
  synopsis: string;
  status: MangaStatus;
  type: MangaType;
  contentRating: ContentRating;
  year: number;
  author: string;
  artist: string;
  serialization: string;
  originalLanguage?: string | null;
  genres: string[];
  themes?: string[];
  contentWarnings?: string[];
  formats?: string[];
  isPublished?: boolean;
  publishAt?: string | null;
  coverUrl: string;
  bannerUrl: string;
  chapterCount: number;
  baseRating: number;
  baseRatingCount: number;
  views: number;
  followers: number;
  updatedAt: string;
  featuredRank: number | null;
  popularRank: number;
  originCountryCode?: "JP" | "KR" | "CN" | "ID";
  originCountryLabel?: string;
}

export interface MangaCardData extends Manga {
  latestChapter: Chapter;
  firstChapter: Chapter;
}

export interface MangaDetail {
  manga: Manga;
  chapters: Chapter[];
  related: Manga[];
}

export interface BrowseFilters {
  query?: string;
  genres?: string[];
  status?: MangaStatus[];
  types?: MangaType[];
  contentRating?: ContentRating[];
  country?: "ALL" | "KR" | "JP" | "CN" | "ID";
  yearFrom?: number;
  yearTo?: number;
  sort?: "popular" | "latest" | "oldest" | "rating" | "az";
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SuggestionItem {
  id: string;
  slug: string;
  title: string;
  coverUrl: string;
  status: MangaStatus;
  latestChapterNumber: number;
}

export interface UserProfile {
  id: string;
  email: string;
  password: string;
  username: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
  bio: string;
  preferredLocale: "id" | "en";
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  username: string;
  email: string;
  avatarUrl: string;
  token: string;
}

export interface LibraryEntry {
  mangaId: string;
  type: "following" | "bookmark" | "favorites" | "to-read" | "dropped";
  createdAt: string;
  updatedAt: string;
  manga?: Manga;
}

export interface HistoryEntry {
  mangaId: string;
  chapterId: string;
  pageIndex: number;
  progressPct: number;
  updatedAt: string;
  manga?: Manga;
  chapter?: Chapter;
}

export interface MangaRating {
  mangaId: string;
  userId: string;
  value: number;
  updatedAt: string;
}

export interface MangaComment {
  id: string;
  mangaId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
}

export interface ReaderSettings {
  mode: ReaderMode;
  direction: "ltr" | "rtl";
  theme: ReaderTheme;
  fit: "width" | "height" | "original";
  gap: number;
  autoNextChapter: boolean;
  preload: "off" | "low" | "high";
  reduceMotion: boolean;
  autoScrollEnabled: boolean;
  autoScrollSpeed: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  mangaId: string | null;
  chapterId: string | null;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface ReportPayload {
  id: string;
  reporterUserId: string | null;
  type: "manga" | "chapter" | "page" | "general";
  targetId: string;
  reason: string;
  details: string;
  createdAt: string;
  status: "open" | "reviewed" | "resolved";
}
