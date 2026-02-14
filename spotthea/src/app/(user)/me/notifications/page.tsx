"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppStore, useUserNotificationSettings, useUserNotifications } from "@/stores/app-store";
import { formatRelativeDate } from "@/lib/utils/format";
import { resolveMangaById } from "@/lib/utils/resolve-catalog";

const PAGE_SIZE = 4;

export default function NotificationsPage() {
  const notifications = useUserNotifications();
  const settings = useUserNotificationSettings();
  const markNotificationRead = useAppStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useAppStore((state) => state.markAllNotificationsRead);
  const updateNotificationSettings = useAppStore((state) => state.updateNotificationSettings);
  const [page, setPage] = useState(1);

  const sortedNotifications = useMemo(
    () => [...notifications].sort((left, right) => +new Date(right.createdAt) - +new Date(left.createdAt)),
    [notifications],
  );

  const totalPages = Math.max(1, Math.ceil(sortedNotifications.length / PAGE_SIZE));
  const currentPage = Math.max(1, Math.min(page, totalPages));

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedNotifications.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedNotifications]);

  const pageSummary = useMemo(() => {
    if (sortedNotifications.length === 0) {
      return "0 notifikasi";
    }

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(sortedNotifications.length, start + paginatedNotifications.length - 1);
    return `${start}-${end} dari ${sortedNotifications.length}`;
  }, [currentPage, paginatedNotifications.length, sortedNotifications.length]);

  const goToPage = (nextPage: number) => {
    setPage(Math.max(1, Math.min(nextPage, totalPages)));
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Notifications</h1>
        <p className="text-sm text-[var(--text-secondary)]">Update chapter baru dari manga yang kamu follow.</p>
      </header>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notification Feed</h2>
          <Button variant="secondary" size="sm" onClick={markAllNotificationsRead}>
            Mark all as read
          </Button>
        </div>

        <p className="mt-3 text-xs text-[var(--text-muted)]">{pageSummary}</p>

        <div className="mt-4 space-y-3">
          {paginatedNotifications.length === 0 ? (
            <EmptyState title="Belum ada notifikasi" description="Follow beberapa manga dulu agar update chapter otomatis masuk." ctaHref="/browse" ctaLabel="Cari manga" />
          ) : (
            paginatedNotifications.map((notification) => {
              const manga = notification.mangaId ? resolveMangaById(notification.mangaId) : null;
              return (
                <article
                  key={notification.id}
                  className={`rounded-xl border p-3 ${notification.isRead ? "border-[var(--border)] bg-[var(--surface)]" : "border-[var(--accent)]/45 bg-[var(--accent)]/8"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{notification.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatRelativeDate(notification.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{notification.body}</p>
                  <div className="mt-3 flex items-center gap-2">
                    {manga && notification.chapterId ? (
                      <Link href={`/read/${manga.slug}/${notification.chapterId}`} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface-soft)]">
                        Baca sekarang
                      </Link>
                    ) : manga ? (
                      <Link href={`/manga/${manga.slug}`} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs hover:bg-[var(--surface-soft)]">
                        Buka manga
                      </Link>
                    ) : null}
                    {!notification.isRead ? (
                      <Button variant="ghost" size="sm" onClick={() => markNotificationRead(notification.id)}>
                        Mark read
                      </Button>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {sortedNotifications.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3">
            <Button variant="secondary" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)} className="h-11 rounded-2xl px-5">
              <ChevronLeft size={16} />
              Prev
            </Button>
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              Page {currentPage} / {totalPages}
            </p>
            <Button variant="secondary" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)} className="h-11 rounded-2xl px-5">
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notification Preferences</h2>

        <div className="space-y-2">
          <Switch checked={settings.email} onChange={(next) => updateNotificationSettings({ email: next })} label="Email notifications" />
          <Switch checked={settings.push} onChange={(next) => updateNotificationSettings({ push: next })} label="Web push notifications" />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <Input type="time" value={settings.quietHoursStart} onChange={(event) => updateNotificationSettings({ quietHoursStart: event.target.value })} />
          <Input type="time" value={settings.quietHoursEnd} onChange={(event) => updateNotificationSettings({ quietHoursEnd: event.target.value })} />
        </div>

        <p className="text-xs text-[var(--text-muted)]">Quiet hours aktif: {settings.quietHoursStart} - {settings.quietHoursEnd}</p>
      </section>
    </section>
  );
}
