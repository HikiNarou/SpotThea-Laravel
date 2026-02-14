"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAppStore } from "@/stores/app-store";

interface GuestOnlyGuardProps {
  children: React.ReactNode;
}

export function GuestOnlyGuard({ children }: GuestOnlyGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAppStore((state) => state.session);
  const hydrated = useAppStore((state) => state.hydrated);
  const syncSessionCollections = useAppStore((state) => state.syncSessionCollections);

  useEffect(() => {
    if (!hydrated || !session) {
      return;
    }

    void syncSessionCollections().catch(() => null);
  }, [hydrated, session, syncSessionCollections]);

  useEffect(() => {
    if (!hydrated || !session) {
      return;
    }

    const redirectTarget = session.role === "admin" || session.role === "moderator" ? "/admin" : "/me";
    if (pathname !== redirectTarget) {
      router.replace(redirectTarget);
    }
  }, [hydrated, pathname, router, session]);

  if (!hydrated || session) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Memverifikasi sesi...</p>
      </section>
    );
  }

  return <>{children}</>;
}
