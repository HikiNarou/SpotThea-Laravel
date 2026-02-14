"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { GlobalSearch } from "@/components/layout/global-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useAppStore, useUserNotifications } from "@/stores/app-store";

const links = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/genre", label: "Genres" },
  { href: "/updates", label: "Latest" },
];

function resolveBrandInitial(siteName: string) {
  const compact = siteName.replace(/\s+/g, "").toUpperCase();
  if (compact.length >= 2) {
    return compact.slice(0, 2);
  }

  if (compact.length === 1) {
    return `${compact}*`;
  }

  return "SP";
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const session = useAppStore((state) => state.session);
  const platformSettings = useAppStore((state) => state.platformSettings);
  const logout = useAppStore((state) => state.logout);
  const markNotificationRead = useAppStore((state) => state.markNotificationRead);
  const notifications = useUserNotifications();
  const accountHref = session?.role === "admin" || session?.role === "moderator" ? "/admin" : "/me";
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const unread = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const latestGuestAnnouncement = useMemo(
    () => (!session ? notifications.find((item) => !item.isRead) ?? null : null),
    [notifications, session],
  );
  const siteName = platformSettings.siteName.trim() || "Spotthea";
  const siteTagline = platformSettings.siteTagline.trim() || "Manga Reader";
  const logoUrl = platformSettings.logoUrl?.trim() || null;
  const headerNoticeText = platformSettings.headerNoticeText.trim();

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!profileMenuRef.current?.contains(target)) {
        setProfileMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-3 md:gap-4 md:px-6">
        <Link href="/" className="inline-flex min-w-0 items-center gap-2">
          {logoUrl ? (
            <span className="grid h-9 w-9 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              <Image src={logoUrl} alt={siteName} width={36} height={36} className="h-full w-full object-cover" sizes="36px" />
            </span>
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
              {resolveBrandInitial(siteName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base leading-none text-[var(--text-primary)] sm:text-lg">{siteName}</p>
            <p className="hidden truncate text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)] sm:block">{siteTagline}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 lg:block">
          <GlobalSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {session ? (
            <>
              <Link href="/me/notifications" className="relative hidden rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--surface-soft)] sm:block" aria-label="Notifikasi">
                <Bell size={16} />
                {unread > 0 ? <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] text-white">{unread}</span> : null}
              </Link>
              <div className="relative hidden sm:block" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-label="Buka menu profil"
                >
                  <Image src={session.avatarUrl} alt={session.username} width={26} height={26} className="rounded-full" sizes="26px" />
                  <span className="hidden text-sm text-[var(--text-primary)] md:inline">{session.username}</span>
                </button>

                {profileMenuOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg" role="menu" aria-label="Menu profil">
                    <Link
                      href={accountHref}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-soft)]"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      {session.role === "admin" || session.role === "moderator" ? "Admin Dashboard" : "Dashboard"}
                    </Link>
                    <Link href="/me/settings" className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-soft)]" onClick={() => setProfileMenuOpen(false)}>
                      Pengaturan
                    </Link>
                    <Link href="/me/library" className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-soft)]" onClick={() => setProfileMenuOpen(false)}>
                      Library
                    </Link>
                    <Link href="/me/history" className="block rounded-lg px-3 py-2 text-sm hover:bg-[var(--surface-soft)]" onClick={() => setProfileMenuOpen(false)}>
                      History
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-red-500/10"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border)] lg:hidden"
            onClick={() => {
              setProfileMenuOpen(false);
              setMenuOpen((prev) => !prev);
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div className={cn("border-t border-[var(--border)] px-4 pb-4 pt-3 lg:hidden", menuOpen ? "block" : "hidden")}>
        <GlobalSearch />
        <nav className="mt-3 grid grid-cols-2 gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-center text-sm" onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 sm:hidden">
          <span className="text-sm text-[var(--text-secondary)]">Theme</span>
          <ThemeToggle />
        </div>
        {session ? (
          <div className="mt-3 grid grid-cols-1 gap-2">
            <Link href="/me/notifications" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Notifikasi
                {unread > 0 ? <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] text-white">{unread}</span> : null}
              </Button>
            </Link>
            <Link href="/me/settings" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Pengaturan
              </Button>
            </Link>
            <Link href={accountHref} onClick={() => setMenuOpen(false)}>
              <Button variant="secondary" className="w-full">
                {session.role === "admin" || session.role === "moderator" ? "Admin Dashboard" : "My Dashboard"}
              </Button>
            </Link>
            <Button
              type="button"
              variant="danger"
              className="w-full"
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
            >
              Logout
            </Button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:hidden">
            <Link href="/login" onClick={() => setMenuOpen(false)}>
              <Button variant="ghost" className="w-full">
                Login
              </Button>
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)}>
              <Button className="w-full">Register</Button>
            </Link>
          </div>
        )}
      </div>

      {platformSettings.headerNoticeEnabled && headerNoticeText !== "" ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2">
          <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span className="inline-flex rounded-md border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
              Notice
            </span>
            <p className="truncate">{headerNoticeText}</p>
          </div>
        </div>
      ) : null}

      {!session && latestGuestAnnouncement ? (
        <div className="border-t border-[var(--border)] bg-[var(--surface)]/95 px-4 py-2">
          <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Broadcast Announcement</p>
              <p className="truncate text-sm text-[var(--text-primary)]">
                {latestGuestAnnouncement.title}: {latestGuestAnnouncement.body}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{formatRelativeDate(latestGuestAnnouncement.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!latestGuestAnnouncement.isRead ? (
                <Button variant="ghost" size="sm" onClick={() => markNotificationRead(latestGuestAnnouncement.id)}>
                  Tandai Dibaca
                </Button>
              ) : null}
              <Link href="/login">
                <Button size="sm">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
