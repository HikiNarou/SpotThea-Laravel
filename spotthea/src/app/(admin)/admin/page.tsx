"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchAdminDashboard } from "@/lib/api/admin-api";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import type { ReportPayload } from "@/types/domain";

export default function AdminDashboardPage() {
  const session = useAppStore((state) => state.session);
  const [dashboardKpi, setDashboardKpi] = useState<{
    mangaCount: number;
    chapterCount: number;
    userCount: number;
    openReportCount: number;
  } | null>(null);
  const [recentReports, setRecentReports] = useState<ReportPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openReports = recentReports.filter((report) => report.status === "open");

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    let isActive = true;

    const loadDashboardKpi = async () => {
      try {
        setLoading(true);
        const response = await fetchAdminDashboard(session.token);
        if (!isActive) {
          return;
        }

        setDashboardKpi(response.kpi);
        setRecentReports(response.recentReports);
        setError(null);
      } catch {
        if (!isActive) {
          return;
        }

        setError("Gagal memuat dashboard admin. Pastikan server API tersedia.");
      } finally {
        if (!isActive) {
          return;
        }

        setLoading(false);
      }
    };

    void loadDashboardKpi();

    const timer = window.setInterval(() => {
      void loadDashboardKpi();
    }, 15000);

    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, [session?.token]);

  if (!dashboardKpi && loading) {
    return (
      <section className="space-y-5">
        <header className="space-y-2">
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Admin Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)]">Memuat metrik dashboard...</p>
        </header>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-[var(--text-primary)]">Admin Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)]">Monitor katalog, users, dan laporan moderation.</p>
      </header>

      {error ? (
        <article className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">
          <div className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                if (!session?.token) {
                  return;
                }

                setError(null);
                setLoading(true);
                try {
                  const response = await fetchAdminDashboard(session.token);
                  setDashboardKpi(response.kpi);
                  setRecentReports(response.recentReports);
                  setError(null);
                } catch (requestError) {
                  if (requestError instanceof ApiClientError) {
                    setError(requestError.message);
                  } else {
                    setError("Gagal memuat dashboard admin. Pastikan server API tersedia.");
                  }
                } finally {
                  setLoading(false);
                }
              }}
              isLoading={loading}
            >
              Retry
            </Button>
          </div>
        </article>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Total Manga</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{dashboardKpi?.mangaCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Total Chapters</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{dashboardKpi?.chapterCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Registered Users</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{dashboardKpi?.userCount ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-xs text-[var(--text-muted)]">Open Reports</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{dashboardKpi?.openReportCount ?? 0}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pending Reports</h2>
          <Link href="/admin/reports" className="text-sm text-[var(--accent)] hover:underline">
            Buka semua laporan
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {openReports.slice(0, 5).map((report) => (
            <article key={report.id} className="rounded-xl border border-[var(--border)] p-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{report.reason}</p>
              <p className="text-xs text-[var(--text-secondary)]">{report.type} · {report.targetId}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{report.details}</p>
            </article>
          ))}

          {openReports.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Tidak ada report yang pending.</p> : null}
        </div>
      </section>
    </section>
  );
}
