"use client";

import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { fetchPublicPlatformSettings } from "@/lib/api/admin-api";
import { ApiClientError, apiRequest } from "@/lib/api/client";
import { DEFAULT_PLATFORM_SETTINGS, DEFAULT_READER_SETTINGS } from "@/lib/constants/site";
import { seedComments, seedNotificationSettings, seedNotifications, seedRatings, seedReports, seedUsers } from "@/lib/data/user-seed";
import type {
  AuthSession,
  Chapter,
  HistoryEntry,
  LibraryEntry,
  Manga,
  MangaComment,
  MangaRating,
  NotificationItem,
  NotificationSettings,
  PlatformSettings,
  ReaderSettings,
  ReportPayload,
  UserProfile,
  UserRole,
} from "@/types/domain";

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

interface ProfilePayload {
  username: string;
  bio: string;
  preferredLocale: "id" | "en";
}

interface ChapterDraft {
  id?: string;
  mangaId: string;
  mangaSlug: string;
  number: number;
  title: string;
  publishedAt?: string;
  pages: Chapter["pages"];
}

interface MangaDraft {
  id?: string;
  slug: string;
  title: string;
  altTitle: string;
  synopsis: string;
  status: Manga["status"];
  type: Manga["type"];
  contentRating: Manga["contentRating"];
  year: number;
  author: string;
  artist: string;
  serialization: string;
  genres: string[];
  coverUrl: string;
  bannerUrl: string;
}

interface AppState {
  hydrated: boolean;
  session: AuthSession | null;
  users: UserProfile[];
  libraryByUser: Record<string, LibraryEntry[]>;
  historyByUser: Record<string, HistoryEntry[]>;
  ratings: MangaRating[];
  comments: MangaComment[];
  notifications: NotificationItem[];
  notificationSettingsByUser: Record<string, NotificationSettings>;
  reports: ReportPayload[];
  readerSettings: ReaderSettings;
  maintenanceMode: boolean;
  platformSettings: PlatformSettings;
  customMangas: Manga[];
  customChapters: Chapter[];
  setHydrated: (value: boolean) => void;
  syncSessionCollections: () => Promise<void>;
  syncGuestAnnouncements: () => Promise<void>;
  syncPlatformSettings: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  register: (payload: RegisterPayload) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  updateProfile: (payload: ProfilePayload) => void;
  updatePassword: (currentPassword: string, nextPassword: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  setReaderSetting: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
  toggleLibrary: (mangaId: string, type: LibraryEntry["type"], manga?: Manga) => void;
  moveLibraryEntry: (mangaId: string, toType: LibraryEntry["type"]) => void;
  addOrUpdateHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  clearHistoryForManga: (mangaId: string) => void;
  rateManga: (mangaId: string, value: number) => Promise<{ ok: true } | { ok: false; error: string }>;
  addComment: (mangaId: string, content: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteComment: (commentId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  likeComment: (commentId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  updateNotificationSettings: (payload: Partial<NotificationSettings>) => void;
  createNotification: (payload: Omit<NotificationItem, "id" | "createdAt" | "isRead">) => void;
  createReport: (payload: Omit<ReportPayload, "id" | "createdAt" | "status">) => void;
  setMaintenanceMode: (value: boolean) => Promise<{ ok: true } | { ok: false; error: string }>;
  applyPlatformSettings: (settings: PlatformSettings) => void;
  upsertManga: (payload: MangaDraft) => Manga;
  deleteManga: (mangaId: string) => void;
  upsertChapter: (payload: ChapterDraft) => Chapter;
  deleteChapter: (chapterId: string) => void;
  reorderChapterPages: (chapterId: string, orderedPageIds: string[]) => void;
  resolveReport: (reportId: string, status: ReportPayload["status"]) => void;
  promoteUser: (userId: string, role: UserRole) => void;
}

function nowIso() {
  return new Date().toISOString();
}

function isNumericId(value: string) {
  return /^\d+$/.test(value);
}

const GUEST_LOCAL_USER_ID = "__guest_local__";

function resolveCollectionOwnerId(session: AuthSession | null) {
  return session?.userId ?? GUEST_LOCAL_USER_ID;
}

function normalizeAdItems(
  items: PlatformSettings["homeAdsTopItems"],
  maxItems: number,
): PlatformSettings["homeAdsTopItems"] {
  return items
    .map((item) => ({
      imageUrl: item.imageUrl.trim(),
      targetUrl: item.targetUrl.trim(),
      altText: item.altText.trim(),
    }))
    .filter((item) => item.imageUrl !== "" && item.targetUrl !== "")
    .slice(0, maxItems);
}

function normalizePlatformSettings(settings: PlatformSettings): PlatformSettings {
  return {
    maintenanceMode: Boolean(settings.maintenanceMode),
    siteName: settings.siteName.trim() || DEFAULT_PLATFORM_SETTINGS.siteName,
    siteTagline: settings.siteTagline.trim(),
    logoUrl: settings.logoUrl && settings.logoUrl.trim() !== "" ? settings.logoUrl.trim() : null,
    faviconUrl: settings.faviconUrl && settings.faviconUrl.trim() !== "" ? settings.faviconUrl.trim() : null,
    headerNoticeEnabled: Boolean(settings.headerNoticeEnabled),
    headerNoticeText: settings.headerNoticeText.trim(),
    footerDescription: settings.footerDescription.trim() || DEFAULT_PLATFORM_SETTINGS.footerDescription,
    footerCopyright: settings.footerCopyright.trim() || DEFAULT_PLATFORM_SETTINGS.footerCopyright,
    footerLinks:
      settings.footerLinks.length > 0
        ? settings.footerLinks
            .map((item) => ({
              label: item.label.trim(),
              href: item.href.trim(),
            }))
            .filter((item) => item.label !== "" && item.href !== "")
        : DEFAULT_PLATFORM_SETTINGS.footerLinks,
    homeAdsTopItems: normalizeAdItems(settings.homeAdsTopItems, 8),
    homeAdsBeforeLatestItems: normalizeAdItems(settings.homeAdsBeforeLatestItems, 4),
    homeAdsOverlayEnabled: Boolean(settings.homeAdsOverlayEnabled),
    homeAdsOverlayItems: normalizeAdItems(settings.homeAdsOverlayItems, 2),
  };
}

async function fetchSessionCollections(token: string) {
  const [library, history, ratings, comments, notificationFeed, notificationPreferences] = await Promise.all([
    apiRequest<LibraryEntry[]>("/me/library", {
      token,
    }),
    apiRequest<HistoryEntry[]>("/me/history", {
      token,
    }),
    apiRequest<MangaRating[]>("/me/ratings", {
      token,
    }),
    apiRequest<MangaComment[]>("/me/comments", {
      token,
    }),
    apiRequest<{ items: NotificationItem[]; unreadCount: number }>("/me/notifications", {
      token,
    }),
    apiRequest<NotificationSettings>("/me/notification-preferences", {
      token,
    }),
  ]);

  return {
    library,
    history,
    ratings,
    comments,
    notifications: notificationFeed.items.map((notification) => ({
      ...notification,
      mangaId: notification.mangaId ?? null,
      chapterId: notification.chapterId ?? null,
    })),
    notificationPreferences,
  };
}

async function fetchBroadcastAnnouncements(limit = 30) {
  const payload = await apiRequest<{
    items: Array<{
      id: string;
      title: string;
      body: string;
      mangaId: string | null;
      chapterId: string | null;
      publishedAt?: string | null;
      createdAt?: string | null;
    }>;
  }>(`/announcements?limit=${Math.max(1, Math.min(limit, 100))}`);

  return payload.items.map((item) => ({
    id: `announcement-${item.id}`,
    userId: GUEST_LOCAL_USER_ID,
    mangaId: item.mangaId ?? null,
    chapterId: item.chapterId ?? null,
    title: item.title,
    body: item.body,
    createdAt: item.publishedAt ?? item.createdAt ?? nowIso(),
  }));
}

interface ApiUserShape {
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: string;
  bio: string;
  preferredLocale: "id" | "en";
}

interface ApiAuthResponse {
  user: ApiUserShape;
  token: string;
}

function toUserProfile(user: ApiUserShape): UserProfile {
  return {
    id: user.id,
    email: user.email,
    password: "",
    username: user.username,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    bio: user.bio,
    preferredLocale: user.preferredLocale,
  };
}

function toSession(user: ApiUserShape, token: string): AuthSession {
  return {
    userId: user.id,
    role: user.role,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    token,
  };
}

const initialLibraryByUser: Record<string, LibraryEntry[]> = {
  [GUEST_LOCAL_USER_ID]: [],
  "user-1": [
    {
      mangaId: "manga-neon-requiem",
      type: "following",
      createdAt: "2025-12-11T11:00:00.000Z",
      updatedAt: "2026-02-01T12:00:00.000Z",
    },
    {
      mangaId: "manga-aether-blade-chronicle",
      type: "bookmark",
      createdAt: "2026-01-05T09:30:00.000Z",
      updatedAt: "2026-01-05T09:30:00.000Z",
    },
    {
      mangaId: "manga-thorn-pact-academy",
      type: "to-read",
      createdAt: "2026-01-17T08:00:00.000Z",
      updatedAt: "2026-01-17T08:00:00.000Z",
    },
    {
      mangaId: "manga-iron-lotus-regiment",
      type: "favorites",
      createdAt: "2025-12-22T08:00:00.000Z",
      updatedAt: "2026-01-28T08:00:00.000Z",
    },
  ],
};

const initialHistoryByUser: Record<string, HistoryEntry[]> = {
  [GUEST_LOCAL_USER_ID]: [],
  "user-1": [
    {
      mangaId: "manga-neon-requiem",
      chapterId: "manga-neon-requiem-chapter-44",
      pageIndex: 6,
      progressPct: 42,
      updatedAt: "2026-02-08T14:20:00.000Z",
    },
    {
      mangaId: "manga-aether-blade-chronicle",
      chapterId: "manga-aether-blade-chronicle-chapter-38",
      pageIndex: 11,
      progressPct: 88,
      updatedAt: "2026-02-06T12:16:00.000Z",
    },
    {
      mangaId: "manga-thorn-pact-academy",
      chapterId: "manga-thorn-pact-academy-chapter-23",
      pageIndex: 2,
      progressPct: 22,
      updatedAt: "2026-02-04T07:05:00.000Z",
    },
  ],
};

const defaultSession: AuthSession | null = null;

function withCurrentUser<T>(session: AuthSession | null, callback: (userId: string) => T): T | null {
  if (!session) {
    return null;
  }

  return callback(session.userId);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: defaultSession,
      users: seedUsers,
      libraryByUser: initialLibraryByUser,
      historyByUser: initialHistoryByUser,
      ratings: seedRatings,
      comments: seedComments,
      notifications: seedNotifications,
      notificationSettingsByUser: {
        "user-1": seedNotificationSettings,
        "moderator-1": seedNotificationSettings,
        "admin-1": seedNotificationSettings,
      },
      reports: seedReports,
      readerSettings: DEFAULT_READER_SETTINGS,
      maintenanceMode: false,
      platformSettings: DEFAULT_PLATFORM_SETTINGS,
      customMangas: [],
      customChapters: [],
      setHydrated: (value) => set({ hydrated: value }),
      syncSessionCollections: async () => {
        const activeSession = get().session;
        if (!activeSession) {
          return;
        }

        try {
          const currentUser = await apiRequest<ApiUserShape>("/me", {
            token: activeSession.token,
          });

          if (currentUser.id !== activeSession.userId) {
            set({ session: null });
            return;
          }

          const backendUser = toUserProfile(currentUser);

          set((state) => {
            if (state.session?.userId !== activeSession.userId || state.session.token !== activeSession.token) {
              return {};
            }

            return {
              users: [backendUser, ...state.users.filter((item) => item.id !== backendUser.id)],
              session: toSession(currentUser, activeSession.token),
              libraryByUser: {
                ...state.libraryByUser,
                [backendUser.id]: state.libraryByUser[backendUser.id] ?? [],
              },
              historyByUser: {
                ...state.historyByUser,
                [backendUser.id]: state.historyByUser[backendUser.id] ?? [],
              },
              notificationSettingsByUser: {
                ...state.notificationSettingsByUser,
                [backendUser.id]: state.notificationSettingsByUser[backendUser.id] ?? seedNotificationSettings,
              },
            };
          });
        } catch (error) {
          if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
            set({ session: null });
          }

          return;
        }

        try {
          const { library, history, ratings, comments, notifications, notificationPreferences } = await fetchSessionCollections(activeSession.token);

          set((state) => {
            if (state.session?.userId !== activeSession.userId || state.session.token !== activeSession.token) {
              return {};
            }

            const notificationsForOthers = state.notifications.filter((item) => item.userId !== activeSession.userId);
            const syncedNotifications = [...notifications, ...notificationsForOthers].sort(
              (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt),
            );

            return {
              libraryByUser: {
                ...state.libraryByUser,
                [activeSession.userId]: library,
              },
              historyByUser: {
                ...state.historyByUser,
                [activeSession.userId]: history,
              },
              ratings: [...ratings, ...state.ratings.filter((item) => item.userId !== activeSession.userId)],
              comments: [...comments, ...state.comments.filter((item) => item.userId !== activeSession.userId)],
              notifications: syncedNotifications,
              notificationSettingsByUser: {
                ...state.notificationSettingsByUser,
                [activeSession.userId]: {
                  ...seedNotificationSettings,
                  ...notificationPreferences,
                },
              },
            };
          });
        } catch (error) {
          if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
            set({ session: null });
            return;
          }

          // Keep optimistic local state if sync request fails.
        }
      },
      syncGuestAnnouncements: async () => {
        const activeSession = get().session;
        if (activeSession) {
          return;
        }

        try {
          const incomingAnnouncements = await fetchBroadcastAnnouncements();

          set((state) => {
            const currentGuestNotifications = state.notifications.filter((item) => item.userId === GUEST_LOCAL_USER_ID);
            const existingReadMap = new Map(currentGuestNotifications.map((item) => [item.id, item.isRead]));
            const mergedGuestAnnouncements = incomingAnnouncements.map((item) => ({
              ...item,
              isRead: existingReadMap.get(item.id) ?? false,
            }));

            const nonAnnouncementGuestNotifications = currentGuestNotifications.filter((item) => !item.id.startsWith("announcement-"));
            const nonGuestNotifications = state.notifications.filter((item) => item.userId !== GUEST_LOCAL_USER_ID);

            return {
              notifications: [...mergedGuestAnnouncements, ...nonAnnouncementGuestNotifications, ...nonGuestNotifications].sort(
                (left, right) => +new Date(right.createdAt) - +new Date(left.createdAt),
              ),
            };
          });
        } catch {
          // Keep existing guest notification cache when sync fails.
        }
      },
      syncPlatformSettings: async () => {
        try {
          const incoming = await fetchPublicPlatformSettings();
          const nextSettings = normalizePlatformSettings(incoming);

          set({
            platformSettings: nextSettings,
            maintenanceMode: nextSettings.maintenanceMode,
          });
        } catch {
          // Keep local platform settings when sync fails.
        }
      },
      login: async (email, password) => {
        try {
          const response = await apiRequest<ApiAuthResponse>("/auth/login", {
            method: "POST",
            body: {
              email: email.trim().toLowerCase(),
              password,
              device_name: "spotthea-web",
            },
          });

          const backendUser = toUserProfile(response.user);

          set((state) => ({
            users: [backendUser, ...state.users.filter((item) => item.id !== backendUser.id)],
            session: toSession(response.user, response.token),
            libraryByUser: {
              ...state.libraryByUser,
              [backendUser.id]: state.libraryByUser[backendUser.id] ?? [],
            },
            historyByUser: {
              ...state.historyByUser,
              [backendUser.id]: state.historyByUser[backendUser.id] ?? [],
            },
            notificationSettingsByUser: {
              ...state.notificationSettingsByUser,
              [backendUser.id]: state.notificationSettingsByUser[backendUser.id] ?? seedNotificationSettings,
            },
          }));

          await get().syncSessionCollections();

          return { ok: true };
        } catch (error) {
          if (error instanceof ApiClientError) {
            return { ok: false, error: error.message };
          }

          return { ok: false, error: "Gagal login. Coba lagi." };
        }
      },
      register: async (payload) => {
        try {
          const response = await apiRequest<ApiAuthResponse>("/auth/register", {
            method: "POST",
            body: {
              username: payload.username.trim(),
              email: payload.email.trim().toLowerCase(),
              password: payload.password,
              preferred_locale: "id",
            },
          });

          const backendUser = toUserProfile(response.user);

          set((state) => ({
            users: [backendUser, ...state.users.filter((item) => item.id !== backendUser.id)],
            session: toSession(response.user, response.token),
            libraryByUser: {
              ...state.libraryByUser,
              [backendUser.id]: state.libraryByUser[backendUser.id] ?? [],
            },
            historyByUser: {
              ...state.historyByUser,
              [backendUser.id]: state.historyByUser[backendUser.id] ?? [],
            },
            notificationSettingsByUser: {
              ...state.notificationSettingsByUser,
              [backendUser.id]: state.notificationSettingsByUser[backendUser.id] ?? seedNotificationSettings,
            },
          }));

          await get().syncSessionCollections();

          return { ok: true };
        } catch (error) {
          if (error instanceof ApiClientError) {
            return { ok: false, error: error.message };
          }

          return { ok: false, error: "Gagal registrasi. Coba lagi." };
        }
      },
      logout: () => {
        const token = get().session?.token;
        if (token) {
          void apiRequest("/auth/logout", {
            method: "POST",
            token,
          }).catch(() => null);
        }

        set({ session: null });
      },
      updateProfile: (payload) => {
        const { session, users } = get();
        const result = withCurrentUser(session, (userId) => {
          const nextUsers = users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  username: payload.username,
                  bio: payload.bio,
                  preferredLocale: payload.preferredLocale,
                }
              : user,
          );

          const currentUser = nextUsers.find((user) => user.id === userId);

          set({
            users: nextUsers,
            session: currentUser
              ? {
                  userId: currentUser.id,
                  role: currentUser.role,
                  username: currentUser.username,
                  email: currentUser.email,
                  avatarUrl: currentUser.avatarUrl,
                  token: session!.token,
                }
              : session,
          });
        });

        if (result === null) {
          return;
        }

        if (session) {
          void apiRequest("/me/profile", {
            method: "PUT",
            token: session.token,
            body: {
              username: payload.username,
              bio: payload.bio,
              preferred_locale: payload.preferredLocale,
            },
          }).catch(() => null);
        }
      },
      updatePassword: async (currentPassword, nextPassword) => {
        const { session } = get();

        if (!session) {
          return { ok: false, error: "Login dibutuhkan." };
        }

        try {
          await apiRequest("/me/password", {
            method: "PUT",
            token: session.token,
            body: {
              current_password: currentPassword,
              password: nextPassword,
            },
          });

          return { ok: true };
        } catch (error) {
          if (error instanceof ApiClientError) {
            return { ok: false, error: error.message };
          }

          return { ok: false, error: "Gagal mengubah password." };
        }
      },
      setReaderSetting: (key, value) => {
        set((state) => ({
          readerSettings: {
            ...state.readerSettings,
            [key]: value,
          },
        }));
      },
      toggleLibrary: (mangaId, type, manga) => {
        const { session } = get();
        const ownerId = resolveCollectionOwnerId(session);
        const currentEntries = get().libraryByUser[ownerId] ?? [];
        const shouldActivate = !currentEntries.some((entry) => entry.mangaId === mangaId && entry.type === type);

        set((state) => {
          const current = state.libraryByUser[ownerId] ?? [];
          const existingIndex = current.findIndex((entry) => entry.mangaId === mangaId && entry.type === type);
          const now = nowIso();

          if (existingIndex >= 0) {
            const next = current.filter((entry, index) => index !== existingIndex);
            return {
              libraryByUser: {
                ...state.libraryByUser,
                [ownerId]: next,
              },
            };
          }

          return {
            libraryByUser: {
              ...state.libraryByUser,
              [ownerId]: [
                {
                  mangaId,
                  type,
                  createdAt: now,
                  updatedAt: now,
                  manga,
                },
                ...current,
              ],
            },
          };
        });

        if (session && isNumericId(mangaId)) {
          void apiRequest("/me/library", {
            method: "PUT",
            token: session.token,
            body: {
              manga_id: Number(mangaId),
              type,
              active: shouldActivate,
            },
          })
            .then(() => get().syncSessionCollections())
            .catch(() => null);
        }
      },
      moveLibraryEntry: (mangaId, toType) => {
        const { session } = get();
        const ownerId = resolveCollectionOwnerId(session);
        set((state) => {
          const current = state.libraryByUser[ownerId] ?? [];
          const now = nowIso();
          const existingEntry = current.find((entry) => entry.mangaId === mangaId);
          const withoutManga = current.filter((entry) => entry.mangaId !== mangaId);

          return {
            libraryByUser: {
              ...state.libraryByUser,
              [ownerId]: [
                {
                  mangaId,
                  type: toType,
                  createdAt: now,
                  updatedAt: now,
                  manga: existingEntry?.manga,
                },
                ...withoutManga,
              ],
            },
          };
        });

        if (session && isNumericId(mangaId)) {
          void apiRequest("/me/library/move", {
            method: "PATCH",
            token: session.token,
            body: {
              manga_id: Number(mangaId),
              to_type: toType,
            },
          })
            .then(() => get().syncSessionCollections())
            .catch(() => null);
        }
      },
      addOrUpdateHistory: (entry) => {
        const { session } = get();
        const ownerId = resolveCollectionOwnerId(session);

        set((state) => {
          const current = state.historyByUser[ownerId] ?? [];
          const withoutTarget = current.filter((item) => item.chapterId !== entry.chapterId);
          const nextEntry = {
            ...entry,
            updatedAt: nowIso(),
          };

          return {
            historyByUser: {
              ...state.historyByUser,
              [ownerId]: [nextEntry, ...withoutTarget].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
            },
          };
        });

        if (session && isNumericId(entry.mangaId) && isNumericId(entry.chapterId)) {
          void apiRequest("/me/history", {
            method: "PUT",
            token: session.token,
            body: {
              manga_id: Number(entry.mangaId),
              chapter_id: Number(entry.chapterId),
              page_index: entry.pageIndex,
              progress_pct: entry.progressPct,
            },
          }).catch(() => null);
        }
      },
      clearHistory: () => {
        const { session } = get();
        const ownerId = resolveCollectionOwnerId(session);

        set((state) => ({
          historyByUser: {
            ...state.historyByUser,
            [ownerId]: [],
          },
        }));

        if (session) {
          void apiRequest("/me/history", {
            method: "DELETE",
            token: session.token,
          }).catch(() => null);
        }
      },
      clearHistoryForManga: (mangaId) => {
        const { session } = get();
        const ownerId = resolveCollectionOwnerId(session);

        set((state) => ({
          historyByUser: {
            ...state.historyByUser,
            [ownerId]: (state.historyByUser[ownerId] ?? []).filter((entry) => entry.mangaId !== mangaId),
          },
        }));

        if (session && isNumericId(mangaId)) {
          void apiRequest(`/me/history/manga/${mangaId}`, {
            method: "DELETE",
            token: session.token,
          }).catch(() => null);
        }
      },
      rateManga: async (mangaId, value) => {
        const { session } = get();
        const userId = resolveCollectionOwnerId(session);
        const previousRatings = get().ratings;

        set((state) => {
          const next = state.ratings.filter((rating) => !(rating.mangaId === mangaId && rating.userId === userId));
          next.unshift({
            mangaId,
            userId,
            value,
            updatedAt: nowIso(),
          });
          return { ratings: next };
        });

        if (session && isNumericId(mangaId)) {
          try {
            await apiRequest(`/manga/${mangaId}/rating`, {
              method: "PUT",
              token: session.token,
              body: {
                value,
              },
            });
          } catch (error) {
            set({ ratings: previousRatings });

            if (error instanceof ApiClientError) {
              return { ok: false, error: error.message };
            }

            return { ok: false, error: "Gagal menyimpan rating." };
          }
        }

        return { ok: true };
      },
      addComment: async (mangaId, content) => {
        const { session } = get();

        if (!session) {
          return { ok: false, error: "Login untuk mengirim komentar." };
        }

        if (content.trim().length < 3) {
          return { ok: false, error: "Komentar minimal 3 karakter." };
        }

        if (isNumericId(mangaId)) {
          try {
            const backendComment = await apiRequest<MangaComment>(`/manga/${mangaId}/comments`, {
              method: "POST",
              token: session.token,
              body: {
                content: content.trim(),
              },
            });

            set((state) => ({
              comments: [backendComment, ...state.comments.filter((item) => item.id !== backendComment.id)],
            }));

            return { ok: true };
          } catch (error) {
            if (error instanceof ApiClientError) {
              return { ok: false, error: error.message };
            }

            return { ok: false, error: "Gagal mengirim komentar." };
          }
        }

        set((state) => ({
          comments: [
            {
              id: `comment-${crypto.randomUUID()}`,
              mangaId,
              userId: session.userId,
              username: session.username,
              avatarUrl: session.avatarUrl,
              content: content.trim(),
              createdAt: nowIso(),
              updatedAt: nowIso(),
              likes: 0,
            },
            ...state.comments,
          ],
        }));

        return { ok: true };
      },
      deleteComment: async (commentId) => {
        const { session } = get();
        if (!session) {
          return { ok: false, error: "Login untuk menghapus komentar." };
        }

        const previousComments = get().comments;

        set((state) => ({
          comments: state.comments.filter(
            (comment) => !(comment.id === commentId && (comment.userId === session.userId || session.role === "admin" || session.role === "moderator")),
          ),
        }));

        if (isNumericId(commentId)) {
          try {
            await apiRequest(`/comments/${commentId}`, {
              method: "DELETE",
              token: session.token,
            });
          } catch (error) {
            set({ comments: previousComments });

            if (error instanceof ApiClientError) {
              return { ok: false, error: error.message };
            }

            return { ok: false, error: "Gagal menghapus komentar." };
          }
        }

        return { ok: true };
      },
      likeComment: async (commentId) => {
        const session = get().session;
        if (!session) {
          return { ok: false, error: "Login untuk memberi like komentar." };
        }

        if (isNumericId(commentId)) {
          try {
            const response = await apiRequest<{ liked: boolean; comment: MangaComment }>(`/comments/${commentId}/like`, {
              method: "POST",
              token: session.token,
            });

            set((state) => ({
              comments: state.comments.map((comment) => (comment.id === commentId ? response.comment : comment)),
            }));

            return { ok: true };
          } catch (error) {
            if (error instanceof ApiClientError) {
              return { ok: false, error: error.message };
            }

            return { ok: false, error: "Gagal memberi like komentar." };
          }
        }

        set((state) => ({
          comments: state.comments.map((comment) => (comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment)),
        }));

        return { ok: true };
      },
      markNotificationRead: (notificationId) => {
        const { session } = get();
        const ownerId = session?.userId ?? GUEST_LOCAL_USER_ID;

        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId && notification.userId === ownerId
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification,
          ),
        }));

        if (session && isNumericId(notificationId)) {
          void apiRequest(`/me/notifications/${notificationId}/read`, {
            method: "PATCH",
            token: session.token,
          }).catch(() => null);
        }
      },
      markAllNotificationsRead: () => {
        const { session } = get();
        const ownerId = session?.userId ?? GUEST_LOCAL_USER_ID;

        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.userId === ownerId
              ? {
                  ...notification,
                  isRead: true,
                }
              : notification,
          ),
        }));

        if (session) {
          void apiRequest("/me/notifications/read-all", {
            method: "PATCH",
            token: session.token,
          }).catch(() => null);
        }
      },
      updateNotificationSettings: (payload) => {
        const { session } = get();
        if (!session) {
          return;
        }

        set((state) => ({
          notificationSettingsByUser: {
            ...state.notificationSettingsByUser,
            [session.userId]: {
              ...state.notificationSettingsByUser[session.userId],
              ...payload,
            },
          },
        }));

        void apiRequest("/me/notification-preferences", {
          method: "PUT",
          token: session.token,
          body: {
            email: payload.email,
            push: payload.push,
            quiet_hours_start: payload.quietHoursStart,
            quiet_hours_end: payload.quietHoursEnd,
          },
        }).catch(() => null);
      },
      createNotification: (payload) => {
        set((state) => ({
          notifications: [
            {
              ...payload,
              id: `notif-${crypto.randomUUID()}`,
              createdAt: nowIso(),
              isRead: false,
            },
            ...state.notifications,
          ],
        }));
      },
      createReport: (payload) => {
        set((state) => ({
          reports: [
            {
              ...payload,
              id: `report-${crypto.randomUUID()}`,
              createdAt: nowIso(),
              status: "open",
            },
            ...state.reports,
          ],
        }));

        const session = get().session;
        void apiRequest("/reports", {
          method: "POST",
          token: session?.token,
          body: {
            type: payload.type,
            target_id: payload.targetId,
            reason: payload.reason,
            details: payload.details,
          },
        }).catch(() => null);
      },
      setMaintenanceMode: async (value) => {
        const session = get().session;

        if (!session || session.role !== "admin") {
          return { ok: false, error: "Hanya admin yang boleh mengubah maintenance mode." };
        }

        try {
          await apiRequest("/admin/settings", {
            method: "PUT",
            token: session.token,
            body: {
              settings: [
                {
                  key: "maintenance_mode",
                  type: "boolean",
                  value,
                },
              ],
            },
          });

          const latestSettings = await fetchPublicPlatformSettings();
          const normalized = normalizePlatformSettings(latestSettings);
          set({
            platformSettings: normalized,
            maintenanceMode: normalized.maintenanceMode,
          });

          return { ok: true };
        } catch (error) {
          if (error instanceof ApiClientError) {
            return { ok: false, error: error.message };
          }

          return { ok: false, error: "Gagal memperbarui maintenance mode." };
        }
      },
      applyPlatformSettings: (settings) => {
        const normalized = normalizePlatformSettings(settings);
        set({
          platformSettings: normalized,
          maintenanceMode: normalized.maintenanceMode,
        });
      },
      upsertManga: (payload) => {
        const now = nowIso();
        const mangaId = payload.id && payload.id.length > 0 ? payload.id : `manga-${payload.slug}`;

        const nextManga: Manga = {
          id: mangaId,
          slug: payload.slug,
          title: payload.title,
          altTitle: payload.altTitle,
          synopsis: payload.synopsis,
          status: payload.status,
          type: payload.type,
          contentRating: payload.contentRating,
          year: payload.year,
          author: payload.author,
          artist: payload.artist,
          serialization: payload.serialization,
          genres: payload.genres,
          coverUrl: payload.coverUrl,
          bannerUrl: payload.bannerUrl,
          chapterCount:
            get().customChapters.filter((chapter) => chapter.mangaId === mangaId).length ||
            get().customMangas.find((manga) => manga.id === mangaId)?.chapterCount ||
            0,
          baseRating: get().customMangas.find((manga) => manga.id === mangaId)?.baseRating ?? 0,
          baseRatingCount: get().customMangas.find((manga) => manga.id === mangaId)?.baseRatingCount ?? 0,
          views: get().customMangas.find((manga) => manga.id === mangaId)?.views ?? 0,
          followers: get().customMangas.find((manga) => manga.id === mangaId)?.followers ?? 0,
          updatedAt: now,
          featuredRank: get().customMangas.find((manga) => manga.id === mangaId)?.featuredRank ?? null,
          popularRank: get().customMangas.find((manga) => manga.id === mangaId)?.popularRank ?? 999,
        };

        set((state) => ({
          customMangas: [nextManga, ...state.customMangas.filter((manga) => manga.id !== mangaId)],
        }));

        return nextManga;
      },
      deleteManga: (mangaId) => {
        set((state) => ({
          customMangas: state.customMangas.filter((manga) => manga.id !== mangaId),
          customChapters: state.customChapters.filter((chapter) => chapter.mangaId !== mangaId),
        }));
      },
      upsertChapter: (payload) => {
        const chapterId = payload.id && payload.id.length > 0 ? payload.id : `${payload.mangaId}-chapter-${payload.number}`;

        const nextChapter: Chapter = {
          id: chapterId,
          mangaId: payload.mangaId,
          mangaSlug: payload.mangaSlug,
          number: payload.number,
          title: payload.title,
          publishedAt: payload.publishedAt ?? nowIso(),
          pages: payload.pages,
        };

        set((state) => {
          const customChapters = [nextChapter, ...state.customChapters.filter((chapter) => chapter.id !== chapterId)];
          const customMangas = state.customMangas.map((manga) =>
            manga.id === payload.mangaId
              ? {
                  ...manga,
                  chapterCount: customChapters.filter((chapter) => chapter.mangaId === payload.mangaId).length,
                  updatedAt: nowIso(),
                }
              : manga,
          );

          return {
            customChapters,
            customMangas,
          };
        });

        return nextChapter;
      },
      deleteChapter: (chapterId) => {
        set((state) => {
          const chapter = state.customChapters.find((item) => item.id === chapterId);
          const customChapters = state.customChapters.filter((item) => item.id !== chapterId);

          return {
            customChapters,
            customMangas: chapter
              ? state.customMangas.map((manga) =>
                  manga.id === chapter.mangaId
                    ? {
                        ...manga,
                        chapterCount: customChapters.filter((item) => item.mangaId === chapter.mangaId).length,
                        updatedAt: nowIso(),
                      }
                    : manga,
                )
              : state.customMangas,
          };
        });
      },
      reorderChapterPages: (chapterId, orderedPageIds) => {
        set((state) => ({
          customChapters: state.customChapters.map((chapter) => {
            if (chapter.id !== chapterId) {
              return chapter;
            }

            const lookup = new Map(chapter.pages.map((page) => [page.id, page]));
            const nextPages = orderedPageIds
              .map((pageId, index) => {
                const page = lookup.get(pageId);
                if (!page) {
                  return null;
                }
                return {
                  ...page,
                  index,
                };
              })
              .filter((page): page is Chapter["pages"][number] => page !== null);

            return {
              ...chapter,
              pages: nextPages,
            };
          }),
        }));
      },
      resolveReport: (reportId, status) => {
        set((state) => ({
          reports: state.reports.map((report) => (report.id === reportId ? { ...report, status } : report)),
        }));
      },
      promoteUser: (userId, role) => {
        set((state) => ({
          users: state.users.map((user) => (user.id === userId ? { ...user, role } : user)),
          session:
            state.session?.userId === userId
              ? {
                  ...state.session,
                  role,
                }
              : state.session,
        }));
      },
    }),
    {
      name: "spotthea-app-store",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const incoming = persistedState as Partial<AppState>;
        const incomingPlatform = incoming.platformSettings;

        const mergedPlatformSettings = normalizePlatformSettings({
          ...currentState.platformSettings,
          ...(incomingPlatform ?? {}),
          footerLinks: Array.isArray(incomingPlatform?.footerLinks)
            ? incomingPlatform.footerLinks
            : currentState.platformSettings.footerLinks,
          maintenanceMode:
            typeof incoming.maintenanceMode === "boolean"
              ? incoming.maintenanceMode
              : (incomingPlatform?.maintenanceMode ?? currentState.platformSettings.maintenanceMode),
          homeAdsTopItems: currentState.platformSettings.homeAdsTopItems,
          homeAdsBeforeLatestItems: currentState.platformSettings.homeAdsBeforeLatestItems,
          homeAdsOverlayEnabled: currentState.platformSettings.homeAdsOverlayEnabled,
          homeAdsOverlayItems: currentState.platformSettings.homeAdsOverlayItems,
        });

        return {
          ...currentState,
          ...incoming,
          readerSettings: {
            ...currentState.readerSettings,
            ...(incoming.readerSettings ?? {}),
          },
          platformSettings: mergedPlatformSettings,
          maintenanceMode: mergedPlatformSettings.maintenanceMode,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        session: state.session,
        users: state.users,
        libraryByUser: state.libraryByUser,
        historyByUser: state.historyByUser,
        ratings: state.ratings,
        comments: state.comments,
        notifications: state.notifications,
        notificationSettingsByUser: state.notificationSettingsByUser,
        reports: state.reports,
        readerSettings: state.readerSettings,
        maintenanceMode: state.maintenanceMode,
        platformSettings: state.platformSettings,
        customMangas: state.customMangas,
        customChapters: state.customChapters,
      }),
    },
  ),
);

const EMPTY_LIBRARY: LibraryEntry[] = [];
const EMPTY_HISTORY: HistoryEntry[] = [];

export function useCurrentUser() {
  return useAppStore((state) => {
    const userId = state.session?.userId;
    if (!userId) {
      return null;
    }

    return state.users.find((user) => user.id === userId) ?? null;
  });
}

export function useUserLibrary() {
  return useAppStore((state) => {
    const userId = state.session?.userId ?? GUEST_LOCAL_USER_ID;
    return state.libraryByUser[userId] ?? EMPTY_LIBRARY;
  });
}

export function useUserHistory() {
  return useAppStore((state) => {
    const userId = state.session?.userId ?? GUEST_LOCAL_USER_ID;
    return state.historyByUser[userId] ?? EMPTY_HISTORY;
  });
}

export function useUserNotifications() {
  const userId = useAppStore((state) => state.session?.userId ?? GUEST_LOCAL_USER_ID);
  const notifications = useAppStore((state) => state.notifications);

  return useMemo(
    () => notifications.filter((notification) => notification.userId === userId),
    [notifications, userId],
  );
}

export function useUserNotificationSettings() {
  return useAppStore((state) => {
    const userId = state.session?.userId;
    return userId ? state.notificationSettingsByUser[userId] : seedNotificationSettings;
  });
}

export function useMangaComments(mangaId: string): MangaComment[] {
  const comments = useAppStore((state) => state.comments);

  return useMemo(
    () =>
      comments
        .filter((comment) => comment.mangaId === mangaId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [comments, mangaId],
  );
}

export function useMangaRatingSummary(mangaId: string, baseRating: number, baseRatingCount: number) {
  const ratings = useAppStore((state) => state.ratings);
  const sessionUserId = useAppStore((state) => state.session?.userId);

  return useMemo(() => {
    const mangaRatings = ratings.filter((rating) => rating.mangaId === mangaId);
    const totalVotes = baseRatingCount + mangaRatings.length;
    const localTotal = mangaRatings.reduce((acc, item) => acc + item.value, 0);
    const weighted = totalVotes > 0 ? (baseRating * baseRatingCount + localTotal) / totalVotes : 0;

    return {
      rating: Number(weighted.toFixed(2)),
      count: totalVotes,
      userRating: sessionUserId ? mangaRatings.find((item) => item.userId === sessionUserId)?.value ?? null : null,
    };
  }, [baseRating, baseRatingCount, mangaId, ratings, sessionUserId]);
}
