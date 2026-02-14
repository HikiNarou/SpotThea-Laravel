"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchAdminReports, updateAdminReportStatus } from "@/lib/api/admin-api";
import { ApiClientError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { useAppStore } from "@/stores/app-store";
import type { ReportPayload } from "@/types/domain";

const PAGE_SIZE = 20;
const REPORT_STATUS_OPTIONS: Array<{ value: ReportPayload["status"] | "all"; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
];

export default function AdminReportsPage() {
  const session = useAppStore((state) => state.session);
  const canModerate = session?.role === "admin" || session?.role === "moderator";
  const token = session?.token;

  const [filter, setFilter] = useState<ReportPayload["status"] | "all">("open");
  const [reports, setReports] = useState<ReportPayload[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token || !canModerate) {
        return;
      }

      if (options?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetchAdminReports(
          {
            status: filter,
            page,
            pageSize: PAGE_SIZE,
          },
          token,
        );

        setReports(response.items);
        setTotal(response.total);
        setTotalPages(response.totalPages);
        setError(null);
      } catch (requestError) {
        if (requestError instanceof ApiClientError) {
          setError(requestError.message);
        } else {
          setError("Gagal memuat data report dari backend.");
        }
      } finally {
        if (options?.silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [canModerate, filter, page, token],
  );

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    if (!token || !canModerate) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadReports({ silent: true });
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [canModerate, loadReports, token]);

  const resolveLabel = useMemo(
    () => REPORT_STATUS_OPTIONS.find((item) => item.value === filter)?.label ?? "Semua",
    [filter],
  );

  const handleStatusUpdate = async (report: ReportPayload, nextStatus: ReportPayload["status"]) => {
    if (!token || !canModerate || nextStatus === report.status) {
      return;
    }

    setUpdatingReportId(report.id);
    setReports((current) => current.map((item) => (item.id === report.id ? { ...item, status: nextStatus } : item)));

    try {
      const updated = await updateAdminReportStatus(report.id, nextStatus, token);
      setReports((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setError(null);

      if (filter !== "all" && filter !== updated.status) {
        await loadReports({ silent: true });
      }
    } catch (requestError) {
      setReports((current) => current.map((item) => (item.id === report.id ? report : item)));

      if (requestError instanceof ApiClientError) {
        setError(requestError.message);
      } else {
        setError("Gagal memperbarui status report.");
      }
    } finally {
      setUpdatingReportId(null);
    }
  };

  if (!session) {
    return <EmptyState title="Login dibutuhkan" description="Silakan login sebagai moderator/admin untuk melihat report." ctaHref="/login" ctaLabel="Masuk" />;
  }

  if (!canModerate) {
    return <EmptyState title="Akses ditolak" description="Halaman report moderation hanya untuk moderator/admin." ctaHref="/admin" ctaLabel="Kembali" />;
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-[var(--text-primary)]">Moderation Reports</h1>
          <p className="text-sm text-[var(--text-secondary)]">Sumber data report 100% dari backend API production.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value as ReportPayload["status"] | "all");
              setPage(1);
            }}
            className="max-w-44"
          >
            {REPORT_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Button variant="secondary" size="sm" onClick={() => void loadReports()} isLoading={loading || refreshing}>
            Refresh
          </Button>
        </div>
      </header>

      <p className="text-xs text-[var(--text-muted)]">Filter aktif: {resolveLabel}</p>

      {error ? (
        <article className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger)]/5 px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </article>
      ) : null}

      <div className="space-y-3">
        {loading && reports.length === 0 ? (
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
            Memuat data report...
          </article>
        ) : null}

        {reports.map((report) => (
          <article key={report.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{report.reason}</p>
              <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-xs">{report.status}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Type: {report.type} · Target: {report.targetId}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{report.details}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(report.createdAt).toLocaleString("id-ID")}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" disabled={updatingReportId === report.id} onClick={() => void handleStatusUpdate(report, "reviewed")}>
                Mark Reviewed
              </Button>
              <Button variant="primary" size="sm" disabled={updatingReportId === report.id} onClick={() => void handleStatusUpdate(report, "resolved")}>
                Resolve
              </Button>
              <Button variant="ghost" size="sm" disabled={updatingReportId === report.id} onClick={() => void handleStatusUpdate(report, "open")}>
                Reopen
              </Button>
            </div>
          </article>
        ))}

        {!loading && reports.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Tidak ada laporan pada filter ini.</p> : null}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          Total report: <span className="font-medium text-[var(--text-primary)]">{total}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
            Prev
          </Button>
          <span className="text-xs text-[var(--text-muted)]">
            Page {page} / {Math.max(totalPages, 1)}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>
            Next
          </Button>
        </div>
      </footer>
    </section>
  );
}
