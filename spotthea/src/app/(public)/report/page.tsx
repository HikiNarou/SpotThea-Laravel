"use client";

import { ReportForm } from "@/components/forms/report-form";
import { PageShell } from "@/components/layout/page-shell";

export default function ReportPage() {
  return (
    <PageShell className="space-y-4">
      <h1 className="font-display text-4xl text-[var(--text-primary)]">Report Problem</h1>
      <p className="text-sm text-[var(--text-secondary)]">Laporkan konten rusak, pelanggaran, atau masalah platform.</p>
      <ReportForm />
    </PageShell>
  );
}