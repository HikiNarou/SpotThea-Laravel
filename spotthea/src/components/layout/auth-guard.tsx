"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { UserRole } from "@/types/domain";
import { useAppStore } from "@/stores/app-store";

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

export function AuthGuard({ children, roles }: AuthGuardProps) {
  const hydrated = useAppStore((state) => state.hydrated);
  const session = useAppStore((state) => state.session);
  const syncSessionCollections = useAppStore((state) => state.syncSessionCollections);

  useEffect(() => {
    if (!hydrated || !session || !roles || roles.length === 0) {
      return;
    }

    void syncSessionCollections().catch(() => null);
  }, [hydrated, roles, session, syncSessionCollections]);

  if (!hydrated) {
    return (
      <section className="mx-auto mt-16 max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">Memverifikasi sesi...</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="mx-auto mt-16 max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Login dibutuhkan</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Akses halaman ini memerlukan akun aktif.</p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/login">
            <Button>Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Register</Button>
          </Link>
        </div>
      </section>
    );
  }

  if (roles?.length && !roles.includes(session.role)) {
    return (
      <section className="mx-auto mt-16 max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Akses ditolak</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Role kamu tidak punya izin untuk halaman ini.</p>
        <div className="mt-5 flex justify-center">
          <Link href="/">
            <Button variant="secondary">Kembali ke Home</Button>
          </Link>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
