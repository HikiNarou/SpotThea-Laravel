"use client";

import { PageShell } from "@/components/layout/page-shell";

export default function TermsPage() {
  return (
    <PageShell className="space-y-4">
      <h1 className="font-display text-4xl text-[var(--text-primary)]">Terms of Service</h1>
      <p className="text-sm leading-7 text-[var(--text-secondary)]">
        Dengan menggunakan SpotThea, pengguna setuju untuk mematuhi aturan komunitas, menghormati hak cipta, dan tidak menyalahgunakan fitur komentar/report.
      </p>
    </PageShell>
  );
}