import type {
  MangaComment,
  MangaRating,
  NotificationItem,
  NotificationSettings,
  ReportPayload,
  UserProfile,
} from "@/types/domain";

export const seedUsers: UserProfile[] = [
  {
    id: "user-1",
    email: "user@spotthea.app",
    password: "User12345!",
    username: "AsterReader",
    avatarUrl: "https://picsum.photos/seed/user-1/120/120",
    role: "user",
    createdAt: "2025-11-20T10:00:00.000Z",
    bio: "Action & fantasy fan. Baca chapter sambil ngopi.",
    preferredLocale: "id",
  },
  {
    id: "moderator-1",
    email: "mod@spotthea.app",
    password: "Mod12345!",
    username: "PanelKeeper",
    avatarUrl: "https://picsum.photos/seed/moderator-1/120/120",
    role: "moderator",
    createdAt: "2025-10-10T08:00:00.000Z",
    bio: "Menjaga komentar tetap sehat.",
    preferredLocale: "id",
  },
  {
    id: "admin-1",
    email: "admin@spotthea.app",
    password: "Admin12345!",
    username: "RootArchivist",
    avatarUrl: "https://picsum.photos/seed/admin-1/120/120",
    role: "admin",
    createdAt: "2025-08-01T06:00:00.000Z",
    bio: "Mengelola katalog dan quality control.",
    preferredLocale: "id",
  },
];

export const seedRatings: MangaRating[] = [
  {
    mangaId: "manga-neon-requiem",
    userId: "user-1",
    value: 5,
    updatedAt: "2026-02-01T03:00:00.000Z",
  },
  {
    mangaId: "manga-aether-blade-chronicle",
    userId: "user-1",
    value: 4,
    updatedAt: "2026-01-18T03:00:00.000Z",
  },
  {
    mangaId: "manga-iron-lotus-regiment",
    userId: "moderator-1",
    value: 5,
    updatedAt: "2026-01-10T03:00:00.000Z",
  },
];

export const seedComments: MangaComment[] = [
  {
    id: "comment-1",
    mangaId: "manga-neon-requiem",
    userId: "user-1",
    username: "AsterReader",
    avatarUrl: "https://picsum.photos/seed/user-1/120/120",
    content: "Chapter terbaru plot twist-nya masuk akal banget. Foreshadowing dari chapter 12 ternyata kepake.",
    createdAt: "2026-02-03T10:22:00.000Z",
    updatedAt: "2026-02-03T10:22:00.000Z",
    likes: 38,
  },
  {
    id: "comment-2",
    mangaId: "manga-aether-blade-chronicle",
    userId: "moderator-1",
    username: "PanelKeeper",
    avatarUrl: "https://picsum.photos/seed/moderator-1/120/120",
    content: "Panel action chapter 30 rapih. Saran: pace dialog agak diperlambat biar worldbuilding-nya kerasa.",
    createdAt: "2026-02-04T06:12:00.000Z",
    updatedAt: "2026-02-04T06:12:00.000Z",
    likes: 19,
  },
  {
    id: "comment-3",
    mangaId: "manga-thorn-pact-academy",
    userId: "admin-1",
    username: "RootArchivist",
    avatarUrl: "https://picsum.photos/seed/admin-1/120/120",
    content: "Arc semester kedua mulai kuat. Semoga fokus ke karakter pendukung tetap dijaga.",
    createdAt: "2026-01-31T14:05:00.000Z",
    updatedAt: "2026-01-31T14:05:00.000Z",
    likes: 27,
  },
];

export const seedNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    userId: "user-1",
    mangaId: "manga-neon-requiem",
    chapterId: "manga-neon-requiem-chapter-44",
    title: "Update Neon Requiem",
    body: "Chapter 44 sudah rilis. Lanjutkan baca sekarang.",
    isRead: false,
    createdAt: "2026-02-08T04:10:00.000Z",
  },
  {
    id: "notif-2",
    userId: "user-1",
    mangaId: "manga-thorn-pact-academy",
    chapterId: "manga-thorn-pact-academy-chapter-23",
    title: "Update Thorn Pact Academy",
    body: "Chapter 23 resmi dipublikasikan.",
    isRead: true,
    createdAt: "2026-02-06T09:15:00.000Z",
  },
];

export const seedNotificationSettings: NotificationSettings = {
  email: false,
  push: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

export const seedReports: ReportPayload[] = [
  {
    id: "report-1",
    reporterUserId: "user-1",
    type: "page",
    targetId: "aether-blade-chronicle-c32-p4",
    reason: "Gambar blur",
    details: "Halaman 4 chapter 32 blur permanen meskipun reload.",
    createdAt: "2026-02-07T12:02:00.000Z",
    status: "open",
  },
  {
    id: "report-2",
    reporterUserId: null,
    type: "general",
    targetId: "contact-form",
    reason: "Saran",
    details: "Mohon tambah opsi font lebih besar di reader mobile.",
    createdAt: "2026-02-04T11:14:00.000Z",
    status: "reviewed",
  },
];