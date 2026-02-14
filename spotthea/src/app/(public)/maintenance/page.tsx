"use client";

import Link from "next/link";
import { Settings, ShieldAlert, ShieldCheck, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { useAppStore } from "@/stores/app-store";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function MaintenancePage() {
  const session = useAppStore((state) => state.session);
  const maintenanceMode = useAppStore((state) => state.maintenanceMode);
  const setMaintenanceMode = useAppStore((state) => state.setMaintenanceMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const isAdmin = session?.role === "admin";
  const statusLabel = maintenanceMode ? "AKTIF" : "NONAKTIF";
  const statusDescription = useMemo(
    () =>
      maintenanceMode
        ? "Mode maintenance aktif. Pengguna publik akan melihat pemberitahuan maintenance."
        : "Mode maintenance nonaktif. Website berjalan normal untuk pengguna publik.",
    [maintenanceMode],
  );

  return (
    <PageShell className="min-h-[65vh] py-8 md:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[linear-gradient(135deg,rgba(17,24,39,0.96),rgba(13,20,34,0.98),rgba(33,20,32,0.92))] p-6 md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--accent)]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <article className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
              <Wrench size={14} />
              System Status
            </span>

            <div className="space-y-3">
              <h1 className="font-display text-4xl leading-tight text-[var(--text-primary)] md:text-5xl">Maintenance Mode</h1>
              <p className="max-w-2xl text-sm text-[var(--text-secondary)] md:text-base">
                Halaman status maintenance resmi untuk publik. Kontrol aktivasi maintenance hanya tersedia untuk akun admin yang terverifikasi.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                    maintenanceMode ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {maintenanceMode ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                  {statusLabel}
                </span>
                <p className="text-sm text-[var(--text-secondary)]">{statusDescription}</p>
              </div>
            </div>
          </article>

          <article className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 p-4 md:p-5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Panel Kontrol</h2>

            {actionError ? <p className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/10 px-3 py-2 text-sm text-[var(--danger)]">{actionError}</p> : null}
            {actionSuccess ? (
              <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{actionSuccess}</p>
            ) : null}

            {isAdmin ? (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">Akun admin terdeteksi. Kamu dapat mengubah status maintenance dari halaman ini.</p>
                <Button
                  className="w-full"
                  variant={maintenanceMode ? "danger" : "primary"}
                  isLoading={isSubmitting}
                  onClick={async () => {
                    setActionError(null);
                    setActionSuccess(null);
                    setIsSubmitting(true);

                    const result = await setMaintenanceMode(!maintenanceMode);
                    if (!result.ok) {
                      setActionError(result.error);
                    } else {
                      setActionSuccess(`Maintenance mode berhasil diubah ke status ${!maintenanceMode ? "AKTIF" : "NONAKTIF"}.`);
                    }

                    setIsSubmitting(false);
                  }}
                >
                  {maintenanceMode ? "Nonaktifkan Maintenance" : "Aktifkan Maintenance"}
                </Button>
                <Link href="/admin/settings" className="block">
                  <Button className="w-full" variant="secondary">
                    <Settings size={15} />
                    Buka Admin Settings
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-secondary)]">
                  {session ? "Akun kamu bukan admin. Maintenance mode hanya bisa diubah oleh admin." : "Login sebagai admin untuk mengelola maintenance mode."}
                </p>
                {session ? (
                  <Link href="/" className="block">
                    <Button className="w-full" variant="secondary">
                      Kembali ke Home
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login" className="block">
                    <Button className="w-full">Login Admin</Button>
                  </Link>
                )}
              </div>
            )}
          </article>
        </div>
      </section>
    </PageShell>
  );
}
