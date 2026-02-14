"use client";

import { useEffect, useRef } from "react";

import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { useAppStore } from "@/stores/app-store";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const hydrated = useAppStore((state) => state.hydrated);
  const setHydrated = useAppStore((state) => state.setHydrated);
  const session = useAppStore((state) => state.session);
  const syncSessionCollections = useAppStore((state) => state.syncSessionCollections);
  const syncGuestAnnouncements = useAppStore((state) => state.syncGuestAnnouncements);
  const syncPlatformSettings = useAppStore((state) => state.syncPlatformSettings);
  const faviconUrl = useAppStore((state) => state.platformSettings.faviconUrl);
  const syncedSessionKeyRef = useRef<string | null>(null);
  const sessionToken = session?.token;
  const sessionUserId = session?.userId;

  useEffect(() => {
    if (!hydrated) {
      setHydrated(true);
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    if (!hydrated || !sessionToken || !sessionUserId) {
      syncedSessionKeyRef.current = null;
      return;
    }

    const sessionKey = `${sessionUserId}:${sessionToken}`;
    if (syncedSessionKeyRef.current === sessionKey) {
      return;
    }

    syncedSessionKeyRef.current = sessionKey;
    void syncSessionCollections();
  }, [hydrated, sessionToken, sessionUserId, syncSessionCollections]);

  useEffect(() => {
    if (!hydrated || !sessionToken || !sessionUserId) {
      return;
    }

    const syncOnFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        void syncSessionCollections();
      }
    };

    const timer = window.setInterval(() => {
      void syncSessionCollections();
    }, 20000);

    window.addEventListener("focus", syncOnFocusOrVisible);
    document.addEventListener("visibilitychange", syncOnFocusOrVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncOnFocusOrVisible);
      document.removeEventListener("visibilitychange", syncOnFocusOrVisible);
    };
  }, [hydrated, sessionToken, sessionUserId, syncSessionCollections]);

  useEffect(() => {
    if (!hydrated || sessionToken || sessionUserId) {
      return;
    }

    void syncGuestAnnouncements();

    const timer = window.setInterval(() => {
      void syncGuestAnnouncements();
    }, 60000);

    return () => {
      window.clearInterval(timer);
    };
  }, [hydrated, sessionToken, sessionUserId, syncGuestAnnouncements]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void syncPlatformSettings();

    const syncOnFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        void syncPlatformSettings();
      }
    };

    const timer = window.setInterval(() => {
      void syncPlatformSettings();
    }, 60000);

    window.addEventListener("focus", syncOnFocusOrVisible);
    document.addEventListener("visibilitychange", syncOnFocusOrVisible);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", syncOnFocusOrVisible);
      document.removeEventListener("visibilitychange", syncOnFocusOrVisible);
    };
  }, [hydrated, syncPlatformSettings]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const nextFavicon = faviconUrl?.trim();
    let link = document.querySelector<HTMLLinkElement>("link[data-platform-favicon='true']");

    if (!nextFavicon) {
      if (link) {
        link.remove();
      }
      return;
    }

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      link.setAttribute("data-platform-favicon", "true");
      document.head.appendChild(link);
    }

    link.href = nextFavicon;
  }, [hydrated, faviconUrl]);

  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
